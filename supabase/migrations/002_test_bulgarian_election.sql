-- Test Election: Bulgarian Political Parties Poll
-- Based on October 2024 election results

-- Insert the election
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
RETURNING id;

-- Note: Replace 'election-id-here' with the actual ID returned above
-- Or use this query to get the election ID:
-- SELECT id FROM elections WHERE title_bg = 'Анкета за български политически партии';

-- Insert the question
INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
SELECT 
  id,
  'Which political party would you vote for?',
  'За коя политическа партия бихте гласували?',
  'single-choice',
  0
FROM elections 
WHERE title_bg = 'Анкета за български политически партии'
RETURNING id;

-- Insert options (political parties)
-- Note: Replace 'question-id-here' with the actual question ID
-- Or use this query to get the question ID:
-- SELECT id FROM questions WHERE question_text_bg = 'За коя политическа партия бихте гласували?';

INSERT INTO options (question_id, option_text, option_text_bg, order_index)
SELECT 
  q.id,
  'GERB (Citizens for European Development of Bulgaria)',
  'ГЕРБ (Граждани за европейско развитие на България)',
  0
FROM questions q
JOIN elections e ON q.election_id = e.id
WHERE e.title_bg = 'Анкета за български политически партии' 
  AND q.question_text_bg = 'За коя политическа партия бихте гласували?';

INSERT INTO options (question_id, option_text, option_text_bg, order_index)
SELECT 
  q.id,
  'PP-DB (We Continue the Change – Democratic Bulgaria)',
  'ПП-ДБ (Продължаваме промяната – Демократична България)',
  1
FROM questions q
JOIN elections e ON q.election_id = e.id
WHERE e.title_bg = 'Анкета за български политически партии' 
  AND q.question_text_bg = 'За коя политическа партия бихте гласували?';

INSERT INTO options (question_id, option_text, option_text_bg, order_index)
SELECT 
  q.id,
  'Vazrazhdane (Revival)',
  'Възраждане',
  2
FROM questions q
JOIN elections e ON q.election_id = e.id
WHERE e.title_bg = 'Анкета за български политически партии' 
  AND q.question_text_bg = 'За коя политическа партия бихте гласували?';

INSERT INTO options (question_id, option_text, option_text_bg, order_index)
SELECT 
  q.id,
  'DPS-NN (Movement for Rights and Freedoms – New Beginning)',
  'ДПС-НН (Движение за права и свободи – Ново начало)',
  3
FROM questions q
JOIN elections e ON q.election_id = e.id
WHERE e.title_bg = 'Анкета за български политически партии' 
  AND q.question_text_bg = 'За коя политическа партия бихте гласували?';

INSERT INTO options (question_id, option_text, option_text_bg, order_index)
SELECT 
  q.id,
  'BSP-OL (Bulgarian Socialist Party – United Left)',
  'БСП-ОЛ (Българска социалистическа партия – Обединена левица)',
  4
FROM questions q
JOIN elections e ON q.election_id = e.id
WHERE e.title_bg = 'Анкета за български политически партии' 
  AND q.question_text_bg = 'За коя политическа партия бихте гласували?';

INSERT INTO options (question_id, option_text, option_text_bg, order_index)
SELECT 
  q.id,
  'ARF (Alliance for Rights and Freedoms)',
  'АРФ (Алианс за права и свободи)',
  5
FROM questions q
JOIN elections e ON q.election_id = e.id
WHERE e.title_bg = 'Анкета за български политически партии' 
  AND q.question_text_bg = 'За коя политическа партия бихте гласували?';

INSERT INTO options (question_id, option_text, option_text_bg, order_index)
SELECT 
  q.id,
  'ITN (There Is Such a People)',
  'ИТН (Има такъв народ)',
  6
FROM questions q
JOIN elections e ON q.election_id = e.id
WHERE e.title_bg = 'Анкета за български политически партии' 
  AND q.question_text_bg = 'За коя политическа партия бихте гласували?';

INSERT INTO options (question_id, option_text, option_text_bg, order_index)
SELECT 
  q.id,
  'Other / None',
  'Друга / Никоя',
  7
FROM questions q
JOIN elections e ON q.election_id = e.id
WHERE e.title_bg = 'Анкета за български политически партии' 
  AND q.question_text_bg = 'За коя политическа партия бихте гласували?';
