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
      <h2 style="margin: 0 0 12px;">Report Status Upadated </h2>
      <p>Your report <strong>#${reportId}</strong> status is now <strong>${status}</strong>.</p>
      <p>Thank you for your feedback.</p>
    </div>
  `;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true, messageId: info.messageId };
};

const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(amount || 0));
  } catch {
    return `${amount} VND`;
  }
};

export const sendInvoiceStatusEmail = async ({
  to,
  tenantName,
  roomLabel,
  month,
  year,
  status,
  totalAmount,
}) => {
  if (!to) return { sent: false, error: "Missing recipient" };
  if (!status || !["PAID", "OVERDUE"].includes(status)) {
    return { sent: false, error: "Status not eligible" };
  }

  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const statusLabel = status === "PAID" ? "đã thanh toán" : "quá hạn";
  const subject =
    status === "PAID"
      ? `Hóa đơn đã thanh toán ${month}/${year}`
      : `Hóa đơn quá hạn ${month}/${year}`;
  const amountLabel = formatCurrency(totalAmount);
  const displayName = tenantName || "bạn";
  const displayRoom = roomLabel || "Phòng";

  const text = `Chào ${displayName},\n\nHóa đơn của ${displayRoom} cho kỳ ${month}/${year} đã chuyển sang trạng thái ${statusLabel}.\nTổng tiền: ${amountLabel}.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <p>Chào <strong>${displayName}</strong>,</p>
      <p>Hóa đơn của ${displayRoom} cho kỳ <strong>${month}/${year}</strong> đã chuyển sang trạng thái <strong>${statusLabel}</strong>.</p>
      <p>Tổng tiền: <strong>${amountLabel}</strong></p>
    </div>
  `;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true, messageId: info.messageId };
};
