import { NextRequest, NextResponse } from "next/server";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import Stripe from "stripe";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(secretKey, { apiVersion: "2025-06-30.basil" as any });
}

const PLAN_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  STARTER: { monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "", yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "" },
  PROFESSIONAL: { monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || "", yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || "" },
  BUSINESS: { monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "", yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || "" },
  AGENCY: { monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY || "", yearly: process.env.STRIPE_PRICE_AGENCY_YEARLY || "" },
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireOrganization();
    const user = await getCurrentUser();

    if (!["PROPERTY_OWNER", "PROPERTY_MANAGER"].includes(user.role) && !user.isOrganizationOwner) {
      return NextResponse.json({ error: "Only organization owners can manage subscriptions" }, { status: 403 });
    }

    const org = await db.organization.findUnique({
      where: { id: ctx.organizationId },
      include: { memberships: { where: { userId: user.id } } },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await req.json();
    const { planType, billingCycle, successUrl, cancelUrl } = body;

    if (!["STARTER", "PROFESSIONAL", "BUSINESS", "AGENCY"].includes(planType)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
    }

    const priceId = billingCycle === "monthly" ? PLAN_PRICE_IDS[planType].monthly : PLAN_PRICE_IDS[planType].yearly;

    if (!priceId) {
      return NextResponse.json({ error: "Price not configured for this plan" }, { status: 500 });
    }

    const stripe = getStripe();

    let customerId = org.stripeCustomerId;

    if (!customerId) {
      const customer = await (stripe as any).customers.create({
        email: user.email,
        name: `${org.name} (${user.firstName} ${user.lastName})`,
        metadata: { organizationId: org.id },
      });
      customerId = customer.id;

      await db.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await (stripe as any).checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/dashboard/subscription?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/dashboard/subscription?canceled=true`,
      metadata: {
        organizationId: org.id,
        planType,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          organizationId: org.id,
          planType,
          billingCycle,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}