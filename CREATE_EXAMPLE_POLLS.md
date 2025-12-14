# Creating Example Polls

This guide explains how to create the 3 example polls that appear on the home page.

## Option 1: Using SQL Migration (Recommended)

Run the SQL migration file in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open and run: `supabase/migrations/003_example_polls.sql`

This will create 3 example polls:
- **Любим български град** - Favorite Bulgarian City (single-choice)
- **Най-добра българска храна** - Best Bulgarian Food (single-choice)
- **Технологични предпочитания** - Technology Preferences (multiple questions, including multiple-choice)

## Option 2: Using TypeScript Script

Run the TypeScript script:

```bash
npm run create-example-polls
```

Or directly with tsx:

```bash
tsx scripts/create-example-polls.ts
```

**Note**: Make sure you have the following environment variables set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## What Gets Created

### Poll 1: Любим български град
- Single-choice question
- 8 options: София, Пловдив, Варна, Бургас, Русе, Стара Загора, Велико Търново, Друг
- Active for 30 days

### Poll 2: Най-добра българска храна
- Single-choice question
- 8 options: Баница, Шопска салата, Каварма, Таратор, Мусака, Сарми, Кебапче, Друго
- Active for 25 days

### Poll 3: Технологични предпочитания
- **Question 1**: Primary device (single-choice)
  - Options: Смартфон, Лаптоп, Настолен компютър, Таблет, Друго
- **Question 2**: Social media platforms (multiple-choice)
  - Options: Facebook, Instagram, Twitter/X, LinkedIn, TikTok, Telegram, Никоя
- Active for 20 days

## Display on Home Page

The example polls are automatically displayed on the home page in a new "Примерни анкети" (Example Polls) section. They are fetched based on `created_by = 'example'` and `status = 'active'`.

## Notes

- All polls are marked with `created_by: 'example'` to distinguish them from user-created polls
- The polls are set to `status: 'active'` so they appear in the active elections list
- Start dates are set in the past to make them immediately active
- End dates are set 20-30 days in the future
