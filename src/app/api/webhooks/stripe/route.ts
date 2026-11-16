import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/lib/db";

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(secretKey, { apiVersion: "2025-06-30.basil" as any });
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret && process.env.NODE_ENV === "production") {
  throw new Error("STRIPE_WEBHOOK_SECRET is required in production");
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret || "");
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  try {
    // Wrap entire webhook processing in a transaction for atomicity
    const result = await db.$transaction(async (tx) => {
      // Idempotency check with retry logic
      const existingEvent = await tx.webhookEvent.findUnique({
        where: { eventId: event.id },
      });

      if (existingEvent?.processedAt) {
        // Already processed successfully, return early
        return { received: true, skipProcessing: true };
      }

      if (existingEvent && existingEvent.error && !existingEvent.processedAt) {
        // Previous attempt failed - allow retry (Stripe will retry failed webhooks)
        // Reset error to allow reprocessing
        await tx.webhookEvent.update({
          where: { eventId: event.id },
          data: { error: null, payload: event.data.object as any },
        });
      }

      // Create or update webhook event record (prevents race conditions)
      await tx.webhookEvent.upsert({
        where: { eventId: event.id },
        create: {
          eventId: event.id,
          eventType: event.type,
          payload: event.data.object as any,
          processedAt: null,
          error: null,
        },
        update: {
          eventType: event.type,
          payload: event.data.object as any,
          processedAt: null,
          error: null,
        },
      });

      // Process event based on type
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          const org = await tx.organization.findFirst({ where: { stripeCustomerId: customerId } });
          if (org && subscriptionId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            await tx.organization.update({
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
          const org = await tx.organization.findFirst({ where: { stripeSubscriptionId: sub.id } });
          if (org) {
            await tx.organization.update({
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
          const org = await tx.organization.findFirst({ where: { stripeSubscriptionId: sub.id } });
          if (org) {
            await tx.organization.update({ where: { id: org.id }, data: { subscriptionStatus: "CANCELED" } });
          }
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const org = await tx.organization.findFirst({ where: { stripeCustomerId: invoice.customer as string } });
          if (org) {
            await tx.organization.update({ where: { id: org.id }, data: { subscriptionStatus: "PAST_DUE" } });
          }
          break;
        }
      }

      // Mark webhook event as processed
      await tx.webhookEvent.update({
        where: { eventId: event.id },
        data: { processedAt: new Date(), error: null },
      });

      return { received: true, skipProcessing: false };
    });

    return NextResponse.json(result);
  } catch (err) {
    // Mark webhook event as failed
    try {
      await db.webhookEvent.upsert({
        where: { eventId: event.id },
        create: {
          eventId: event.id,
          eventType: event.type || "unknown",
          payload: {},
          processedAt: null,
          error: err instanceof Error ? err.message : "Unknown error",
        },
        update: {
          processedAt: null,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      });
    } catch {
      // Ignore DB errors during error logging
    }

    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }
}
