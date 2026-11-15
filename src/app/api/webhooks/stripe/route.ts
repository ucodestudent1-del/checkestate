import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/lib/db";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(secretKey, { apiVersion: "2025-06-30.basil" as any });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // Idempotency check
  const existing = await db.emailLog.findFirst({ where: { idempotencyKey: `stripe:${event.id}` } });
  if (existing) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const org = await db.organization.findFirst({ where: { stripeCustomerId: customerId } });
        if (org && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await db.organization.update({
            where: { id: org.id },
            data: {
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: sub.status as any,
              subscriptionCurrentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            },
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const org = await db.organization.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (org) {
          await db.organization.update({
            where: { id: org.id },
            data: {
              subscriptionStatus: sub.status as any,
              subscriptionCurrentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const org = await db.organization.findFirst({ where: { stripeSubscriptionId: sub.id } });
        if (org) {
          await db.organization.update({ where: { id: org.id }, data: { subscriptionStatus: "CANCELED" } });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const org = await db.organization.findFirst({ where: { stripeCustomerId: invoice.customer as string } });
        if (org) {
          await db.organization.update({ where: { id: org.id }, data: { subscriptionStatus: "PAST_DUE" } });
        }
        break;
      }
    }

    await db.emailLog.create({
      data: { to: "system", template: "stripe-webhook", subject: event.type, status: "SENT", idempotencyKey: `stripe:${event.id}` },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
