import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, isServerClientConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const isConfigured = isServerClientConfigured();
    
    if (!isConfigured) {
      return NextResponse.json({
        error: 'Service role key not configured',
        configured: false,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyPreview: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
      });
    }

    const supabase = createServerClient();
    
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('voting_user_profiles')
      .select('count')
      .limit(1);

    // Test RPC function
    let rpcTest = null;
    let rpcError = null;
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc(
        'get_or_create_voting_user_from_telegram',
        {
          p_telegram_id: 999999999,
          p_first_name: 'Test',
          p_last_name: null,
          p_username: null,
          p_photo_url: null,
        }
      );
      rpcTest = rpcData;
      rpcError = rpcErr;
    } catch (e: any) {
      rpcError = { message: e.message, stack: e.stack };
    }

    return NextResponse.json({
      configured: true,
      databaseConnection: testError ? { error: testError.message } : { success: true },
      rpcFunction: rpcError ? { error: rpcError } : { success: true, data: rpcTest },
      env: {
        hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
        hasBotName: !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME,
        botName: process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
