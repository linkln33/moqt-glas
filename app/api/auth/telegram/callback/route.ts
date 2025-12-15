import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramAuth, getTelegramId } from '@/lib/telegram-auth';
import { createServerClient, isServerClientConfigured } from '@/lib/supabase/client';
import { getOrCreateUserFromTelegram, updateUserLastLogin } from '@/lib/user-management';

// Mark route as dynamic since it uses searchParams
export const dynamic = 'force-dynamic';

/**
 * Handle Telegram Login Widget redirect
 * GET /api/auth/telegram/callback?id=...&first_name=...&hash=...
 * 
 * This route is called when using data-auth-url instead of data-onauth
 * Works even when browsers block third-party cookies
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://moqt-glas.onrender.com';

    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not configured');
      return NextResponse.redirect(new URL('/login?error=config', appUrl));
    }

    // Validate bot token format (should be number:alphanumeric)
    if (!botToken.includes(':')) {
      console.error('❌ TELEGRAM_BOT_TOKEN format invalid (should contain colon)');
      return NextResponse.redirect(new URL('/login?error=config', appUrl));
    }

    if (!serviceRoleKey || serviceRoleKey === 'your_service_role_key_here' || serviceRoleKey.includes('placeholder')) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured properly', {
        hasKey: !!serviceRoleKey,
        keyPreview: serviceRoleKey?.substring(0, 20),
      });
      return NextResponse.redirect(new URL('/login?error=config', appUrl));
    }

    if (!isServerClientConfigured()) {
      console.error('❌ Supabase server client not configured (URL or key placeholder)');
      return NextResponse.redirect(new URL('/login?error=config', appUrl));
    }

    // Extract auth data from query parameters
    // Telegram sends all values as strings in URL params
    const authData = {
      id: parseInt(searchParams.get('id') || '0', 10),
      first_name: searchParams.get('first_name') || '',
      last_name: searchParams.get('last_name') || undefined,
      username: searchParams.get('username') || undefined,
      photo_url: searchParams.get('photo_url') || undefined,
      auth_date: parseInt(searchParams.get('auth_date') || '0', 10),
      hash: searchParams.get('hash') || '',
    };

    console.log('📥 Received Telegram auth via redirect:', {
      id: authData.id,
      first_name: authData.first_name,
      hasHash: !!authData.hash,
      hashLength: authData.hash.length,
    });

    // Validate required fields
    if (!authData.id || !authData.first_name || !authData.auth_date || !authData.hash) {
      console.error('❌ Missing required fields in redirect');
      return NextResponse.redirect(new URL('/login?error=invalid', appUrl));
    }

    // Verify Telegram authentication
    console.log('🔍 Verifying Telegram auth...');
    const isValid = verifyTelegramAuth(authData, botToken);

    if (!isValid) {
      console.error('❌ Telegram auth verification failed');
      return NextResponse.redirect(new URL('/login?error=auth', appUrl));
    }

    console.log('✅ Telegram authentication verified');

    const telegramId = getTelegramId(authData);
    const supabase = createServerClient();

    // Get or create user profile
    console.log('Creating/getting user profile for Telegram ID:', telegramId);
    const userProfile = await getOrCreateUserFromTelegram({
      telegram_id: telegramId,
      first_name: authData.first_name,
      last_name: authData.last_name,
      username: authData.username,
      photo_url: authData.photo_url,
    });

    if (!userProfile) {
      console.error('❌ Failed to get or create user profile via RPC, attempting voter fallback');

      const { data: fallbackVoter, error: fallbackError } = await supabase
        .from('voters')
        .upsert(
          {
            telegram_id: telegramId,
            first_name: authData.first_name,
            last_name: authData.last_name || null,
            username: authData.username || null,
            photo_url: authData.photo_url || null,
          },
          { onConflict: 'telegram_id' }
        )
        .select()
        .single();

      if (fallbackError || !fallbackVoter) {
        console.error('Fallback voter creation also failed:', fallbackError);
        return NextResponse.redirect(new URL('/login?error=user', appUrl));
      }

      console.log('✅ Fallback voter created, proceeding with redirect');

      const redirectUrl = new URL('/login', appUrl);
      redirectUrl.searchParams.set('success', 'true');
      redirectUrl.searchParams.set('userId', fallbackVoter.telegram_id.toString());
      redirectUrl.searchParams.set('telegramId', telegramId.toString());
      redirectUrl.searchParams.set('role', 'voter');
      redirectUrl.searchParams.set('firstName', authData.first_name);
      if (authData.last_name) redirectUrl.searchParams.set('lastName', authData.last_name);
      if (authData.username) redirectUrl.searchParams.set('username', authData.username);

      return NextResponse.redirect(redirectUrl);
    }

    console.log('User profile created/retrieved:', {
      userId: userProfile.id,
      telegramId: userProfile.telegram_id,
    });

    // Update last login
    await updateUserLastLogin(userProfile.id);

    // Also create/update voter record (for backward compatibility)
    const { error: voterError } = await supabase
      .from('voters')
      .upsert({
        telegram_id: telegramId,
        first_name: authData.first_name,
        last_name: authData.last_name || null,
        username: authData.username || null,
        photo_url: authData.photo_url || null,
        voting_user_id: userProfile.id,
      }, {
        onConflict: 'telegram_id',
      });

    if (voterError) {
      console.error('Voter creation error (non-fatal):', voterError);
      // Don't fail the request if voter creation fails, user profile is already created
    }

    console.log('✅ User authenticated:', {
      userId: userProfile.id,
      telegramId: userProfile.telegram_id,
      role: userProfile.role,
    });

    // Redirect to login page with success and session data
    // The client-side will handle storing the session in localStorage
    const redirectUrl = new URL('/login', appUrl);
    redirectUrl.searchParams.set('success', 'true');
    redirectUrl.searchParams.set('userId', userProfile.id);
    redirectUrl.searchParams.set('telegramId', userProfile.telegram_id?.toString() || telegramId.toString());
    redirectUrl.searchParams.set('role', userProfile.role || 'voter');
    
    // Also include auth data for client-side storage
    redirectUrl.searchParams.set('firstName', authData.first_name);
    if (authData.last_name) {
      redirectUrl.searchParams.set('lastName', authData.last_name);
    }
    if (authData.username) {
      redirectUrl.searchParams.set('username', authData.username);
    }
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Error in Telegram callback:', error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://moqt-glas.onrender.com';
    return NextResponse.redirect(new URL('/login?error=server', appUrl));
  }
}
