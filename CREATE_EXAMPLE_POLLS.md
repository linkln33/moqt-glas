# Creating Example Polls

This guide explains how to create the 3 example polls that appear on the home page.

## Option 1: Using SQL Migration (Recommended)

Run the SQL migration file in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Open and run: `supabase/migrations/003_example_polls.sql`

This will create 3 example polls:
- **Ако днес бяха изборите за кого бихте гласували** - If elections were today, who would you vote for? (all Bulgarian political parties)
- **Кой трябва да влезе в затвора** - Who should go to prison? (Тиквата, Свинята, Радо Геля)
- **Пирамида ли е Исторически парк** - Is Historical Park a pyramid scheme? (Yes/No/Not sure)

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

### Poll 1: Ако днес бяха изборите за кого бихте гласували
- Single-choice question
- 9 options: All major Bulgarian political parties
  - ГЕРБ, ПП-ДБ, Възраждане, ДПС-НН, БСП-ОЛ, АРФ, ИТН, Величие, Друга / Никоя
- Active for 30 days

### Poll 2: Кой трябва да влезе в затвора
- Single-choice question
- 5 options: Тиквата, Свинята, Радо Геля, Всички, Никой
- Active for 25 days

### Poll 3: Пирамида ли е Исторически парк
- Single-choice question
- 3 options: Да, Не, Не съм сигурен
- Active for 20 days

## Display on Home Page

The example polls are automatically displayed on the home page in a new "Примерни анкети" (Example Polls) section. They are fetched based on `created_by = 'example'` and `status = 'active'`.

## Notes

- All polls are marked with `created_by: 'example'` to distinguish them from user-created polls
- The polls are set to `status: 'active'` so they appear in the active elections list
- Start dates are set in the past to make them immediately active
- End dates are set 20-30 days in the future
