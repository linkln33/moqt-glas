# Quick Start: Create Example Polls

The example polls section on the home page won't show until you create the polls in your database.

## The 3 Example Polls

1. **Ако днес бяха изборите за кого бихте гласували** - All Bulgarian political parties
2. **Кой трябва да влезе в затвора** - Тиквата, Свинята, Радо Геля
3. **Пирамида ли е Исторически парк** - Yes/No/Not sure

## Quick Method: Run SQL in Supabase

1. **Go to your Supabase Dashboard**
   - Navigate to: SQL Editor

2. **Copy and paste the SQL from `supabase/migrations/003_example_polls.sql`**

   Or copy this simplified version:

```sql
-- Poll 1: Ако днес бяха изборите за кого бихте гласували
DO $$
DECLARE
  election_id_1 UUID;
  question_id_1 UUID;
BEGIN
  INSERT INTO elections (title, title_bg, description, description_bg, status, start_date, end_date, created_by)
  VALUES (
    'If elections were today, who would you vote for?',
    'Ако днес бяха изборите за кого бихте гласували',
    'Which political party would you vote for if elections were today?',
    'За коя политическа партия бихте гласували, ако днес бяха изборите?',
    'active',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '30 days',
    'example'
  )
  RETURNING id INTO election_id_1;

  INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
  VALUES (
    election_id_1,
    'If elections were today, who would you vote for?',
    'Ако днес бяха изборите за кого бихте гласували?',
    'single-choice',
    0
  )
  RETURNING id INTO question_id_1;

  INSERT INTO options (question_id, option_text, option_text_bg, order_index) VALUES
    (question_id_1, 'GERB (Citizens for European Development of Bulgaria)', 'ГЕРБ (Граждани за европейско развитие на България)', 0),
    (question_id_1, 'PP-DB (We Continue the Change – Democratic Bulgaria)', 'ПП-ДБ (Продължаваме промяната – Демократична България)', 1),
    (question_id_1, 'Vazrazhdane (Revival)', 'Възраждане', 2),
    (question_id_1, 'DPS-NN (Movement for Rights and Freedoms – New Beginning)', 'ДПС-НН (Движение за права и свободи – Ново начало)', 3),
    (question_id_1, 'BSP-OL (Bulgarian Socialist Party – United Left)', 'БСП-ОЛ (Българска социалистическа партия – Обединена левица)', 4),
    (question_id_1, 'ARF (Alliance for Rights and Freedoms)', 'АРФ (Алианс за права и свободи)', 5),
    (question_id_1, 'ITN (There Is Such a People)', 'ИТН (Има такъв народ)', 6),
    (question_id_1, 'Velichie (Величие)', 'Величие', 7),
    (question_id_1, 'Other / None', 'Друга / Никоя', 8);
END $$;

-- Poll 2: Кой трябва да влезе в затвора
DO $$
DECLARE
  election_id_2 UUID;
  question_id_2 UUID;
BEGIN
  INSERT INTO elections (title, title_bg, description, description_bg, status, start_date, end_date, created_by)
  VALUES (
    'Who should go to prison?',
    'Кой трябва да влезе в затвора',
    'Who should go to prison?',
    'Кой трябва да влезе в затвора?',
    'active',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '25 days',
    'example'
  )
  RETURNING id INTO election_id_2;

  INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
  VALUES (
    election_id_2,
    'Who should go to prison?',
    'Кой трябва да влезе в затвора?',
    'single-choice',
    0
  )
  RETURNING id INTO question_id_2;

  INSERT INTO options (question_id, option_text, option_text_bg, order_index) VALUES
    (question_id_2, 'Tikvata', 'Тиквата', 0),
    (question_id_2, 'Svinyata', 'Свинята', 1),
    (question_id_2, 'Rado Gelya', 'Радо Геля', 2),
    (question_id_2, 'All of them', 'Всички', 3),
    (question_id_2, 'None', 'Никой', 4);
END $$;

-- Poll 3: Пирамида ли е Исторически парк
DO $$
DECLARE
  election_id_3 UUID;
  question_id_3 UUID;
BEGIN
  INSERT INTO elections (title, title_bg, description, description_bg, status, start_date, end_date, created_by)
  VALUES (
    'Is Historical Park a pyramid scheme?',
    'Пирамида ли е Исторически парк',
    'Is Historical Park a pyramid scheme?',
    'Пирамида ли е Исторически парк?',
    'active',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '20 days',
    'example'
  )
  RETURNING id INTO election_id_3;

  INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
  VALUES (
    election_id_3,
    'Is Historical Park a pyramid scheme?',
    'Пирамида ли е Исторически парк?',
    'single-choice',
    0
  )
  RETURNING id INTO question_id_3;

  INSERT INTO options (question_id, option_text, option_text_bg, order_index) VALUES
    (question_id_3, 'Yes', 'Да', 0),
    (question_id_3, 'No', 'Не', 1),
    (question_id_3, 'Not sure', 'Не съм сигурен', 2);
END $$;
```

3. **Click "Run"** in the SQL Editor

4. **Refresh your home page** - the example polls should now appear!

## Alternative: Use the TypeScript Script

If you prefer using the script:

```bash
# Make sure you have environment variables set
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"

# Run the script
npm run create-example-polls
```

## Verify the Polls Were Created

After running the SQL, you can verify by checking:

1. Go to Supabase Dashboard → Table Editor → `elections`
2. Filter by `created_by = 'example'`
3. You should see 3 elections

Or just refresh your home page - the polls should appear in the "Примерни анкети" section!
