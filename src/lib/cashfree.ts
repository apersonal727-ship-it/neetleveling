import crypto from "crypto";

const CASHFREE_ENV = process.env.CASHFREE_ENV === "PROD" ? "PROD" : "TEST";
const BASE_URL = CASHFREE_ENV === "PROD" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
const API_VERSION = "2023-08-01";

export const CASHFREE_CHECKOUT_MODE: "sandbox" | "production" = CASHFREE_ENV === "PROD" ? "production" : "sandbox";

function headers() {
  return {
    "Content-Type": "application/json",
    "x-api-version": API_VERSION,
    "x-client-id": process.env.CASHFREE_APP_ID!,
    "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
  };
}

type CashfreeOrder = {
  cf_order_id: string;
  order_id: string;
  payment_session_id: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";
};

export async function createCashfreeOrder(params: {
  orderId: string;
  amount: number;
  customerId: string;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
  notifyUrl: string;
}): Promise<CashfreeOrder> {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: params.customerId,
        customer_phone: "9999999999",
        customer_email: params.customerEmail,
        customer_name: params.customerName,
      },
      order_meta: {
        return_url: params.returnUrl,
        notify_url: params.notifyUrl,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cashfree order creation failed (${res.status}): ${body}`);
  }

  return res.json();
}

export async function fetchCashfreeOrder(orderId: string): Promise<CashfreeOrder> {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, { headers: headers() });
  if (!res.ok) throw new Error(`Cashfree order fetch failed (${res.status})`);
  return res.json();
}

export function verifyCashfreeWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
  if (!timestamp || !signature) return false;
  const expected = crypto
    .createHmac("sha256", process.env.CASHFREE_SECRET_KEY!)
    .update(timestamp + rawBody)
    .digest("base64");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
