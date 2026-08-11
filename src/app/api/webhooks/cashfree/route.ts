import { NextRequest, NextResponse } from "next/server";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { finalizeSuccessfulPayment, markFailedPayment } from "@/lib/payment";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";

  if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: { type?: string; data?: { order?: { order_id?: string }; payment?: { cf_payment_id?: string } } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const orderId = payload.data?.order?.order_id;
  const paymentId = payload.data?.payment?.cf_payment_id;

  if (orderId) {
    if (payload.type === "PAYMENT_SUCCESS_WEBHOOK") {
      await finalizeSuccessfulPayment(orderId, String(paymentId ?? ""));
    } else if (payload.type === "PAYMENT_FAILED_WEBHOOK" || payload.type === "PAYMENT_USER_DROPPED_WEBHOOK") {
      await markFailedPayment(orderId);
    }
  }

  return NextResponse.json({ received: true });
}
