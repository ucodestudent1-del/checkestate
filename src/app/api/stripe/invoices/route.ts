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
    return NextResponse.json({ error: "Only organization owners can view invoices" }, { status: 403 });
  }

  const org = await db.organization.findUnique({
    where: { id: ctx.organizationId },
  });

  if (!org || !org.stripeCustomerId) {
    return NextResponse.json({ data: [] });
  }

  const stripe = getStripe();

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");

  const invoices = await stripe.invoices.list({
    customer: org.stripeCustomerId,
    limit,
    status: "paid",
  });

  const formattedInvoices = invoices.data.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    date: invoice.created,
    dueDate: invoice.due_date,
    pdfUrl: invoice.invoice_pdf,
    hostedUrl: invoice.hosted_invoice_url,
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    lines: invoice.lines.data.map((line) => ({
      description: line.description,
      amount: line.amount,
      currency: line.currency,
      period: line.period,
    })),
  }));

  return NextResponse.json({ data: formattedInvoices });
});

const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await requireOrganization();
  const user = await getCurrentUser();

  if (!["PROPERTY_OWNER", "PROPERTY_MANAGER"].includes(user.role) && !user.isOrganizationOwner) {
    return NextResponse.json({ error: "Only organization owners can generate invoices" }, { status: 403 });
  }

  const org = await db.organization.findUnique({
    where: { id: ctx.organizationId },
  });

  if (!org || !org.stripeCustomerId) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 });
  }

  const body = await req.json();
  const { invoiceId } = body;

  if (!invoiceId) {
    return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });
  }

  const stripe = getStripe();

  const invoice = await stripe.invoices.retrieve(invoiceId);

  if (invoice.customer !== org.stripeCustomerId) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status !== "paid") {
    return NextResponse.json({ error: "Invoice not paid" }, { status: 400 });
  }

  const pdfUrl = invoice.invoice_pdf;

  if (!pdfUrl) {
    return NextResponse.json({ error: "PDF not available" }, { status: 404 });
  }

  return NextResponse.json({ pdfUrl, hostedUrl: invoice.hosted_invoice_url });
});

export { GET, POST };