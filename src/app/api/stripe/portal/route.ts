import { NextRequest, NextResponse } from "next/server";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import Stripe from "stripe";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(secretKey, { apiVersion: "2025-06-30.basil" as any });
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireOrganization();
    const user = await getCurrentUser();

    if (!["PROPERTY_OWNER", "PROPERTY_MANAGER"].includes(user.role) && !user.isOrganizationOwner) {
      return NextResponse.json({ error: "Only organization owners can manage subscriptions" }, { status: 403 });
    }

    const org = await db.organization.findUnique({
      where: { id: ctx.organizationId },
    });

    if (!org || !org.stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
    }

    const stripe = getStripe();

    const session = await (stripe as any).billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/subscription`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe billing portal error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}