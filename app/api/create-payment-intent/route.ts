import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, customerName, email, phone } = body;

    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || secretKey.includes('placeholder')) {
      return NextResponse.json(
        {
          error:
            'STRIPE_SECRET_KEY is not configured in .env.local. Please provide your test key from dashboard.stripe.com/test/apikeys.',
        },
        { status: 400 }
      );
    }

    const stripe = new Stripe(secretKey);

    // Amount must be in cents (e.g. $12.50 -> 1250 cents)
    const amountInCents = Math.max(50, Math.round(Number(amount) * 100));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        customerName: customerName || '',
        customerEmail: email || '',
        customerPhone: phone || '',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Stripe PaymentIntent creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create Stripe payment intent' },
      { status: 500 }
    );
  }
}
