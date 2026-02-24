import nodemailer from "nodemailer";

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.error("SMTP configuration is missing", {
      host: !!host,
      user: !!user,
      pass: !!pass,
    });
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

export const sendInvoiceEmail = async ({
  to,
  tenantName,
  roomName,
  houseName,
  month,
  year,
  roomPrice,
  electricCost,
  waterCost,
  serviceCost,
  totalAmount,
  paymentLink,
  qrImageUrl,
}) => {
  if (!to) return { sent: false, error: "Missing recipient" };
  if (!paymentLink) {
    throw new Error("Missing Stripe payment link for invoice email");
  }

  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const formatUsd = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const subject = `Room invoice ${roomName} - ${month}/${year}`;
  const text =
    `Hello ${tenantName || "there"},\n\n` +
    `Your invoice for room ${roomName}${houseName ? ` - ${houseName}` : ""} for ${month}/${year} has been created.\n` +
    `Total amount: ${formatUsd(totalAmount)}.\n\n` +
    `Payment options:\n` +
    `1) QR transfer - Scan the QR code below and reply with transfer receipt for verification.\n` +
    `2) Stripe payment: ${paymentLink}.\n` +
    `3) Cash: please reply to schedule a time for collection.\n\n` +
    `Thank you.`;

  const qrDisplayUrl = qrImageUrl || null;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="margin: 0 0 12px;">Room Invoice ${roomName}</h2>
      <p>Hello <strong>${tenantName || "there"}</strong>,</p>
      <p>Your invoice for <strong>${roomName}</strong>${houseName ? ` - <strong>${houseName}</strong>` : ""} for <strong>${month}/${year}</strong> has been created.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 520px; margin: 12px 0;">
        <tr><td style="padding: 6px 0;">Room rent</td><td style="padding: 6px 0; text-align: right;">${formatUsd(roomPrice)}</td></tr>
        <tr><td style="padding: 6px 0;">Electricity</td><td style="padding: 6px 0; text-align: right;">${formatUsd(electricCost)}</td></tr>
        <tr><td style="padding: 6px 0;">Water</td><td style="padding: 6px 0; text-align: right;">${formatUsd(waterCost)}</td></tr>
        <tr><td style="padding: 6px 0;">Services</td><td style="padding: 6px 0; text-align: right;">${formatUsd(serviceCost)}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Total</td><td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatUsd(totalAmount)}</td></tr>
      </table>

      <h3 style="margin: 16px 0 8px;">Payment options</h3>
      <ol style="padding-left: 18px;">
        <li>
          <strong>QR transfer</strong>
          <div style="margin-top: 8px; color: #d32f2f; font-weight: 500; font-size: 14px;">
            Scan this QR and reply to this email with proof of payment (transfer receipt screenshot) for verification.
          </div>
          ${
            qrDisplayUrl
              ? `<div style="margin-top: 8px;"><img src="${qrDisplayUrl}" alt="Payment QR" style="width: 220px; height: 220px; border: 1px solid #eee; object-fit: cover;" /></div>`
              : `<div style="margin-top: 8px; color: #666; font-size: 12px;">QR is currently unavailable. Please contact the owner for transfer details.</div>`
          }
        </li>
        <li style="margin-top: 8px;">
          <strong>Stripe payment</strong><br />
          <a href="${paymentLink}" target="_blank" rel="noreferrer">Open payment portal</a>
        </li>
        <li style="margin-top: 8px;">
          <strong>Cash payment</strong><br />
          Please reply to this email to schedule a time for collection.
        </li>
      </ol>

      <p style="margin-top: 12px;">Thank you!</p>
    </div>
  `;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true, messageId: info.messageId };
};

/**
 * Send payment success confirmation with detailed invoice breakdown
 */
export const sendInvoicePaidEmail = async ({
  to,
  tenantName,
  invoiceId,
  roomName,
  houseName,
  month,
  year,
  roomPrice,
  electricCost,
  waterCost,
  serviceCost,
  serviceItems = [],
  totalAmount,
  currency = "USD",
  paidAt,
  paymentMethod = "Stripe",
  transactionId,
}) => {
  if (!to) return { sent: false, error: "Missing recipient" };

  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const safeCurrency = String(currency || "USD").toUpperCase();
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const paidAtDate = paidAt ? new Date(paidAt) : null;
  const paidAtDisplay =
    paidAtDate && !Number.isNaN(paidAtDate.getTime())
      ? paidAtDate.toLocaleString("en-US")
      : "N/A";

  const subject = `✅ Payment received - Invoice #${invoiceId} (${month}/${year})`;
  const serviceItemsText =
    Array.isArray(serviceItems) && serviceItems.length
      ? serviceItems
          .map(
            (item, idx) =>
              `  ${idx + 1}. ${item.serviceName} x${item.quantity} (${formatCurrency(item.unitPrice)}) = ${formatCurrency(item.totalPrice)}`,
          )
          .join("\n")
      : "  - No additional services";

  const serviceItemsHtml =
    Array.isArray(serviceItems) && serviceItems.length
      ? serviceItems
          .map(
            (item, idx) => `
            <tr>
              <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6;">${idx + 1}. ${item.serviceName}</td>
              <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; text-align: center;">${item.quantity}</td>
              <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; text-align: right;">${formatCurrency(item.unitPrice)}</td>
              <td style="padding: 6px 10px; border-bottom: 1px solid #f3f4f6; text-align: right;">${formatCurrency(item.totalPrice)}</td>
            </tr>
          `,
          )
          .join("")
      : `<tr><td colspan="4" style="padding: 8px 10px; color: #6b7280;">No additional services</td></tr>`;

  const text =
    `Hello ${tenantName || "there"},\n\n` +
    `Your payment has been received successfully for invoice #${invoiceId}.\n` +
    `Room: ${roomName}${houseName ? ` - ${houseName}` : ""}\n` +
    `Billing period: ${month}/${year}\n\n` +
    `Invoice breakdown:\n` +
    `- Room rent: ${formatCurrency(roomPrice)}\n` +
    `- Electricity: ${formatCurrency(electricCost)}\n` +
    `- Water: ${formatCurrency(waterCost)}\n` +
    `- Services: ${formatCurrency(serviceCost)}\n` +
    `Service details:\n${serviceItemsText}\n` +
    `- Total paid: ${formatCurrency(totalAmount)}\n\n` +
    `Payment method: ${paymentMethod}\n` +
    `Paid at: ${paidAtDisplay}\n` +
    `${transactionId ? `Transaction: ${transactionId}\n` : ""}\n` +
    `Thank you.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="margin: 0 0 12px; color: #166534;">✅ Payment Confirmed</h2>
      <p>Hello <strong>${tenantName || "there"}</strong>,</p>
      <p>Your payment for invoice <strong>#${invoiceId}</strong> has been received successfully.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 12px 0; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">Room</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${roomName}${houseName ? ` - ${houseName}` : ""}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">Billing period</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${month}/${year}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">Payment method</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">Paid at</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${paidAtDisplay}</td>
        </tr>
        ${
          transactionId
            ? `<tr><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">Transaction</td><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${transactionId}</td></tr>`
            : ""
        }
      </table>

      <h3 style="margin: 16px 0 8px;">Detailed invoice</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 8px 0; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">Room rent</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(roomPrice)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">Electricity</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(electricCost)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">Water</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(waterCost)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">Services</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(serviceCost)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; font-weight: bold; color: #1d4ed8; background: #eff6ff;">Total paid</td>
          <td style="padding: 10px 12px; font-weight: bold; color: #1d4ed8; text-align: right; background: #eff6ff;">${formatCurrency(totalAmount)}</td>
        </tr>
      </table>

      <h3 style="margin: 16px 0 8px;">Service details</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 8px 0; border: 1px solid #e5e7eb;">
        <tr style="background: #f9fafb;">
          <th style="padding: 8px 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">Service</th>
          <th style="padding: 8px 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Qty</th>
          <th style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">Unit</th>
          <th style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">Amount</th>
        </tr>
        ${serviceItemsHtml}
      </table>

      <p style="margin-top: 12px;">Thank you!</p>
    </div>
  `;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true, messageId: info.messageId };
};

/**
 * Send overdue invoice notification email
 */
export const sendOverdueEmail = async ({
  to,
  tenantName,
  roomName,
  houseName,
  month,
  year,
  totalAmount,
  invoiceId,
  daysOverdue,
}) => {
  if (!to) return { sent: false, error: "Missing recipient" };

  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const formatUsd = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const subject = `⚠️ OVERDUE NOTICE: Invoice for ${roomName} - ${month}/${year}`;
  const text =
    `Hello ${tenantName || "there"},\n\n` +
    `⚠️ OVERDUE PAYMENT NOTICE\n\n` +
    `Your invoice for room ${roomName}${houseName ? ` - ${houseName}` : ""} for ${month}/${year} is now ${daysOverdue} days overdue.\n\n` +
    `Invoice ID: ${invoiceId}\n` +
    `Amount Due: ${formatUsd(totalAmount)}\n` +
    `Days Overdue: ${daysOverdue}\n\n` +
    `Please make payment immediately to avoid further action.\n\n` +
    `Payment options:\n` +
    `1) QR transfer - Please reply with proof of payment\n` +
    `2) Bank transfer - Contact the landlord for account details\n` +
    `3) Cash - Reply to this email to schedule collection\n\n` +
    `If you have already paid, please reply to this email with proof of payment.\n\n` +
    `Thank you.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <div style="padding: 16px; background-color: #ffebee; border-left: 4px solid #d32f2f; margin-bottom: 16px;">
        <h2 style="margin: 0; color: #d32f2f;">⚠️ OVERDUE PAYMENT NOTICE</h2>
      </div>

      <p>Hello <strong>${tenantName || "there"}</strong>,</p>
      
      <p>Your invoice for <strong>${roomName}</strong>${houseName ? ` - <strong>${houseName}</strong>` : ""} for <strong>${month}/${year}</strong> is now <strong style="color: #d32f2f;">${daysOverdue} days overdue</strong>.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 400px; margin: 12px 0; background-color: #fafafa; border: 1px solid #eee;">
        <tr>
          <td style="padding: 8px 12px; font-weight: bold;">Invoice ID</td>
          <td style="padding: 8px 12px;">#${invoiceId}</td>
        </tr>
        <tr style="border-top: 1px solid #eee;">
          <td style="padding: 8px 12px; font-weight: bold;">Amount Due</td>
          <td style="padding: 8px 12px; color: #d32f2f; font-weight: bold;">${formatUsd(totalAmount)}</td>
        </tr>
        <tr style="border-top: 1px solid #eee;">
          <td style="padding: 8px 12px; font-weight: bold;">Days Overdue</td>
          <td style="padding: 8px 12px; color: #d32f2f;">${daysOverdue} days</td>
        </tr>
      </table>

      <p style="color: #d32f2f; font-weight: bold; margin: 16px 0;">Please make payment immediately to avoid further action or late fees.</p>

      <h3 style="margin: 16px 0 8px;">Payment options</h3>
      <ol style="padding-left: 18px;">
        <li>
          <strong>QR transfer</strong> - Please reply with proof of payment (screenshot of transfer receipt) for verification
        </li>
        <li style="margin-top: 8px;">
          <strong>Bank transfer</strong> - Contact the landlord for account details
        </li>
        <li style="margin-top: 8px;">
          <strong>Cash payment</strong> - Reply to this email to schedule a time for collection
        </li>
      </ol>

      <p style="margin-top: 12px; color: #666; font-size: 14px;">If you have already paid this invoice, please reply to this email with proof of payment so we can update your account.</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
      
      <p style="color: #999; font-size: 12px;">This is an automated notice. Please do not reply with sensitive information (account numbers, etc.)</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error("SEND OVERDUE EMAIL ERROR:", {
      message: error?.message,
      to,
      invoiceId,
    });
    throw error;
  }
};
