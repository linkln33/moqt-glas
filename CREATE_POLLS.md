# Creating Polls - Guide

Complete guide for creating polls and example elections in the Моят Глас platform.

## Quick Start: Example Polls

The example polls section on the home page won't show until you create the polls in your database.

### The 3 Example Polls

1. **Ако днес бяха изборите за кого бихте гласували** - All Bulgarian political parties
2. **Кой трябва да влезе в затвора** - Тиквата, Свинята, Радо Геля
3. **Пирамида ли е Исторически парк** - Yes/No/Not sure

### Method 1: Using SQL Migration (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to: SQL Editor

2. **Run the migration file**
   - Open and run: `supabase/migrations/003_example_polls.sql`
   - Or copy the SQL from the file and paste it into the SQL Editor

3. **Click "Run"** in the SQL Editor

4. **Refresh your home page** - the example polls should now appear!

### Method 2: Using TypeScript Script

```bash
# Make sure you have environment variables set
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"

# Run the script
npm run create-example-polls
```

Or directly with tsx:

```bash
tsx scripts/create-example-polls.ts
```

### Verify the Polls Were Created

After running the SQL, you can verify by checking:

1. Go to Supabase Dashboard → Table Editor → `elections`
2. Filter by `created_by = 'example'`
3. You should see 3 elections

Or just refresh your home page - the polls should appear in the "Примерни анкети" section!

## Creating a Test Poll: Bulgarian Political Parties

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/002_test_bulgarian_election_simple.sql`
4. Click **Run**
5. The election will be created automatically!

### Option 2: Using Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. Navigate to `elections` table
3. Click **Insert** → **Insert row**
4. Fill in:
   - `title`: `Bulgarian Political Parties Poll`
   - `title_bg`: `Анкета за български политически партии`
   - `description`: `Which political party would you vote for?`
   - `description_bg`: `За коя политическа партия бихте гласували на следващите парламентарни избори?`
   - `status`: `active`
   - `start_date`: `NOW()` or current date
   - `end_date`: `30 days from now`
5. Save and note the `id`

6. Then go to `questions` table:
   - `election_id`: (the ID from above)
   - `question_text`: `Which political party would you vote for?`
   - `question_text_bg`: `За коя политическа партия бихте гласували?`
   - `question_type`: `single-choice`
   - `order_index`: `0`
7. Save and note the `id`

8. Then add options in `options` table (repeat for each):
   - `question_id`: (the question ID from above)
   - `option_text`: (English name)
   - `option_text_bg`: (Bulgarian name)
   - `order_index`: (0, 1, 2, etc.)

## Political Parties Included

Based on October 2024 election results:

1. **ГЕРБ** (GERB) - 25.52% - Citizens for European Development of Bulgaria
2. **ПП-ДБ** (PP-DB) - 13.75% - We Continue the Change – Democratic Bulgaria
3. **Възраждане** (Vazrazhdane) - 12.92% - Revival
4. **ДПС-НН** (DPS-NN) - 11.13% - Movement for Rights and Freedoms – New Beginning
5. **БСП-ОЛ** (BSP-OL) - 7.32% - Bulgarian Socialist Party – United Left
6. **АРФ** (ARF) - 7.24% - Alliance for Rights and Freedoms
7. **ИТН** (ITN) - 6.56% - There Is Such a People
8. **Величие** (Velichie) - 3.99% - Entered parliament in 2025
9. **Друга / Никоя** - Other / None

## What Gets Created

### Example Poll 1: Ако днес бяха изборите за кого бихте гласували
- Single-choice question
- 9 options: All major Bulgarian political parties
  - ГЕРБ, ПП-ДБ, Възраждане, ДПС-НН, БСП-ОЛ, АРФ, ИТН, Величие, Друга / Никоя
- Active for 30 days

### Example Poll 2: Кой трябва да влезе в затвора
- Single-choice question
- 5 options: Тиквата, Свинята, Радо Геля, Всички, Никой
- Active for 25 days

### Example Poll 3: Пирамида ли е Исторически парк
- Single-choice question
- 3 options: Да, Не, Не съм сигурен
- Active for 20 days

## Display on Home Page

The example polls are automatically displayed on the home page in a new "Примерни анкети" (Example Polls) section. They are fetched based on `created_by = 'example'` and `status = 'active'`.

## Notes

- All example polls are marked with `created_by: 'example'` to distinguish them from user-created polls
- The polls are set to `status: 'active'` so they appear in the active elections list
- Start dates are set in the past to make them immediately active
- End dates are set 20-30 days in the future

## After Creating

1. Refresh your app at http://localhost:3000/elections
2. You should see the new poll
3. Click "Гласувай сега" to vote
4. Select a party and submit your vote
5. View results at `/results/[election-id]`

## Verify It Worked

Run this query in Supabase SQL Editor:

```sql
SELECT 
  e.title_bg,
  q.question_text_bg,
  COUNT(o.id) as option_count
FROM elections e
JOIN questions q ON q.election_id = e.id
LEFT JOIN options o ON o.question_id = q.id
WHERE e.created_by = 'example'
GROUP BY e.id, e.title_bg, q.id, q.question_text_bg;
```

You should see 3 elections with their questions and options.
