import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Client — lazy, guarded initialization (BP-036: never init at module scope)
// ---------------------------------------------------------------------------

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is not configured. Set this environment variable to enable email sending.",
      );
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Innara <noreply@innara.app>";

// ---------------------------------------------------------------------------
// Email validation helper
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

// ---------------------------------------------------------------------------
// sendStaffInvitationEmail
// ---------------------------------------------------------------------------

export interface StaffInvitationEmailParams {
  to: string;
  inviteeName: string | null;
  hotelName: string;
  department: string | null;
  role: string;
  invitedByName: string;
  inviteToken: string;
  expiresAt: Date;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendStaffInvitationEmail(
  params: StaffInvitationEmailParams,
): Promise<EmailResult> {
  if (!isValidEmail(params.to)) {
    return { success: false, error: "Invalid recipient email address." };
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `You've been invited to join ${params.hotelName} on Innara`,
      html: buildInvitationHtml(params),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send invitation email.",
    };
  }
}

// ---------------------------------------------------------------------------
// sendPasswordResetEmail
// ---------------------------------------------------------------------------

export interface PasswordResetEmailParams {
  to: string;
  resetUrl: string;
  userName: string | null;
}

export async function sendPasswordResetEmail(
  params: PasswordResetEmailParams,
): Promise<EmailResult> {
  if (!isValidEmail(params.to)) {
    return { success: false, error: "Invalid recipient email address." };
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: "Reset your Innara password",
      html: buildPasswordResetHtml(params),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send password reset email.",
    };
  }
}

// ---------------------------------------------------------------------------
// HTML builders — inline styles, email-safe
// ---------------------------------------------------------------------------

const NAVY = "#1a1d3a";
const BRONZE = "#9B7340";
const LIGHT_NAVY = "#2a2f5a";
const TEXT_LIGHT = "#e8e9f0";
const TEXT_MUTED = "#a0a3b8";
const BORDER = "#2e3260";
const WHITE = "#ffffff";

function baseEmailHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Innara</title>
</head>
<body style="margin:0;padding:0;background-color:#0f1124;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#0f1124;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:${NAVY};border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid ${BORDER};">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:${WHITE};letter-spacing:-0.5px;">Inn</span><span style="font-size:22px;font-weight:700;color:${BRONZE};letter-spacing:-0.5px;">ara</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          ${content}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid ${BORDER};background-color:${LIGHT_NAVY};">
              <p style="margin:0;font-size:12px;color:${TEXT_MUTED};line-height:1.6;">
                This email was sent by Innara on behalf of your hotel. If you did not expect this email, you can safely ignore it.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:${TEXT_MUTED};">
                &copy; ${new Date().getFullYear()} Innara. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildInvitationHtml(params: StaffInvitationEmailParams): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.innara.app";
  const acceptUrl = `${appUrl}/auth/staff/accept-invite?token=${params.inviteToken}`;

  const greeting = params.inviteeName
    ? `Hi ${params.inviteeName},`
    : "Hi there,";

  const departmentLine = params.department
    ? `<tr><td style="padding:4px 0;"><span style="font-size:14px;color:${TEXT_MUTED};">Department</span></td><td style="padding:4px 0;"><span style="font-size:14px;color:${TEXT_LIGHT};">${escapeHtml(params.department)}</span></td></tr>`
    : "";

  const expiryFormatted = params.expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const content = `
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:15px;color:${TEXT_LIGHT};">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;color:${TEXT_LIGHT};line-height:1.6;">
                <strong style="color:${WHITE};">${escapeHtml(params.invitedByName)}</strong> has invited you to join
                <strong style="color:${WHITE};">${escapeHtml(params.hotelName)}</strong> as a member of their team on Innara.
              </p>

              <!-- Details table -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${LIGHT_NAVY};border-radius:8px;padding:20px;margin-bottom:32px;border:1px solid ${BORDER};">
                <tr>
                  <td style="padding:4px 0;width:120px;">
                    <span style="font-size:14px;color:${TEXT_MUTED};">Hotel</span>
                  </td>
                  <td style="padding:4px 0;">
                    <span style="font-size:14px;color:${TEXT_LIGHT};">${escapeHtml(params.hotelName)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;">
                    <span style="font-size:14px;color:${TEXT_MUTED};">Role</span>
                  </td>
                  <td style="padding:4px 0;">
                    <span style="font-size:14px;color:${TEXT_LIGHT};">${escapeHtml(formatRole(params.role))}</span>
                  </td>
                </tr>
                ${departmentLine}
              </table>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${acceptUrl}" style="display:inline-block;background-color:${BRONZE};color:${WHITE};text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.2px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <p style="margin:0 0 12px;font-size:13px;color:${TEXT_MUTED};text-align:center;">
                This invitation expires on <strong style="color:${TEXT_LIGHT};">${expiryFormatted}</strong>.
              </p>

              <!-- Plain URL fallback -->
              <p style="margin:0;font-size:12px;color:${TEXT_MUTED};text-align:center;word-break:break-all;">
                If the button does not work, copy and paste this link into your browser:<br />
                <span style="color:${BRONZE};">${acceptUrl}</span>
              </p>
            </td>
          </tr>`;

  return baseEmailHtml(content);
}

function buildPasswordResetHtml(params: PasswordResetEmailParams): string {
  const greeting = params.userName ? `Hi ${escapeHtml(params.userName)},` : "Hi there,";

  const content = `
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:15px;color:${TEXT_LIGHT};">${greeting}</p>
              <p style="margin:0 0 24px;font-size:15px;color:${TEXT_LIGHT};line-height:1.6;">
                We received a request to reset the password for your Innara account. Click the button below to choose a new password.
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${params.resetUrl}" style="display:inline-block;background-color:${BRONZE};color:${WHITE};text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;letter-spacing:0.2px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <p style="margin:0 0 12px;font-size:13px;color:${TEXT_MUTED};text-align:center;">
                This link expires in <strong style="color:${TEXT_LIGHT};">1 hour</strong>. If you did not request a password reset, no action is needed.
              </p>

              <!-- Plain URL fallback -->
              <p style="margin:0;font-size:12px;color:${TEXT_MUTED};text-align:center;word-break:break-all;">
                If the button does not work, copy and paste this link into your browser:<br />
                <span style="color:${BRONZE};">${params.resetUrl}</span>
              </p>
            </td>
          </tr>`;

  return baseEmailHtml(content);
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatRole(role: string): string {
  const MAP: Record<string, string> = {
    staff: "Staff",
    front_desk: "Front Desk",
    manager: "Manager",
    admin: "Admin",
  };
  return MAP[role] ?? role;
}
