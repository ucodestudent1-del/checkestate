interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getEmailProvider() {
  if (typeof window !== "undefined") return null;

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = require("resend");
      return new Resend(process.env.RESEND_API_KEY);
    } catch {
      return null;
    }
  }

  if (process.env.SENDGRID_API_KEY) {
    try {
      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      return sgMail;
    } catch {
      return null;
    }
  }

  return null;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  const provider = getEmailProvider();

  if (!provider) {
    console.warn("No email service configured, logging email instead:", { to, subject });
    return { success: true, data: { id: "mock-" + Date.now() } };
  }

  try {
    if (provider.constructor.name === "Resend") {
      const result = await provider.emails.send({
        from: process.env.EMAIL_FROM || "CheckEstate <noreply@checkestate.app>",
        to,
        subject,
        html,
        text,
      });
      return { success: true, data: result };
    }

    if (provider.constructor.name === "SendGrid") {
      const result = await provider.send({
        to,
        from: process.env.EMAIL_FROM || "noreply@checkestate.app",
        subject,
        html,
        text,
      });
      return { success: true, data: result };
    }

    throw new Error("Unknown email provider");
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  return sendEmail({
    to: email,
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
            <a href="${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}" style="background: #1e3a5f; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Verify Email</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  return sendEmail({
    to: email,
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
            <a href="${resetUrl}" style="background: #1e3a5f; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
          <p style="color: #94a3b8; font-size: 12px;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email.</p>
        </div>
      </div>
    `,
  });
}

export async function sendMaintenanceRequestNotification(
  email: string,
  requestNumber: string,
  propertyName: string,
  category: string
) {
  return sendEmail({
    to: email,
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
          <p style="color: #475569;">Log in to your CheckEstate dashboard to review and assign this request.</p>
        </div>
      </div>
    `,
  });
}

export async function sendWorkOrderStatusUpdate(
  email: string,
  workOrderNumber: string,
  status: string,
  propertyName: string,
  scheduledDate?: string
) {
  return sendEmail({
    to: email,
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
          <p style="color: #475569;">Log in to your CheckEstate dashboard for more details.</p>
        </div>
      </div>
    `,
  });
}

export async function sendTenantInvitation(email: string, token: string, propertyName: string) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/tenant/register?token=${token}`;
  return sendEmail({
    to: email,
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
  });
}

export async function sendContractorAssignment(
  email: string,
  workOrderNumber: string,
  propertyName: string,
  title: string,
  scheduledDate?: string
) {
  return sendEmail({
    to: email,
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
          <p style="color: #475569;">Log in to your CheckEstate contractor portal to view details and update the status.</p>
        </div>
      </div>
    `,
  });
}

export async function sendPaymentConfirmation(
  email: string,
  amount: number,
  planName: string,
  period: "monthly" | "yearly"
) {
  return sendEmail({
    to: email,
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
          <p style="color: #475569;">Thank you for your subscription!</p>
        </div>
      </div>
    `,
  });
}

export async function sendPaymentFailed(
  email: string,
  planName: string,
  retryUrl: string
) {
  return sendEmail({
    to: email,
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
        </div>
      </div>
    `,
  });
}