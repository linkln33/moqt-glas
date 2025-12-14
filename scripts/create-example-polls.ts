import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createExamplePolls() {
  console.log('Creating example polls...');

  // Poll 1: Favorite Bulgarian City
  const { data: election1, error: err1 } = await supabase
    .from('elections')
    .insert({
      title: 'Favorite Bulgarian City',
      title_bg: 'Любим български град',
      description: 'Which Bulgarian city do you like the most?',
      description_bg: 'Кой български град ви харесва най-много?',
      status: 'active',
      start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      created_by: 'example',
    })
    .select()
    .single();

  if (err1) {
    console.error('Error creating election 1:', err1);
    return;
  }

  const { data: question1, error: qErr1 } = await supabase
    .from('questions')
    .insert({
      election_id: election1.id,
      question_text: 'Which Bulgarian city do you like the most?',
      question_text_bg: 'Кой български град ви харесва най-много?',
      question_type: 'single-choice',
      order_index: 0,
    })
    .select()
    .single();

  if (qErr1) {
    console.error('Error creating question 1:', qErr1);
    return;
  }

  await supabase.from('options').insert([
    { question_id: question1.id, option_text: 'Sofia', option_text_bg: 'София', order_index: 0 },
    { question_id: question1.id, option_text: 'Plovdiv', option_text_bg: 'Пловдив', order_index: 1 },
    { question_id: question1.id, option_text: 'Varna', option_text_bg: 'Варна', order_index: 2 },
    { question_id: question1.id, option_text: 'Burgas', option_text_bg: 'Бургас', order_index: 3 },
    { question_id: question1.id, option_text: 'Ruse', option_text_bg: 'Русе', order_index: 4 },
    { question_id: question1.id, option_text: 'Stara Zagora', option_text_bg: 'Стара Загора', order_index: 5 },
    { question_id: question1.id, option_text: 'Veliko Tarnovo', option_text_bg: 'Велико Търново', order_index: 6 },
    { question_id: question1.id, option_text: 'Other', option_text_bg: 'Друг', order_index: 7 },
  ]);

  console.log('✅ Created poll 1: Любим български град');

  // Poll 2: Best Bulgarian Food
  const { data: election2, error: err2 } = await supabase
    .from('elections')
    .insert({
      title: 'Best Bulgarian Food',
      title_bg: 'Най-добра българска храна',
      description: 'What is your favorite traditional Bulgarian dish?',
      description_bg: 'Коя е вашата любима традиционна българска храна?',
      status: 'active',
      start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'example',
    })
    .select()
    .single();

  if (err2) {
    console.error('Error creating election 2:', err2);
    return;
  }

  const { data: question2, error: qErr2 } = await supabase
    .from('questions')
    .insert({
      election_id: election2.id,
      question_text: 'What is your favorite traditional Bulgarian dish?',
      question_text_bg: 'Коя е вашата любима традиционна българска храна?',
      question_type: 'single-choice',
      order_index: 0,
    })
    .select()
    .single();

  if (qErr2) {
    console.error('Error creating question 2:', qErr2);
    return;
  }

  await supabase.from('options').insert([
    { question_id: question2.id, option_text: 'Banitsa', option_text_bg: 'Баница', order_index: 0 },
    { question_id: question2.id, option_text: 'Shopska Salad', option_text_bg: 'Шопска салата', order_index: 1 },
    { question_id: question2.id, option_text: 'Kavarma', option_text_bg: 'Каварма', order_index: 2 },
    { question_id: question2.id, option_text: 'Tarator', option_text_bg: 'Таратор', order_index: 3 },
    { question_id: question2.id, option_text: 'Musaka', option_text_bg: 'Мусака', order_index: 4 },
    { question_id: question2.id, option_text: 'Sarmi', option_text_bg: 'Сарми', order_index: 5 },
    { question_id: question2.id, option_text: 'Kebapche', option_text_bg: 'Кебапче', order_index: 6 },
    { question_id: question2.id, option_text: 'Other', option_text_bg: 'Друго', order_index: 7 },
  ]);

  console.log('✅ Created poll 2: Най-добра българска храна');

  // Poll 3: Technology Preferences (Multiple questions)
  const { data: election3, error: err3 } = await supabase
    .from('elections')
    .insert({
      title: 'Technology Preferences',
      title_bg: 'Технологични предпочитания',
      description: 'Share your technology preferences and usage habits',
      description_bg: 'Споделете вашите технологични предпочитания и навици',
      status: 'active',
      start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'example',
    })
    .select()
    .single();

  if (err3) {
    console.error('Error creating election 3:', err3);
    return;
  }

  // Question 1: Primary device
  const { data: question3_1, error: qErr3_1 } = await supabase
    .from('questions')
    .insert({
      election_id: election3.id,
      question_text: 'What is your primary device for browsing the internet?',
      question_text_bg: 'Какво е вашето основно устройство за сърфиране в интернет?',
      question_type: 'single-choice',
      order_index: 0,
    })
    .select()
    .single();

  if (qErr3_1) {
    console.error('Error creating question 3.1:', qErr3_1);
    return;
  }

  await supabase.from('options').insert([
    { question_id: question3_1.id, option_text: 'Smartphone', option_text_bg: 'Смартфон', order_index: 0 },
    { question_id: question3_1.id, option_text: 'Laptop', option_text_bg: 'Лаптоп', order_index: 1 },
    { question_id: question3_1.id, option_text: 'Desktop Computer', option_text_bg: 'Настолен компютър', order_index: 2 },
    { question_id: question3_1.id, option_text: 'Tablet', option_text_bg: 'Таблет', order_index: 3 },
    { question_id: question3_1.id, option_text: 'Other', option_text_bg: 'Друго', order_index: 4 },
  ]);

  // Question 2: Social media
  const { data: question3_2, error: qErr3_2 } = await supabase
    .from('questions')
    .insert({
      election_id: election3.id,
      question_text: 'Which social media platforms do you use? (You can select multiple)',
      question_text_bg: 'Кои социални мрежи използвате? (Можете да изберете няколко)',
      question_type: 'multiple-choice',
      order_index: 1,
    })
    .select()
    .single();

  if (qErr3_2) {
    console.error('Error creating question 3.2:', qErr3_2);
    return;
  }

  await supabase.from('options').insert([
    { question_id: question3_2.id, option_text: 'Facebook', option_text_bg: 'Facebook', order_index: 0 },
    { question_id: question3_2.id, option_text: 'Instagram', option_text_bg: 'Instagram', order_index: 1 },
    { question_id: question3_2.id, option_text: 'Twitter/X', option_text_bg: 'Twitter/X', order_index: 2 },
    { question_id: question3_2.id, option_text: 'LinkedIn', option_text_bg: 'LinkedIn', order_index: 3 },
    { question_id: question3_2.id, option_text: 'TikTok', option_text_bg: 'TikTok', order_index: 4 },
    { question_id: question3_2.id, option_text: 'Telegram', option_text_bg: 'Telegram', order_index: 5 },
    { question_id: question3_2.id, option_text: 'None', option_text_bg: 'Никоя', order_index: 6 },
  ]);

  console.log('✅ Created poll 3: Технологични предпочитания');

  console.log('\n🎉 All example polls created successfully!');
}

createExamplePolls().catch(console.error);
