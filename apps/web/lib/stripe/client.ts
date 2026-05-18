import "server-only";
import Stripe from "stripe";

let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not set");
    _client = new Stripe(key, {
      apiVersion: "2024-11-20.acacia",
      typescript: true,
      appInfo: { name: "Chativo.ai", version: "0.1.0" },
    });
  }
  return _client;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
