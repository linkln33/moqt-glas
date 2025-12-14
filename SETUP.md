# Setup Guide - МОКТ Глас

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier)
- Upstash Redis account (free tier)
- Telegram Bot (via @BotFather)

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the migration file: `supabase/migrations/001_initial_schema.sql`
4. Copy your project URL and anon key from Settings > API

---

## Step 3: Set Up Upstash Redis

1. Create account at [upstash.com](https://upstash.com)
2. Create a new Redis database (free tier)
3. Copy the REST URL and token

---

## Step 4: Create Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the bot token
5. Send `/setdomain` to BotFather
6. Enter your domain (e.g., `yourdomain.com`)

**Note**: For local development, you'll need to use a tunnel service like ngrok or deploy to a domain.

---

## Step 5: Configure Environment Variables

Create `.env.local` file:

```env
# Telegram Bot Configuration
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_name
TELEGRAM_BOT_TOKEN=your_bot_token

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Upstash Redis
UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_upstash_redis_token

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 7: Create Test Election (Optional)

You can create test elections directly in Supabase:

```sql
-- Insert test election
INSERT INTO elections (title, title_bg, description, description_bg, status, start_date, end_date)
VALUES (
  'Test Election',
  'Тестови избори',
  'This is a test election',
  'Това са тестови избори',
  'active',
  NOW(),
  NOW() + INTERVAL '7 days'
);

-- Get election ID and insert question
INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
VALUES (
  'your-election-id',
  'Who should win?',
  'Кой трябва да спечели?',
  'single-choice',
  0
);

-- Insert options
INSERT INTO options (question_id, option_text, option_text_bg, order_index)
VALUES
  ('your-question-id', 'Option A', 'Опция А', 0),
  ('your-question-id', 'Option B', 'Опция Б', 1),
  ('your-question-id', 'Option C', 'Опция В', 2);
```

---

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

- **Netlify**: Similar to Vercel
- **Railway**: Good for full-stack apps
- **DigitalOcean App Platform**: Alternative option

---

## Troubleshooting

### Telegram Login Widget Not Working

- Ensure domain is set in BotFather
- Use HTTPS (required for production)
- For local dev, use ngrok or similar tunnel

### Database Errors

- Check Supabase connection
- Verify RLS policies
- Check service role key permissions

### Rate Limiting Not Working

- Verify Upstash Redis credentials
- Check free tier limits (10K commands/day)
- Check network connectivity

---

## Next Steps

1. Customize Bulgarian translations in `messages/bg.json`
2. Add more UI components as needed
3. Set up monitoring and alerts
4. Configure backup and recovery
5. Add admin dashboard for managing elections

---

## Support

For issues or questions, check:
- Next.js docs: https://nextjs.org/docs
- Supabase docs: https://supabase.com/docs
- Telegram Bot API: https://core.telegram.org/bots/api
