# Create Test Poll - Bulgarian Political Parties

## Quick Setup

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
WHERE e.title_bg = 'Анкета за български политически партии'
GROUP BY e.id, e.title_bg, q.id, q.question_text_bg;
```

You should see 1 election, 1 question, and 8 options.
