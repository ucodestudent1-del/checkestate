"use client";

import { useState, useEffect } from "react";
import { CreditCard, DollarSign, List, Shield, CheckCircle, Star, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const plans = [
  {
    name: "Starter",
    price: 29,
    priceYearly: 290,
    period: "/month",
    units: "Up to 10 units",
    description: "Basic property management, maintenance requests, contractor directory, standard dashboard.",
    features: ["Property & unit management", "Maintenance requests", "Contractor directory", "Standard dashboard", "Email support"],
    planType: "STARTER" as const,
    popular: false,
  },
  {
    name: "Professional",
    price: 59,
    priceYearly: 590,
    period: "/month",
    units: "Up to 50 units",
    description: "Everything in Starter, plus advanced work orders, expense tracking, email notifications, and reporting.",
    features: ["Everything in Starter", "Advanced work orders", "Expense tracking", "Email notifications", "Maintenance reporting", "Priority email support"],
    planType: "PROFESSIONAL" as const,
    popular: true,
  },
  {
    name: "Business",
    price: 99,
    priceYearly: 990,
    period: "/month",
    units: "Up to 150 units",
    description: "Everything in Professional, plus multiple staff accounts, advanced analytics, AI assistance, priority support.",
    features: ["Everything in Professional", "Multiple staff accounts", "Advanced analytics", "AI maintenance assistant", "Usage limits", "Priority support"],
    planType: "BUSINESS" as const,
    popular: false,
  },
  {
    name: "Agency",
    price: 199,
    priceYearly: 1990,
    period: "/month",
    units: "Unlimited units",
    description: "For larger property portfolios with expanded staff and advanced organization management.",
    features: ["Everything in Business", "Expanded staff access", "Advanced reporting", "Organization management", "Dedicated support"],
    planType: "AGENCY" as const,
    popular: false,
  },
];

export default function SubscriptionPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session").then(async (r) => {
      const json = await r.json();
      setSession(json?.user || json);
      setLoading(false);
    });
  }, []);

  const handleSubscribe = async (planType: string) => {
    setProcessing(planType);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          billingCycle,
          successUrl: `${window.location.origin}/dashboard/subscription?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/subscription?canceled=true`,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.error || "Failed to create checkout session");
        return;
      }

      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setProcessing(null);
    }
  };

  const handleBillingPortal = async () => {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.error || "Failed to open billing portal");
        return;
      }

      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      toast.error("Failed to open billing portal");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const currentPlan = plans.find(p => p.planType === session?.planType) || plans[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
        <p className="text-slate-600">Manage your plan and billing</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
              {session?.planType?.[0] || "S"}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{session?.planType || "Starter"} Plan</p>
              <p className="text-sm text-slate-500 capitalize">{session?.subscriptionStatus || "trialing"}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleBillingPortal} disabled={!session?.stripeCustomerId}>
            <ExternalLink className="mr-2 h-4 w-4" /> Manage Billing
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="billing"
            value="monthly"
            checked={billingCycle === "monthly"}
            onChange={() => setBillingCycle("monthly")}
            className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">Monthly</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="billing"
            value="yearly"
            checked={billingCycle === "yearly"}
            onChange={() => setBillingCycle("yearly")}
            className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">Yearly (save 17%)</span>
        </label>
      </div>

      <h2 className="text-lg font-semibold text-slate-900 mb-4">Choose a Plan</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = billingCycle === "monthly" ? plan.price : Math.round(plan.priceYearly / 12);
          const isCurrent = plan.planType === session?.planType;
          return (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col relative ${
                plan.popular ? "border-blue-600 bg-blue-50" : isCurrent ? "border-green-600 bg-green-50" : "border-slate-200 bg-white"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              {isCurrent && !plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Current Plan
                </div>
              )}
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-slate-900">${price}</span>
                <span className="text-sm text-slate-500">/month</span>
                {billingCycle === "yearly" && (
                  <span className="text-xs text-green-600 ml-2">(billed yearly)</span>
                )}
              </div>
              <h3 className="font-semibold text-slate-900">{plan.name}</h3>
              <p className="text-sm text-slate-600 mb-4">{plan.units}</p>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{plan.description}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-green-600" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                onClick={() => handleSubscribe(plan.planType)}
                disabled={processing === plan.planType || isCurrent}
                variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
              >
                {processing === plan.planType ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Processing...
                  </>
                ) : isCurrent ? (
                  "Current Plan"
                ) : plan.popular ? (
                  "Get Started"
                ) : (
                  "Select Plan"
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 mt-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Need a different plan?</h3>
        <p className="text-sm text-slate-600 mb-4">Contact us for custom Enterprise plans with volume discounts, dedicated support, and custom integrations.</p>
        <a href="mailto:sales@checkestate.app" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 font-medium">
          Contact Sales <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}