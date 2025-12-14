-- Simplified version: Test Election with Bulgarian Political Parties
-- Run this in Supabase SQL Editor

-- Step 1: Create the election
DO $$
DECLARE
  v_election_id UUID;
  v_question_id UUID;
BEGIN
  -- Insert election
  INSERT INTO elections (title, title_bg, description, description_bg, status, start_date, end_date)
  VALUES (
    'Bulgarian Political Parties Poll',
    'Анкета за български политически партии',
    'Which political party would you vote for in the next parliamentary elections?',
    'За коя политическа партия бихте гласували на следващите парламентарни избори?',
    'active',
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  RETURNING id INTO v_election_id;

  -- Insert question
  INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
  VALUES (
    v_election_id,
    'Which political party would you vote for?',
    'За коя политическа партия бихте гласували?',
    'single-choice',
    0
  )
  RETURNING id INTO v_question_id;

  -- Insert all party options
  INSERT INTO options (question_id, option_text, option_text_bg, order_index) VALUES
    (v_question_id, 'GERB (Citizens for European Development of Bulgaria)', 'ГЕРБ (Граждани за европейско развитие на България)', 0),
    (v_question_id, 'PP-DB (We Continue the Change – Democratic Bulgaria)', 'ПП-ДБ (Продължаваме промяната – Демократична България)', 1),
    (v_question_id, 'Vazrazhdane (Revival)', 'Възраждане', 2),
    (v_question_id, 'DPS-NN (Movement for Rights and Freedoms – New Beginning)', 'ДПС-НН (Движение за права и свободи – Ново начало)', 3),
    (v_question_id, 'BSP-OL (Bulgarian Socialist Party – United Left)', 'БСП-ОЛ (Българска социалистическа партия – Обединена левица)', 4),
    (v_question_id, 'ARF (Alliance for Rights and Freedoms)', 'АРФ (Алианс за права и свободи)', 5),
    (v_question_id, 'ITN (There Is Such a People)', 'ИТН (Има такъв народ)', 6),
    (v_question_id, 'Other / None', 'Друга / Никоя', 7);

  RAISE NOTICE 'Election created with ID: %', v_election_id;
  RAISE NOTICE 'Question created with ID: %', v_question_id;
END $$;
