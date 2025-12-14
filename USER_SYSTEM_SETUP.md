# User System Setup - Моят Глас

## Overview

A comprehensive user management system has been set up in Supabase to support the voting platform. The system supports both Supabase Auth and Telegram authentication methods.

## Database Schema

### Tables Created

#### 1. `voting_user_profiles`
Main user profiles table that stores user information.

**Columns:**
- `id` (UUID, Primary Key) - Unique user identifier
- `auth_user_id` (UUID, Foreign Key) - References `auth.users` for Supabase Auth integration
- `telegram_id` (BIGINT, Unique) - Telegram user ID
- `first_name` (TEXT, Required) - User's first name
- `last_name` (TEXT, Optional) - User's last name
- `username` (TEXT, Optional) - Username
- `photo_url` (TEXT, Optional) - Profile photo URL
- `email` (TEXT, Optional) - Email address
- `phone` (TEXT, Optional) - Phone number
- `is_verified` (BOOLEAN) - Verification status (default: false)
- `is_active` (BOOLEAN) - Active status (default: true)
- `role` (TEXT) - User role: 'voter', 'admin', or 'moderator' (default: 'voter')
- `metadata` (JSONB) - Additional metadata
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp
- `last_login_at` (TIMESTAMP) - Last login timestamp
- `last_vote_at` (TIMESTAMP) - Last vote timestamp

**Constraints:**
- At least one identifier must exist: `telegram_id`, `auth_user_id`, `email`, or `phone`
- `telegram_id` is unique
- `role` must be one of: 'voter', 'admin', 'moderator'

#### 2. `voting_user_sessions`
Tracks active user sessions for security and analytics.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key) - References `voting_user_profiles`
- `session_token` (TEXT, Unique) - Session token
- `device_fingerprint` (TEXT) - Device fingerprint
- `ip_address` (TEXT) - IP address
- `user_agent` (TEXT) - User agent string
- `is_active` (BOOLEAN) - Active status
- `expires_at` (TIMESTAMP) - Expiration timestamp
- `created_at` (TIMESTAMP) - Creation timestamp
- `last_activity_at` (TIMESTAMP) - Last activity timestamp

#### 3. Enhanced `voters` Table
The existing `voters` table has been enhanced with:
- `voting_user_id` (UUID, Foreign Key) - References `voting_user_profiles`

This maintains backward compatibility while linking to the new user system.

### Views

#### `voting_user_statistics`
Aggregated user statistics view providing:
- Total votes cast
- Elections participated
- Active elections participated
- Last vote timestamp
- User profile information

### Functions

#### `get_or_create_voting_user_from_telegram`
Creates or updates a user profile from Telegram authentication data.

**Parameters:**
- `p_telegram_id` (BIGINT)
- `p_first_name` (TEXT)
- `p_last_name` (TEXT, Optional)
- `p_username` (TEXT, Optional)
- `p_photo_url` (TEXT, Optional)

**Returns:** `voting_user_profiles` record

#### `update_voting_user_last_login`
Updates the last login timestamp for a user.

**Parameters:**
- `p_user_id` (UUID)

### Triggers

1. **`trigger_sync_voter_to_voting_user_profile`**
   - Automatically syncs voter data to `voting_user_profiles` when a voter is created or updated
   - Ensures data consistency between `voters` and `voting_user_profiles`

2. **`update_voting_user_profiles_updated_at`**
   - Automatically updates `updated_at` timestamp when a profile is modified

3. **`update_voting_user_profile_last_vote_trigger`**
   - Updates `last_vote_at` in `voting_user_profiles` when a vote is cast

## Row Level Security (RLS)

### Policies

#### `voting_user_profiles`
- **Users can view their own profile**: Users can view their own profile via `auth_user_id` or `telegram_id`
- **Users can update their own profile**: Users can update their own profile
- **Admins can view all profiles**: Users with admin role can view all profiles
- **Public can view basic profile info**: Basic profile information is publicly viewable

#### `voting_user_sessions`
- **Users can view their own sessions**: Users can only view their own session data

#### `suspicious_activities`
- **Users can view their own suspicious activities**: Users can view activities related to their account
- **Admins can view all suspicious activities**: Admins have full access

## TypeScript Integration

### Library: `lib/user-management.ts`

Provides TypeScript functions for user management:

- `getOrCreateUserFromTelegram()` - Get or create user from Telegram auth
- `getUserByTelegramId()` - Get user by Telegram ID
- `getUserById()` - Get user by ID
- `updateUserLastLogin()` - Update last login timestamp
- `getUserStatistics()` - Get user statistics
- `updateUserProfile()` - Update user profile
- `isUserAdmin()` - Check if user is admin
- `isUserModeratorOrAdmin()` - Check if user is moderator or admin

### Types

- `VotingUserProfile` - User profile interface
- `VotingUserStatistics` - User statistics interface
- `CreateUserFromTelegramParams` - Parameters for creating user from Telegram

## API Integration

### Updated: `/api/auth/telegram/verify`

The Telegram authentication endpoint has been updated to:
1. Verify Telegram authentication
2. Create or get user profile using `getOrCreateUserFromTelegram()`
3. Update last login timestamp
4. Create/update voter record for backward compatibility
5. Return enhanced user data including `id`, `role`, and `isVerified`

## Migration Status

✅ Migration `create_voting_user_system` - Applied successfully
✅ Migration `fix_security_issues_voting` - Applied successfully
✅ Existing voters synced to `voting_user_profiles`
✅ Security advisors reviewed and fixed

## Usage Examples

### Creating a user from Telegram auth

```typescript
import { getOrCreateUserFromTelegram } from '@/lib/user-management';

const user = await getOrCreateUserFromTelegram({
  telegram_id: 123456789,
  first_name: 'Иван',
  last_name: 'Иванов',
  username: 'ivan_ivanov',
  photo_url: 'https://...',
});
```

### Getting user statistics

```typescript
import { getUserStatistics } from '@/lib/user-management';

const stats = await getUserStatistics(userId);
console.log(`User has cast ${stats.total_votes} votes`);
```

### Checking user role

```typescript
import { isUserAdmin } from '@/lib/user-management';

const isAdmin = await isUserAdmin(userId);
if (isAdmin) {
  // Admin-only functionality
}
```

## Security Features

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Function Security**: All functions have fixed `search_path` to prevent SQL injection
3. **View Security**: Views are created without `SECURITY DEFINER` to use caller's permissions
4. **Data Validation**: Constraints ensure data integrity
5. **Automatic Sync**: Triggers maintain consistency between related tables

## Next Steps

1. **Supabase Auth Integration**: Set up Supabase Auth for email/password authentication
2. **Session Management**: Implement session creation and management
3. **Admin Dashboard**: Create admin interface for user management
4. **User Profile Pages**: Create user profile display pages
5. **Statistics Dashboard**: Display user statistics in dashboard

## Notes

- The system maintains backward compatibility with the existing `voters` table
- Telegram authentication is considered verified (`is_verified = true`)
- All timestamps are automatically managed by triggers
- The system supports both Telegram-only users and users with Supabase Auth
