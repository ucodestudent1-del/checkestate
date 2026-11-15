import { Resend } from "resend";
import { db } from "@/lib/db";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || "CheckEstate <noreply@checkestate.app>";
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const templates: Record<string, (data: Record<string, any>) => EmailTemplate> = {
  verification: ({ token, email }) => ({
    subject: "Verify your CheckEstate account",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1e3a5f; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CheckEstate</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Verify your email address</h2>
          <p style="color: #475569; line-height: 1.6;">Thanks for signing up for CheckEstate. Please click the button below to verify your email address and activate your account.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${NEXTAUTH_URL}/auth/verify-email?token=${token}" style="background: #1e3a5f; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Verify Email</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>${NEXTAUTH_URL}/auth/verify-email?token=${token}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    `,
  }),

  passwordReset: ({ token }) => ({
    subject: "Reset your CheckEstate password",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1e3a5f; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CheckEstate</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Reset your password</h2>
          <p style="color: #475569; line-height: 1.6;">You requested to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${NEXTAUTH_URL}/auth/reset-password?token=${token}" style="background: #1e3a5f; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>${NEXTAUTH_URL}/auth/reset-password?token=${token}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email.</p>
        </div>
      </div>
    `,
  }),

  maintenanceRequest: ({ requestNumber, propertyName, category, dashboardUrl }) => ({
    subject: `New maintenance request: ${requestNumber}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1e3a5f; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CheckEstate</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">New maintenance request received</h2>
          <p style="color: #475569; line-height: 1.6;">A new maintenance request has been submitted for your property.</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 4px 0;"><strong>Request #:</strong> ${requestNumber}</p>
            <p style="margin: 4px 0;"><strong>Property:</strong> ${propertyName}</p>
            <p style="margin: 4px 0;"><strong>Category:</strong> ${category}</p>
          </div>
          <p style="color: #475569;"><a href="${dashboardUrl}" style="color: #1e3a5f;">Log in to your CheckEstate dashboard</a> to review and assign this request.</p>
        </div>
      </div>
    `,
  }),

  workOrderStatusUpdate: ({ workOrderNumber, status, propertyName, scheduledDate, dashboardUrl }) => ({
    subject: `Work order update: ${workOrderNumber} - ${status.replace(/_/g, " ")}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1e3a5f; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CheckEstate</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Work order status updated</h2>
          <p style="color: #475569; line-height: 1.6;">The status of your work order has been updated.</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 4px 0;"><strong>Work Order #:</strong> ${workOrderNumber}</p>
            <p style="margin: 4px 0;"><strong>Property:</strong> ${propertyName}</p>
            <p style="margin: 4px 0;"><strong>New Status:</strong> ${status.replace(/_/g, " ")}</p>
            ${scheduledDate ? `<p style="margin: 4px 0;"><strong>Scheduled:</strong> ${new Date(scheduledDate).toLocaleDateString()}</p>` : ""}
          </div>
          <p style="color: #475569;"><a href="${dashboardUrl}" style="color: #1e3a5f;">Log in to your CheckEstate dashboard</a> for more details.</p>
        </div>
      </div>
    `,
  }),

  tenantInvitation: ({ token, propertyName, inviteUrl }) => ({
    subject: `You've been invited to CheckEstate for ${propertyName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1e3a5f; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CheckEstate</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">You've been invited to CheckEstate</h2>
          <p style="color: #475569; line-height: 1.6;">Your property manager has invited you to use the CheckEstate tenant portal for <strong>${propertyName}</strong>.</p>
          <p style="color: #475569; line-height: 1.6;">Through the portal, you can submit maintenance requests, track repair progress, and communicate with your property manager.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteUrl}" style="background: #1e3a5f; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>${inviteUrl}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px;">This invitation expires in 7 days.</p>
        </div>
      </div>
    `,
  }),

  contractorAssignment: ({ workOrderNumber, title, propertyName, scheduledDate, portalUrl }) => ({
    subject: `New work order assigned: ${workOrderNumber}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1e3a5f; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CheckEstate</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">New work order assigned</h2>
          <p style="color: #475569; line-height: 1.6;">You have been assigned a new work order.</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 4px 0;"><strong>Work Order #:</strong> ${workOrderNumber}</p>
            <p style="margin: 4px 0;"><strong>Title:</strong> ${title}</p>
            <p style="margin: 4px 0;"><strong>Property:</strong> ${propertyName}</p>
            ${scheduledDate ? `<p style="margin: 4px 0;"><strong>Scheduled:</strong> ${new Date(scheduledDate).toLocaleDateString()}</p>` : ""}
          </div>
          <p style="color: #475569;"><a href="${portalUrl}" style="color: #1e3a5f;">Log in to your CheckEstate contractor portal</a> to view details and update the status.</p>
        </div>
      </div>
    `,
  }),

  paymentConfirmation: ({ amount, planName, period, dashboardUrl }) => ({
    subject: `Payment confirmed: ${planName} plan`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1e3a5f; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CheckEstate</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Payment confirmed</h2>
          <p style="color: #475569; line-height: 1.6;">Your payment has been successfully processed.</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 4px 0;"><strong>Plan:</strong> ${planName}</p>
            <p style="margin: 4px 0;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            <p style="margin: 4px 0;"><strong>Billing:</strong> ${period === "yearly" ? "Annually" : "Monthly"}</p>
          </div>
          <p style="color: #475569;"><a href="${dashboardUrl}" style="color: #1e3a5f;">View your subscription</a> in the dashboard.</p>
        </div>
      </div>
    `,
  }),

  paymentFailed: ({ planName, retryUrl, dashboardUrl }) => ({
    subject: `Payment failed: ${planName} plan`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #dc2626; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CheckEstate</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Payment failed</h2>
          <p style="color: #475569; line-height: 1.6;">We were unable to process your payment for the <strong>${planName}</strong> plan.</p>
          <p style="color: #475569; line-height: 1.6;">This may be due to an expired card, insufficient funds, or a bank decline. Please update your payment method to avoid service interruption.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${retryUrl}" style="background: #dc2626; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Update Payment Method</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>${retryUrl}</p>
          <p style="color: #475569;"><a href="${dashboardUrl}" style="color: #1e3a5f;">View subscription details</a></p>
        </div>
      </div>
    `,
  }),

  documentExpiry: ({ contractorName, documentType, expiryDate, dashboardUrl }) => ({
    subject: `Document expiring soon: ${documentType}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1e3a5f; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CheckEstate</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Document expiring soon</h2>
          <p style="color: #475569; line-height: 1.6;">A document for <strong>${contractorName}</strong> is expiring soon.</p>
          <div style="background: #fef3c7; padding: 16px; border-radius: 6px; margin: 24px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 4px 0;"><strong>Document:</strong> ${documentType}</p>
            <p style="margin: 4px 0;"><strong>Expires:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
          </div>
          <p style="color: #475569;"><a href="${dashboardUrl}" style="color: #1e3a5f;">Log in to your CheckEstate dashboard</a> to update the document.</p>
        </div>
      </div>
    `,
  }),

  maintenanceReminder: ({ requestNumber, propertyName, daysOverdue, dashboardUrl }) => ({
    subject: `Maintenance request overdue: ${requestNumber} (${daysOverdue} days)`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #dc2626; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">CheckEstate</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e293b; margin-top: 0;">Maintenance request overdue</h2>
          <p style="color: #475569; line-height: 1.6;">A maintenance request has been open for <strong>${daysOverdue} days</strong> without resolution.</p>
          <div style="background: #fef2f2; padding: 16px; border-radius: 6px; margin: 24px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 4px 0;"><strong>Request #:</strong> ${requestNumber}</p>
            <p style="margin: 4px 0;"><strong>Property:</strong> ${propertyName}</p>
          </div>
          <p style="color: #475569;"><a href="${dashboardUrl}" style="color: #1e3a5f;">Log in to your CheckEstate dashboard</a> to take action.</p>
        </div>
      </div>
    `,
  }),
};

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; data?: any; error?: string }> {
  const { to, subject, html, text, idempotencyKey } = options;

  if (!resend) {
    console.warn("No email service configured (RESEND_API_KEY missing), logging email instead:", { to, subject });
    return { success: true, data: { id: `mock-${Date.now()}` } };
  }

  if (idempotencyKey) {
    const existing = await db.emailLog.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return { success: true, data: { id: existing.id, duplicate: true } };
    }
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    if (idempotencyKey) {
      await db.emailLog.create({
        data: {
          to,
          template: idempotencyKey.split(":")[0] || "unknown",
          subject,
          status: "SENT",
          sentAt: new Date(),
          idempotencyKey,
        },
      });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send email:", error);

    if (idempotencyKey) {
      await db.emailLog.create({
        data: {
          to,
          template: idempotencyKey.split(":")[0] || "unknown",
          subject,
          status: "FAILED",
          idempotencyKey,
        },
      }).catch(() => {});
    }

    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function sendTemplateEmail(
  templateName: keyof typeof templates,
  to: string,
  data: Record<string, any>,
  idempotencyKey?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const template = templates[templateName];
  if (!template) {
    return { success: false, error: `Template ${templateName} not found` };
  }

  const { subject, html } = template(data);
  return sendEmail({ to, subject, html, idempotencyKey });
}

export async function queueEmail(
  templateName: keyof typeof templates,
  to: string,
  data: Record<string, any>,
  idempotencyKey: string,
  scheduledAt?: Date
): Promise<void> {
  await db.emailLog.create({
    data: {
      to,
      template: templateName,
      subject: templates[templateName](data).subject,
      status: scheduledAt ? "SCHEDULED" : "PENDING",
      sentAt: scheduledAt || null,
      idempotencyKey,
    },
  });
}

export async function processEmailQueue(limit = 50): Promise<number> {
  if (!resend) return 0;

  const pending = await db.emailLog.findMany({
    where: {
      status: { in: ["PENDING", "SCHEDULED"] },
      OR: [{ sentAt: null }, { sentAt: { lte: new Date() } }],
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  let sent = 0;
  for (const email of pending) {
    const template = templates[email.template as keyof typeof templates];
    if (!template) continue;

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email.to,
        subject: email.subject,
        html: "", // Would need to reconstruct from stored data
      });

      await db.emailLog.update({
        where: { id: email.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      sent++;
    } catch (error) {
      await db.emailLog.update({
        where: { id: email.id },
        data: { status: "FAILED" },
      });
    }
  }

  return sent;
}

export const emailTemplates = {
  sendVerificationEmail: (email: string, token: string) =>
    sendTemplateEmail("verification", email, { token, email }, `verification:${token}`),

  sendPasswordResetEmail: (email: string, token: string) =>
    sendTemplateEmail("passwordReset", email, { token }, `passwordReset:${token}`),

  sendMaintenanceRequestNotification: (
    email: string,
    requestNumber: string,
    propertyName: string,
    category: string,
    dashboardUrl = `${NEXTAUTH_URL}/dashboard/maintenance-requests`
  ) =>
    sendTemplateEmail("maintenanceRequest", email, { requestNumber, propertyName, category, dashboardUrl }, `maintenanceRequest:${requestNumber}`),

  sendWorkOrderStatusUpdate: (
    email: string,
    workOrderNumber: string,
    status: string,
    propertyName: string,
    scheduledDate?: string,
    dashboardUrl = `${NEXTAUTH_URL}/dashboard/work-orders`
  ) =>
    sendTemplateEmail("workOrderStatusUpdate", email, { workOrderNumber, status, propertyName, scheduledDate, dashboardUrl }, `workOrderStatus:${workOrderNumber}:${status}`),

  sendTenantInvitation: (email: string, token: string, propertyName: string) => {
    const inviteUrl = `${NEXTAUTH_URL}/tenant/register?token=${token}`;
    return sendTemplateEmail("tenantInvitation", email, { token, propertyName, inviteUrl }, `tenantInvitation:${token}`);
  },

  sendContractorAssignment: (
    email: string,
    workOrderNumber: string,
    title: string,
    propertyName: string,
    scheduledDate?: string,
    portalUrl = `${NEXTAUTH_URL}/contractor`
  ) =>
    sendTemplateEmail("contractorAssignment", email, { workOrderNumber, title, propertyName, scheduledDate, portalUrl }, `contractorAssignment:${workOrderNumber}`),

  sendPaymentConfirmation: (
    email: string,
    amount: number,
    planName: string,
    period: "monthly" | "yearly",
    dashboardUrl = `${NEXTAUTH_URL}/dashboard/subscription`
  ) =>
    sendTemplateEmail("paymentConfirmation", email, { amount, planName, period, dashboardUrl }, `paymentConfirmation:${planName}:${amount}`),

  sendPaymentFailed: (
    email: string,
    planName: string,
    retryUrl: string,
    dashboardUrl = `${NEXTAUTH_URL}/dashboard/subscription`
  ) =>
    sendTemplateEmail("paymentFailed", email, { planName, retryUrl, dashboardUrl }, `paymentFailed:${planName}`),

  sendDocumentExpiry: (
    email: string,
    contractorName: string,
    documentType: string,
    expiryDate: string,
    dashboardUrl = `${NEXTAUTH_URL}/dashboard/contractors`
  ) =>
    sendTemplateEmail("documentExpiry", email, { contractorName, documentType, expiryDate, dashboardUrl }, `documentExpiry:${contractorName}:${documentType}`),

  sendMaintenanceReminder: (
    email: string,
    requestNumber: string,
    propertyName: string,
    daysOverdue: number,
    dashboardUrl = `${NEXTAUTH_URL}/dashboard/maintenance-requests`
  ) =>
    sendTemplateEmail("maintenanceReminder", email, { requestNumber, propertyName, daysOverdue, dashboardUrl }, `maintenanceReminder:${requestNumber}`),
};