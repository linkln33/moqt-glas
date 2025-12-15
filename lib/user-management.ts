import { createServerClient } from '@/lib/supabase/client';

export interface VotingUserProfile {
  id: string;
  auth_user_id: string | null;
  telegram_id: number | null;
  first_name: string;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  is_verified: boolean;
  is_active: boolean;
  role: 'voter' | 'admin' | 'moderator';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  last_vote_at: string | null;
}

export interface VotingUserStatistics {
  id: string;
  telegram_id: number | null;
  auth_user_id: string | null;
  first_name: string;
  last_name: string | null;
  username: string | null;
  role: 'voter' | 'admin' | 'moderator';
  created_at: string;
  last_login_at: string | null;
  last_vote_at: string | null;
  total_votes: number;
  elections_participated: number;
  active_elections_participated: number;
  last_vote_timestamp: string | null;
}

export interface CreateUserFromTelegramParams {
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

/**
 * Get or create a user profile from Telegram authentication data
 */
export async function getOrCreateUserFromTelegram(
  params: CreateUserFromTelegramParams
): Promise<VotingUserProfile | null> {
  const supabase = createServerClient();

  try {
    // 1) Try to find existing user
    const { data: existingUser, error: selectError } = await supabase
      .from('voting_user_profiles')
      .select('*')
      .eq('telegram_id', params.telegram_id)
      .maybeSingle();

    if (selectError) {
      console.error('Select error when checking existing user:', selectError);
    }

    const now = new Date().toISOString();

    if (existingUser) {
      // 2) Update existing user with latest info
      const { data: updatedUser, error: updateError } = await supabase
        .from('voting_user_profiles')
        .update({
          first_name: params.first_name,
          last_name: params.last_name || null,
          username: params.username || null,
          photo_url: params.photo_url || null,
          is_verified: true,
          last_login_at: now,
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error when refreshing existing user:', updateError);
        return null;
      }

      return updatedUser as VotingUserProfile;
    }

    // 3) Insert new user if none exists
    const insertPayload = {
      telegram_id: params.telegram_id,
      first_name: params.first_name,
      last_name: params.last_name || null,
      username: params.username || null,
      photo_url: params.photo_url || null,
      is_verified: true,
      last_login_at: now,
    };

    let insertResult = await supabase
      .from('voting_user_profiles')
      .insert(insertPayload)
      .select()
      .single();

    // If username uniqueness causes conflict, retry with username null
    if (insertResult.error && insertResult.error.code === '23505') {
      console.warn('Username conflict detected, retrying insert without username');
      insertResult = await supabase
        .from('voting_user_profiles')
        .insert({ ...insertPayload, username: null })
        .select()
        .single();
    }

    if (insertResult.error) {
      console.error('Insert error creating user from Telegram:', insertResult.error);
      return null;
    }

    return insertResult.data as VotingUserProfile;
  } catch (error: any) {
    console.error('Exception getting/creating user from Telegram:', {
      message: error?.message,
      stack: error?.stack,
    });
    return null;
  }
}

/**
 * Get user profile by Telegram ID
 */
export async function getUserByTelegramId(
  telegramId: number
): Promise<VotingUserProfile | null> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('voting_user_profiles')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error getting user by Telegram ID:', error);
      return null;
    }

    return data as VotingUserProfile;
  } catch (error) {
    console.error('Exception getting user by Telegram ID:', error);
    return null;
  }
}

/**
 * Get user profile by ID
 */
export async function getUserById(
  userId: string
): Promise<VotingUserProfile | null> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('voting_user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting user by ID:', error);
      return null;
    }

    return data as VotingUserProfile;
  } catch (error) {
    console.error('Exception getting user by ID:', error);
    return null;
  }
}

/**
 * Update user's last login timestamp
 */
export async function updateUserLastLogin(
  userId: string
): Promise<boolean> {
  const supabase = createServerClient();

  try {
    const { error } = await supabase.rpc('update_voting_user_last_login', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error updating user last login:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating user last login:', error);
    return false;
  }
}

/**
 * Get user statistics
 */
export async function getUserStatistics(
  userId: string
): Promise<VotingUserStatistics | null> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('voting_user_statistics')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting user statistics:', error);
      return null;
    }

    return data as VotingUserStatistics;
  } catch (error) {
    console.error('Exception getting user statistics:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<VotingUserProfile, 'first_name' | 'last_name' | 'username' | 'photo_url' | 'email' | 'phone' | 'metadata'>>
): Promise<VotingUserProfile | null> {
  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('voting_user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data as VotingUserProfile;
  } catch (error) {
    console.error('Exception updating user profile:', error);
    return null;
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(
  userId: string
): Promise<boolean> {
  const user = await getUserById(userId);
  return user?.role === 'admin' || false;
}

/**
 * Check if user is moderator or admin
 */
export async function isUserModeratorOrAdmin(
  userId: string
): Promise<boolean> {
  const user = await getUserById(userId);
  return user?.role === 'admin' || user?.role === 'moderator' || false;
}
