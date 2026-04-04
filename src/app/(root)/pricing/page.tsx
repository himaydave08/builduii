"use client";
import Image from "next/image";
import ChangeablePricingSection, { type Plan } from "@/components/ui/changeable-pricing-section";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import Script from "next/script";

const PLANS: Plan[] = [
  {
    id: "pro",
    name: "Pro",
    description: "Best for individuals & small teams",
    priceMonthly: "$4.99",
    priceYearly: "$3.99",
    featuresLabel: "CORE FEATURES:",
    features: [
      { text: "200 generations per month", hasInfo: false },
      { text: "All template types", hasInfo: false },
      { text: "Standard support", hasInfo: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "Best for growing teams",
    priceMonthly: "$9.99",
    priceYearly: "$7.99",
    badge: "POPULAR",
    featuresLabel: "EVERYTHING IN PRO, PLUS:",
    features: [
      { text: "500 generations per month", hasInfo: false },
      { text: "Priority generation queue", hasInfo: false },
      { text: "Custom prompt templates", hasInfo: true },
      { text: "Advanced UI components", hasInfo: true },
      { text: "Team collaboration", hasInfo: true },
      { text: "Priority support", hasInfo: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Best for large organizations",
    priceMonthly: "$39.99",
    priceYearly: "$31.99",
    featuresLabel: "EVERYTHING IN BUSINESS, PLUS:",
    features: [
      { text: "Unlimited generations", hasInfo: false },
      { text: "Dedicated success manager", hasInfo: false },
      { text: "Custom SLAs & advanced security", hasInfo: false },
    ],
  },
];

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function Page() {
  const { user } = useUser();

  const handleContinue = async (planId: string, cycle: string) => {
    if (!user) {
      toast.error("Please sign in to continue.");
      return;
    }

    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, cycle }),
      });

      const data = await res.json() as { orderId: string; amount: number; currency: string };

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "BuildUI",
        description: `${planId} plan — ${cycle}`,
        order_id: data.orderId,
        prefill: {
          name: user.fullName ?? "",
          email: user.primaryEmailAddress?.emailAddress ?? "",
        },
        theme: { color: "#f97316" },
        handler: () => {
          toast.success("Payment successful! Your plan is now active.");
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast.error("Payment failed. Please try again.");
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="flex items-center justify-center w-full px-4 py-8">
        <div className="max-w-5xl w-full">
          <section className="space-y-8 flex flex-col items-center">
            <div className="flex flex-col items-center gap-4">
              <Image src={"/logo.svg"} height={60} width={60} alt="BuildUi" className="hidden md:block invert dark:invert-0" />
              <h1 className="text-xl font-bold text-center md:text-3xl">Pricing</h1>
              <p className="text-muted-foreground text-center text-sm md:text-base">
                Choose the plan that fits your needs
              </p>
            </div>
            <ChangeablePricingSection
              plans={PLANS}
              defaultPlanId="business"
              onContinue={handleContinue}
            />
          </section>
        </div>
      </div>
    </>
  );
}
