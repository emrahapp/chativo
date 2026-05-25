import "server-only";
import { createHmac, createHash } from "node:crypto";

/**
 * Lightweight iyzico API client (no SDK). Signs requests with iyzico's HMACSHA256
 * (V2) auth scheme. Covers:
 *   - createCheckoutForm (initialize hosted checkout)
 *   - retrieveCheckoutForm (verify payment after callback)
 *   - cancelSubscription
 *
 * Subscription mode is `subscriptions/checkoutform/initialize` with productId.
 * For first cut we do one-shot Checkout Form for subscription products.
 */

const SANDBOX_URL = "https://sandbox-api.iyzipay.com";
const PROD_URL = "https://api.iyzipay.com";

function baseUrl() {
  return process.env.IYZICO_BASE_URL ?? SANDBOX_URL;
}

export function isIyzicoConfigured(): boolean {
  return !!(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY);
}

interface IyzicoRequest {
  path: string;
  body: Record<string, unknown>;
}

export async function iyzicoRequest<T = any>(req: IyzicoRequest): Promise<T> {
  const apiKey = process.env.IYZICO_API_KEY;
  const secret = process.env.IYZICO_SECRET_KEY;
  if (!apiKey || !secret) throw new Error("IYZICO_API_KEY / IYZICO_SECRET_KEY missing");

  const randomString = Math.random().toString(36).slice(2) + Date.now();
  const bodyJson = JSON.stringify(req.body);

  // V2 signature: HMACSHA256(apiKey + randomString + secret + body)
  const signature = createHmac("sha256", secret)
    .update(apiKey + randomString + secret + bodyJson, "utf8")
    .digest("base64");
  const authorization = `IYZWSv2 ${Buffer.from(`apiKey:${apiKey}&randomKey:${randomString}&signature:${signature}`).toString("base64")}`;

  const res = await fetch(`${baseUrl()}${req.path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-iyzi-rnd": randomString,
      Authorization: authorization,
    },
    body: bodyJson,
  });

  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok || data.status === "failure") {
    throw new Error(`iyzico ${req.path}: ${data.errorMessage ?? data.errorCode ?? res.status}`);
  }
  return data as T;
}

interface CheckoutInitArgs {
  locale: "tr" | "en";
  conversationId: string;       // arbitrary string we'll get back in callback
  price: string;                // "19.00"
  currency: "TRY" | "USD" | "EUR";
  basketId: string;
  callbackUrl: string;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    identityNumber: string;     // TC kimlik or "11111111111" for sandbox
    registrationAddress: string;
    city: string;
    country: string;
    ip: string;
    gsmNumber?: string;
  };
  basketItems: Array<{ id: string; name: string; category1: string; price: string }>;
}

export interface CheckoutInitResult {
  status: "success";
  checkoutFormContent: string;     // HTML script tag — iframe or embedded
  paymentPageUrl: string;          // direct redirect URL
  token: string;
  tokenExpireTime: number;
}

/** Initialize a hosted Iyzico Checkout Form. Returns redirect URL. */
export async function initCheckoutForm(args: CheckoutInitArgs): Promise<CheckoutInitResult> {
  const body = {
    locale: args.locale,
    conversationId: args.conversationId,
    price: args.price,
    paidPrice: args.price,
    currency: args.currency,
    basketId: args.basketId,
    paymentGroup: "PRODUCT",
    callbackUrl: args.callbackUrl,
    buyer: args.buyer,
    shippingAddress: {
      contactName: `${args.buyer.name} ${args.buyer.surname}`,
      city: args.buyer.city,
      country: args.buyer.country,
      address: args.buyer.registrationAddress,
    },
    billingAddress: {
      contactName: `${args.buyer.name} ${args.buyer.surname}`,
      city: args.buyer.city,
      country: args.buyer.country,
      address: args.buyer.registrationAddress,
    },
    basketItems: args.basketItems.map((i) => ({ ...i, itemType: "VIRTUAL" })),
  };
  return iyzicoRequest<CheckoutInitResult>({
    path: "/payment/iyzipos/checkoutform/initialize/auth/ecom",
    body,
  });
}

/** Retrieve checkout form result after Iyzico's POST-back. */
export async function retrieveCheckoutForm(token: string, conversationId: string): Promise<any> {
  return iyzicoRequest({
    path: "/payment/iyzipos/checkoutform/auth/ecom/detail",
    body: { locale: "tr", conversationId, token },
  });
}

/** Plain-text webhook signature check (Iyzico sends X-IYZ-SIGNATURE-V3) */
export function verifyIyzicoWebhookSignature(rawBody: string, signature: string | null, webhookKey: string): boolean {
  if (!signature) return false;
  const expected = createHash("sha256")
    .update(webhookKey + rawBody, "utf8")
    .digest("base64");
  return expected === signature;
}
