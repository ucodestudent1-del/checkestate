import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-middleware";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import Stripe from "stripe";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(secretKey, { apiVersion: "2025-06-30.basil" as any });
}

const GET = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireOrganization();
  const user = await getCurrentUser();

  if (!["PROPERTY_OWNER", "PROPERTY_MANAGER"].includes(user.role) && !user.isOrganizationOwner) {
    return NextResponse.json({ error: "Only organization owners can access billing portal" }, { status: 403 });
  }

  const org = await db.organization.findUnique({
    where: { id: ctx.organizationId },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  if (!org.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const stripe = getStripe();

  const { searchParams } = new URL(req.url);
  const returnUrl = searchParams.get("returnUrl") || `${process.env.NEXTAUTH_URL}/dashboard/subscription`;

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url });
});

export { GET };