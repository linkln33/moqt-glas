/**
 * Script to create a test poll with Bulgarian political parties
 * Run with: npx tsx scripts/create-test-poll.ts
 * Or: npm run create-poll (if added to package.json)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestPoll() {
  try {
    console.log('📊 Creating Bulgarian Political Parties Poll...');

    // 1. Create election
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .insert({
        title: 'Bulgarian Political Parties Poll',
        title_bg: 'Анкета за български политически партии',
        description: 'Which political party would you vote for in the next parliamentary elections?',
        description_bg: 'За коя политическа партия бихте гласували на следващите парламентарни избори?',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      })
      .select()
      .single();

    if (electionError) {
      throw electionError;
    }

    console.log('✅ Election created:', election.id);

    // 2. Create question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        election_id: election.id,
        question_text: 'Which political party would you vote for?',
        question_text_bg: 'За коя политическа партия бихте гласували?',
        question_type: 'single-choice',
        order_index: 0,
      })
      .select()
      .single();

    if (questionError) {
      throw questionError;
    }

    console.log('✅ Question created:', question.id);

    // 3. Create options (political parties)
    const parties = [
      {
        option_text: 'GERB (Citizens for European Development of Bulgaria)',
        option_text_bg: 'ГЕРБ (Граждани за европейско развитие на България)',
        order_index: 0,
      },
      {
        option_text: 'PP-DB (We Continue the Change – Democratic Bulgaria)',
        option_text_bg: 'ПП-ДБ (Продължаваме промяната – Демократична България)',
        order_index: 1,
      },
      {
        option_text: 'Vazrazhdane (Revival)',
        option_text_bg: 'Възраждане',
        order_index: 2,
      },
      {
        option_text: 'DPS-NN (Movement for Rights and Freedoms – New Beginning)',
        option_text_bg: 'ДПС-НН (Движение за права и свободи – Ново начало)',
        order_index: 3,
      },
      {
        option_text: 'BSP-OL (Bulgarian Socialist Party – United Left)',
        option_text_bg: 'БСП-ОЛ (Българска социалистическа партия – Обединена левица)',
        order_index: 4,
      },
      {
        option_text: 'ARF (Alliance for Rights and Freedoms)',
        option_text_bg: 'АРФ (Алианс за права и свободи)',
        order_index: 5,
      },
      {
        option_text: 'ITN (There Is Such a People)',
        option_text_bg: 'ИТН (Има такъв народ)',
        order_index: 6,
      },
      {
        option_text: 'Velichie (Величие)',
        option_text_bg: 'Величие',
        order_index: 7,
      },
      {
        option_text: 'Other / None',
        option_text_bg: 'Друга / Никоя',
        order_index: 8,
      },
    ];

    const optionsToInsert = parties.map(party => ({
      question_id: question.id,
      ...party,
    }));

    const { data: options, error: optionsError } = await supabase
      .from('options')
      .insert(optionsToInsert)
      .select();

    if (optionsError) {
      throw optionsError;
    }

    console.log(`✅ Created ${options.length} party options`);
    console.log('\n🎉 Poll created successfully!');
    console.log(`\n📋 Election ID: ${election.id}`);
    console.log(`🔗 View at: http://localhost:3000/vote/${election.id}`);
    console.log(`📊 Results: http://localhost:3000/results/${election.id}`);
    console.log(`\n📝 Parties included:`);
    parties.forEach((party, index) => {
      console.log(`   ${index + 1}. ${party.option_text_bg}`);
    });

  } catch (error: any) {
    console.error('❌ Error creating poll:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    process.exit(1);
  }
}

createTestPoll();
