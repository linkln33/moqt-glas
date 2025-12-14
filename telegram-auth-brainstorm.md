# Telegram API Authentication for Voting App - Brainstorming

## Overview

Using Telegram's Login Widget API to verify users instead of SMS verification. This approach leverages Telegram's existing phone verification infrastructure.

---

## How Telegram Authentication Works

### Telegram Login Widget

1. **User clicks "Login with Telegram"** on your web app
2. **Telegram authenticates** the user (they're already logged into Telegram)
3. **Widget returns user data** including:
   - `id` - Unique Telegram user ID
   - `first_name`, `last_name` - User's name
   - `username` - Telegram username (optional)
   - `photo_url` - Profile photo (optional)
   - `auth_date` - Authentication timestamp
   - `hash` - Cryptographic signature for verification

4. **Backend verifies the hash** using your bot token
5. **User is authenticated** - No SMS needed!

### Key Technical Details

```typescript
// Verification process
const verifyTelegramAuth = (authData: TelegramAuthData, botToken: string) => {
  // 1. Extract hash from auth data
  const { hash, ...data } = authData;
  
  // 2. Create data check string (sorted alphabetically)
  const dataCheckString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n');
  
  // 3. Compute HMAC-SHA-256
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  // 4. Verify hash matches
  return computedHash === hash;
};
```

---

## Advantages of Telegram Authentication

### ✅ Cost Savings
- **$0 SMS costs** - No verification messages needed
- **Free infrastructure** - Telegram handles all verification
- **Only hosting costs** remain

### ✅ User Experience
- **One-click login** - Users already have Telegram
- **No phone number entry** - Eliminates friction
- **Familiar interface** - Users trust Telegram
- **Cross-platform** - Works on all devices with Telegram

### ✅ Security Benefits
- **Cryptographic verification** - HMAC-SHA-256 signature
- **No SMS interception** - No vulnerable SMS channel
- **Telegram's security** - Leverages their robust infrastructure
- **Built-in 2FA** - If user has Telegram 2FA enabled

### ✅ Development Speed
- **Faster implementation** - No SMS provider integration
- **Simpler codebase** - Less complexity
- **Fewer dependencies** - No Twilio/AWS SNS needed

---

## Disadvantages & Concerns

### ❌ Accessibility Issues

**Problem**: Users MUST have Telegram installed
- **Exclusion**: Users without Telegram can't vote
- **Digital Divide**: Requires app installation
- **Privacy Concerns**: Some users avoid Telegram

**Impact**: 
- Reduces voter participation
- May exclude certain demographics
- Not suitable for official government elections

### ❌ Phone Number Access

**Critical Limitation**: Telegram Login Widget does NOT provide phone numbers
- You get: `id`, `first_name`, `username`, `photo_url`
- You DON'T get: Phone number directly

**Workarounds**:
1. **Request contact via bot** - User must share contact (optional)
2. **Use Telegram ID as identifier** - Unique but not phone-based
3. **Hybrid approach** - Telegram auth + optional phone for verification

### ❌ Telegram Account Requirements

**Dependencies**:
- User must have Telegram account
- User must be logged into Telegram
- User must trust Telegram with their data

### ❌ Security Considerations

**Potential Issues**:
1. **Account Hijacking** - If Telegram account is compromised
2. **Bot Token Security** - Must protect bot token (used for verification)
3. **No Direct Phone Verification** - Can't verify phone number directly
4. **Telegram Policy Changes** - Dependent on Telegram's policies

### ❌ Multiple Accounts

**Risk**: Users can create multiple Telegram accounts
- One phone number can have multiple Telegram accounts (with different numbers)
- Harder to enforce "one vote per person"

---

## Implementation Approaches

### Approach 1: Pure Telegram Authentication

**How it works**:
- User logs in with Telegram Login Widget
- Use Telegram `id` as unique voter identifier
- One vote per Telegram ID per election

**Pros**:
- Simplest implementation
- Zero SMS costs
- Fast user experience

**Cons**:
- Can't verify phone number
- Users can create multiple Telegram accounts
- Less secure for high-stakes elections

**Best for**: 
- Community polls
- Non-critical elections
- Internal organization voting

### Approach 2: Telegram + Contact Sharing

**How it works**:
1. User logs in with Telegram Login Widget
2. Redirect to Telegram bot
3. Bot requests phone number via `request_contact` button
4. User shares contact
5. Verify phone number matches Telegram account

**Pros**:
- Phone number verification possible
- Still uses Telegram infrastructure
- Can detect duplicate phone numbers

**Cons**:
- More complex flow
- Requires bot interaction
- Extra step for users

**Best for**:
- Elections requiring phone verification
- Medium-security elections

### Approach 3: Hybrid - Telegram + Optional SMS

**How it works**:
1. Primary: Telegram Login Widget (fast, free)
2. Fallback: SMS verification for users without Telegram
3. Both methods create verified voter account

**Pros**:
- Maximum accessibility
- Best of both worlds
- Flexible for users

**Cons**:
- More complex implementation
- Still need SMS provider (for fallback)
- Two different verification flows

**Best for**:
- Public elections
- Maximum voter participation
- High-stakes elections

---

## Technical Implementation

### Next.js + Telegram Login Widget

```typescript
// components/telegram-login.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginProps {
  botName: string;
  onAuth: (data: TelegramAuthData) => void;
}

export function TelegramLogin({ botName, onAuth }: TelegramLoginProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'handleTelegramAuth');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    // Global callback function
    (window as any).handleTelegramAuth = (user: TelegramAuthData) => {
      onAuth(user);
    };

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete (window as any).handleTelegramAuth;
    };
  }, [botName, onAuth]);

  return <div ref={containerRef} />;
}
```

### Backend Verification (API Route)

```typescript
// app/api/auth/telegram/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

function verifyTelegramAuth(
  authData: TelegramAuthData,
  botToken: string
): boolean {
  const { hash, ...data } = authData;
  
  // Create data check string
  const dataCheckString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n');
  
  // Compute secret key
  const secretKey = crypto
    .createHash('sha256')
    .update(botToken)
    .digest();
  
  // Compute HMAC
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  // Check if hash matches
  if (computedHash !== hash) {
    return false;
  }
  
  // Check if auth is not too old (optional, recommended: 24 hours)
  const authDate = new Date(authData.auth_date * 1000);
  const now = new Date();
  const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff > 24) {
    return false; // Auth too old
  }
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const authData: TelegramAuthData = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json(
        { error: 'Bot token not configured' },
        { status: 500 }
      );
    }
    
    // Verify authentication
    const isValid = verifyTelegramAuth(authData, botToken);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }
    
    // Create or update user session
    // Store Telegram ID in database
    // Create JWT or session token
    
    return NextResponse.json({
      success: true,
      user: {
        telegramId: authData.id,
        firstName: authData.first_name,
        lastName: authData.last_name,
        username: authData.username,
        photoUrl: authData.photo_url,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
```

### Database Schema

```sql
-- Voters table (using Telegram ID)
CREATE TABLE voters (
  telegram_id BIGINT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  username TEXT,
  photo_url TEXT,
  phone_number TEXT, -- Optional, if shared via bot
  verified_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY,
  election_id UUID REFERENCES elections(id),
  telegram_id BIGINT REFERENCES voters(telegram_id),
  question_id UUID,
  selected_options JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(election_id, telegram_id, question_id)
);

-- Index for fast lookups
CREATE INDEX idx_votes_election_telegram ON votes(election_id, telegram_id);
```

---

## Security Considerations

### ✅ What Telegram Provides

1. **Cryptographic Verification**: HMAC-SHA-256 signature
2. **Timestamp Validation**: Can check auth_date freshness
3. **Bot Token Security**: Only you have the secret key
4. **No Replay Attacks**: Hash includes auth_date

### ⚠️ Security Gaps to Address

1. **Multiple Accounts**: 
   - **Solution**: Request phone number via bot, check for duplicates
   - **Alternative**: Rate limit per IP address

2. **Account Compromise**:
   - **Solution**: Require Telegram 2FA for high-stakes elections
   - **Monitor**: Unusual voting patterns

3. **Bot Token Leakage**:
   - **Solution**: Store in environment variables, never commit
   - **Rotate**: Regularly rotate bot token

4. **Auth Date Replay**:
   - **Solution**: Reject auth older than 24 hours
   - **Store**: Track used auth hashes to prevent reuse

---

## Cost Comparison

### SMS Verification Approach
- **AWS SNS**: $0.0025/SMS
- **1,000 voters**: $2.50
- **10,000 voters**: $25.00
- **100,000 voters**: $250.00

### Telegram Authentication Approach
- **Telegram API**: FREE
- **1,000 voters**: $0.00
- **10,000 voters**: $0.00
- **100,000 voters**: $0.00
- **Only hosting costs**: $0-10/month (Vercel free tier)

**Savings**: 100% of SMS costs eliminated!

---

## Use Case Analysis

### ✅ Good Fit For:

1. **Community Elections**
   - Local clubs, organizations
   - User base likely has Telegram
   - Lower security requirements

2. **Internal Company Voting**
   - Employees likely have Telegram
   - Controlled environment
   - Quick decision-making

3. **Student Elections**
   - Tech-savvy demographic
   - High Telegram adoption
   - Cost-sensitive

4. **Quick Polls & Surveys**
   - Non-critical decisions
   - Fast deployment needed
   - Low barrier to entry

### ❌ Not Ideal For:

1. **Government Elections**
   - Legal requirements for phone verification
   - Maximum accessibility needed
   - High security standards

2. **Public Referendums**
   - Must include all citizens
   - Can't exclude non-Telegram users
   - Legal compliance issues

3. **High-Stakes Elections**
   - Need direct phone verification
   - Audit requirements
   - Maximum security needed

---

## Recommended Implementation Strategy

### Phase 1: Pure Telegram Auth (MVP)
- Implement Telegram Login Widget
- Use Telegram ID as voter identifier
- One vote per Telegram ID
- **Timeline**: 1 week
- **Cost**: $0

### Phase 2: Phone Number Collection (Optional)
- Add Telegram bot for contact sharing
- Request phone number after login
- Store phone for duplicate detection
- **Timeline**: 1 week
- **Cost**: $0

### Phase 3: Hybrid Approach (If Needed)
- Add SMS fallback for non-Telegram users
- Support both authentication methods
- Unified voter database
- **Timeline**: 2 weeks
- **Cost**: SMS costs only for fallback users

---

## Code Example: Complete Flow

```typescript
// app/auth/page.tsx
'use client';

import { TelegramLogin } from '@/components/telegram-login';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleTelegramAuth = async (authData: any) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/telegram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Store session/token
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('telegram_id', result.user.telegramId);
        
        // Redirect to voting
        router.push('/elections');
      } else {
        alert('Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-8">Login to Vote</h1>
      
      {loading ? (
        <div>Verifying...</div>
      ) : (
        <TelegramLogin
          botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME!}
          onAuth={handleTelegramAuth}
        />
      )}
      
      <p className="mt-4 text-sm text-gray-600">
        Login with your Telegram account to participate in elections
      </p>
    </div>
  );
}
```

---

## Comparison Matrix

| Feature | SMS Verification | Telegram Auth | Hybrid |
|--------|-----------------|---------------|--------|
| **Cost** | $0.0025-0.05/voter | FREE | Free + SMS fallback |
| **User Friction** | Medium (enter phone) | Low (one click) | Low (choice) |
| **Accessibility** | High (any phone) | Medium (needs Telegram) | High (both options) |
| **Security** | Medium (SMS risks) | High (crypto) | High (both methods) |
| **Phone Verification** | Direct | Indirect (via bot) | Direct (SMS) |
| **Implementation** | Complex | Simple | Complex |
| **Best For** | Official elections | Community polls | Public elections |

---

## Final Recommendation

### For Your Use Case:

**Start with Telegram Authentication** if:
- ✅ Target audience likely has Telegram
- ✅ Cost is a primary concern
- ✅ Quick deployment needed
- ✅ Community/internal elections

**Add SMS Fallback** if:
- ✅ Need maximum accessibility
- ✅ Public elections
- ✅ Legal requirements
- ✅ Can afford SMS costs for fallback

**Pure SMS** if:
- ✅ Official government elections
- ✅ Maximum security required
- ✅ Legal compliance mandatory
- ✅ Budget allows for SMS costs

---

## Next Steps

1. **Create Telegram Bot** via @BotFather
2. **Set up domain** for Login Widget
3. **Implement Telegram Login** component
4. **Build verification API** route
5. **Test with small group**
6. **Add phone collection** (optional, via bot)
7. **Deploy and monitor**

---

**Conclusion**: Telegram authentication is an excellent choice for cost-effective, user-friendly voting apps, especially for community and internal elections. For maximum accessibility, consider a hybrid approach with SMS fallback.
