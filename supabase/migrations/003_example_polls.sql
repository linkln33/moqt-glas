-- Create 3 example polls for Моят Глас

-- Poll 1: Favorite Bulgarian City
DO $$
DECLARE
  election_id_1 UUID;
  question_id_1 UUID;
BEGIN
  -- Create election
  INSERT INTO elections (title, title_bg, description, description_bg, status, start_date, end_date, created_by)
  VALUES (
    'Favorite Bulgarian City',
    'Любим български град',
    'Which Bulgarian city do you like the most?',
    'Кой български град ви харесва най-много?',
    'active',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '30 days',
    'example'
  )
  RETURNING id INTO election_id_1;

  -- Create question
  INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
  VALUES (
    election_id_1,
    'Which Bulgarian city do you like the most?',
    'Кой български град ви харесва най-много?',
    'single-choice',
    0
  )
  RETURNING id INTO question_id_1;

  -- Create options
  INSERT INTO options (question_id, option_text, option_text_bg, order_index) VALUES
    (question_id_1, 'Sofia', 'София', 0),
    (question_id_1, 'Plovdiv', 'Пловдив', 1),
    (question_id_1, 'Varna', 'Варна', 2),
    (question_id_1, 'Burgas', 'Бургас', 3),
    (question_id_1, 'Ruse', 'Русе', 4),
    (question_id_1, 'Stara Zagora', 'Стара Загора', 5),
    (question_id_1, 'Veliko Tarnovo', 'Велико Търново', 6),
    (question_id_1, 'Other', 'Друг', 7);
END $$;

-- Poll 2: Best Bulgarian Food
DO $$
DECLARE
  election_id_2 UUID;
  question_id_2 UUID;
BEGIN
  -- Create election
  INSERT INTO elections (title, title_bg, description, description_bg, status, start_date, end_date, created_by)
  VALUES (
    'Best Bulgarian Food',
    'Най-добра българска храна',
    'What is your favorite traditional Bulgarian dish?',
    'Коя е вашата любима традиционна българска храна?',
    'active',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '25 days',
    'example'
  )
  RETURNING id INTO election_id_2;

  -- Create question
  INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
  VALUES (
    election_id_2,
    'What is your favorite traditional Bulgarian dish?',
    'Коя е вашата любима традиционна българска храна?',
    'single-choice',
    0
  )
  RETURNING id INTO question_id_2;

  -- Create options
  INSERT INTO options (question_id, option_text, option_text_bg, order_index) VALUES
    (question_id_2, 'Banitsa', 'Баница', 0),
    (question_id_2, 'Shopska Salad', 'Шопска салата', 1),
    (question_id_2, 'Kavarma', 'Каварма', 2),
    (question_id_2, 'Tarator', 'Таратор', 3),
    (question_id_2, 'Musaka', 'Мусака', 4),
    (question_id_2, 'Sarmi', 'Сарми', 5),
    (question_id_2, 'Kebapche', 'Кебапче', 6),
    (question_id_2, 'Other', 'Друго', 7);
END $$;

-- Poll 3: Technology Preferences (Multiple questions)
DO $$
DECLARE
  election_id_3 UUID;
  question_id_3_1 UUID;
  question_id_3_2 UUID;
BEGIN
  -- Create election
  INSERT INTO elections (title, title_bg, description, description_bg, status, start_date, end_date, created_by)
  VALUES (
    'Technology Preferences',
    'Технологични предпочитания',
    'Share your technology preferences and usage habits',
    'Споделете вашите технологични предпочитания и навици',
    'active',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '20 days',
    'example'
  )
  RETURNING id INTO election_id_3;

  -- Question 1: Primary device
  INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
  VALUES (
    election_id_3,
    'What is your primary device for browsing the internet?',
    'Какво е вашето основно устройство за сърфиране в интернет?',
    'single-choice',
    0
  )
  RETURNING id INTO question_id_3_1;

  INSERT INTO options (question_id, option_text, option_text_bg, order_index) VALUES
    (question_id_3_1, 'Smartphone', 'Смартфон', 0),
    (question_id_3_1, 'Laptop', 'Лаптоп', 1),
    (question_id_3_1, 'Desktop Computer', 'Настолен компютър', 2),
    (question_id_3_1, 'Tablet', 'Таблет', 3),
    (question_id_3_1, 'Other', 'Друго', 4);

  -- Question 2: Social media usage
  INSERT INTO questions (election_id, question_text, question_text_bg, question_type, order_index)
  VALUES (
    election_id_3,
    'Which social media platforms do you use? (You can select multiple)',
    'Кои социални мрежи използвате? (Можете да изберете няколко)',
    'multiple-choice',
    1
  )
  RETURNING id INTO question_id_3_2;

  INSERT INTO options (question_id, option_text, option_text_bg, order_index) VALUES
    (question_id_3_2, 'Facebook', 'Facebook', 0),
    (question_id_3_2, 'Instagram', 'Instagram', 1),
    (question_id_3_2, 'Twitter/X', 'Twitter/X', 2),
    (question_id_3_2, 'LinkedIn', 'LinkedIn', 3),
    (question_id_3_2, 'TikTok', 'TikTok', 4),
    (question_id_3_2, 'Telegram', 'Telegram', 5),
    (question_id_3_2, 'None', 'Никоя', 6);
END $$;
