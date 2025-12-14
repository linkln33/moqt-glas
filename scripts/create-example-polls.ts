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

  // Poll 1: Ако днес бяха изборите за кого бихте гласували
  const { data: election1, error: err1 } = await supabase
    .from('elections')
    .insert({
      title: 'If elections were today, who would you vote for?',
      title_bg: 'Ако днес бяха изборите за кого бихте гласували',
      description: 'Which political party would you vote for if elections were today?',
      description_bg: 'За коя политическа партия бихте гласували, ако днес бяха изборите?',
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
      question_text: 'If elections were today, who would you vote for?',
      question_text_bg: 'Ако днес бяха изборите за кого бихте гласували?',
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
    { question_id: question1.id, option_text: 'GERB (Citizens for European Development of Bulgaria)', option_text_bg: 'ГЕРБ (Граждани за европейско развитие на България)', order_index: 0 },
    { question_id: question1.id, option_text: 'PP-DB (We Continue the Change – Democratic Bulgaria)', option_text_bg: 'ПП-ДБ (Продължаваме промяната – Демократична България)', order_index: 1 },
    { question_id: question1.id, option_text: 'Vazrazhdane (Revival)', option_text_bg: 'Възраждане', order_index: 2 },
    { question_id: question1.id, option_text: 'DPS-NN (Movement for Rights and Freedoms – New Beginning)', option_text_bg: 'ДПС-НН (Движение за права и свободи – Ново начало)', order_index: 3 },
    { question_id: question1.id, option_text: 'BSP-OL (Bulgarian Socialist Party – United Left)', option_text_bg: 'БСП-ОЛ (Българска социалистическа партия – Обединена левица)', order_index: 4 },
    { question_id: question1.id, option_text: 'ARF (Alliance for Rights and Freedoms)', option_text_bg: 'АРФ (Алианс за права и свободи)', order_index: 5 },
    { question_id: question1.id, option_text: 'ITN (There Is Such a People)', option_text_bg: 'ИТН (Има такъв народ)', order_index: 6 },
    { question_id: question1.id, option_text: 'Velichie (Величие)', option_text_bg: 'Величие', order_index: 7 },
    { question_id: question1.id, option_text: 'Other / None', option_text_bg: 'Друга / Никоя', order_index: 8 },
  ]);

  console.log('✅ Created poll 1: Ако днес бяха изборите за кого бихте гласували');

  // Poll 2: Кой трябва да влезе в затвора
  const { data: election2, error: err2 } = await supabase
    .from('elections')
    .insert({
      title: 'Who should go to prison?',
      title_bg: 'Кой трябва да влезе в затвора',
      description: 'Who should go to prison?',
      description_bg: 'Кой трябва да влезе в затвора?',
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
      question_text: 'Who should go to prison?',
      question_text_bg: 'Кой трябва да влезе в затвора?',
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
    { question_id: question2.id, option_text: 'Tikvata', option_text_bg: 'Тиквата', order_index: 0 },
    { question_id: question2.id, option_text: 'Svinyata', option_text_bg: 'Свинята', order_index: 1 },
    { question_id: question2.id, option_text: 'Rado Gelya', option_text_bg: 'Радо Геля', order_index: 2 },
    { question_id: question2.id, option_text: 'All of them', option_text_bg: 'Всички', order_index: 3 },
    { question_id: question2.id, option_text: 'None', option_text_bg: 'Никой', order_index: 4 },
  ]);

  console.log('✅ Created poll 2: Кой трябва да влезе в затвора');

  // Poll 3: Пирамида ли е Исторически парк
  const { data: election3, error: err3 } = await supabase
    .from('elections')
    .insert({
      title: 'Is Historical Park a pyramid scheme?',
      title_bg: 'Пирамида ли е Исторически парк',
      description: 'Is Historical Park a pyramid scheme?',
      description_bg: 'Пирамида ли е Исторически парк?',
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

  const { data: question3, error: qErr3 } = await supabase
    .from('questions')
    .insert({
      election_id: election3.id,
      question_text: 'Is Historical Park a pyramid scheme?',
      question_text_bg: 'Пирамида ли е Исторически парк?',
      question_type: 'single-choice',
      order_index: 0,
    })
    .select()
    .single();

  if (qErr3) {
    console.error('Error creating question 3:', qErr3);
    return;
  }

  await supabase.from('options').insert([
    { question_id: question3.id, option_text: 'Yes', option_text_bg: 'Да', order_index: 0 },
    { question_id: question3.id, option_text: 'No', option_text_bg: 'Не', order_index: 1 },
    { question_id: question3.id, option_text: 'Not sure', option_text_bg: 'Не съм сигурен', order_index: 2 },
  ]);

  console.log('✅ Created poll 3: Пирамида ли е Исторически парк');

  console.log('\n🎉 All example polls created successfully!');
}

createExamplePolls().catch(console.error);
