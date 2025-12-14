import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const telegramId = searchParams.get('telegramId');

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    const { data: paymentDetails, error } = await supabase
      .from('user_payment_details')
      .select('*')
      .eq('telegram_id', parseInt(telegramId))
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching payment details:', error);
      return NextResponse.json(
        { error: 'Грешка при зареждане на данните' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      paymentDetails: paymentDetails || null,
    });
  } catch (error) {
    console.error('Error in GET /api/user/payment-details:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { telegramId, ...paymentData } = body;

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Необходима е автентификация' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Deactivate any existing payment details
    await supabase
      .from('user_payment_details')
      .update({ is_active: false })
      .eq('telegram_id', parseInt(telegramId))
      .eq('is_active', true);

    // Create new payment details
    const { data: paymentDetails, error } = await supabase
      .from('user_payment_details')
      .insert({
        telegram_id: parseInt(telegramId),
        ...paymentData,
        is_verified: false, // Needs admin verification
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment details:', error);
      return NextResponse.json(
        { error: 'Грешка при запазване на данните' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentDetails,
      message: 'Платежните данни са запазени. Ще бъдат проверени преди първото изтегляне.',
    });
  } catch (error) {
    console.error('Error in POST /api/user/payment-details:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, telegramId, ...paymentData } = body;

    if (!telegramId || !id) {
      return NextResponse.json(
        { error: 'Необходими са ID и автентификация' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: paymentDetails, error } = await supabase
      .from('user_payment_details')
      .update({
        ...paymentData,
        is_verified: false, // Reset verification when updated
      })
      .eq('id', id)
      .eq('telegram_id', parseInt(telegramId))
      .select()
      .single();

    if (error) {
      console.error('Error updating payment details:', error);
      return NextResponse.json(
        { error: 'Грешка при обновяване на данните' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentDetails,
      message: 'Платежните данни са обновени. Ще бъдат проверени отново.',
    });
  } catch (error) {
    console.error('Error in PUT /api/user/payment-details:', error);
    return NextResponse.json(
      { error: 'Вътрешна грешка' },
      { status: 500 }
    );
  }
}
