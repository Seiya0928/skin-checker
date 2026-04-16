import Stripe from 'stripe';

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });
}

export const PLANS_WITH_PRICE_IDS = [
  { id: 'starter',  credits: 5,  priceId: process.env.STRIPE_PRICE_STARTER },
  { id: 'standard', credits: 20, priceId: process.env.STRIPE_PRICE_STANDARD },
] as const;
