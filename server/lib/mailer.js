import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration is missing");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const sendTenantStatusEmail = async ({ to, reportId, status }) => {
  if (!to) return { sent: false, error: "Missing recipient" };

  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const subject = `Report #${reportId} status updated to ${status}`;
  const text = `Your report #${reportId} status is now ${status}.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2 style="margin: 0 0 12px;">Report status updated</h2>
      <p>Your report <strong>#${reportId}</strong> status is now <strong>${status}</strong>.</p>
      <p>Thank you for your feedback.</p>
    </div>
  `;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true, messageId: info.messageId };
};
