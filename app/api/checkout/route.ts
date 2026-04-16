import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getStripe, PLANS_WITH_PRICE_IDS } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { planId } = await req.json();
    const plan = PLANS_WITH_PRICE_IDS.find(p => p.id === planId);
    if (!plan) return NextResponse.json({ error: 'invalid plan' }, { status: 400 });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (toSet) => {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL!;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${origin}/?purchased=true`,
      cancel_url: `${origin}/`,
      metadata: {
        user_id: user.id,
        credits: String(plan.credits),
      },
      locale: 'ja',
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '決済の開始に失敗しました' }, { status: 500 });
  }
}
