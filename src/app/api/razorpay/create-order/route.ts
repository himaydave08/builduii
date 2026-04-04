import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_PRICES: Record<string, Record<string, number>> = {
  pro:        { monthly: 499,   yearly: 3988  },  // $4.99/mo or $3.99*12
  business:   { monthly: 999,   yearly: 7588  },  // $9.99/mo or $7.99*12
  enterprise: { monthly: 3999,  yearly: 31188 },  // $39.99/mo or $31.99*12
};

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId, cycle } = await req.json() as { planId: string; cycle: string };

  const amount = PLAN_PRICES[planId]?.[cycle];
  if (!amount) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const order = await razorpay.orders.create({
    amount,          // in paise (INR) — multiply by 80 for USD→INR approx
    currency: "INR",
    receipt: `rcpt_${planId}_${Date.now().toString().slice(-8)}`,
    notes: { userId, planId, cycle },
  });

  return NextResponse.json({ orderId: order.id, amount, currency: "INR" });
}
