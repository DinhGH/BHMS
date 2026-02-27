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

const escapeHtml = (value) => {
  const text = String(value ?? "");
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const formatReportAdminStatus = (status) => {
  const labelByStatus = {
    PENDING: "Pending",
    PROCESSING: "In Resolution",
    RESOLVED: "Resolved",
    REVIEWING: "Under Review",
    FIXING: "In Fixing",
  };

  return labelByStatus[status] || "Updated";
};

export const sendReportAdminStatusEmail = async ({
  to,
  ownerName,
  reportId,
  status,
  category,
  summary,
}) => {
  if (!to) return { sent: false, error: "Missing recipient" };

  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const statusLabel = formatReportAdminStatus(status);

  const safeOwnerName = escapeHtml(ownerName || "Owner");
  const safeCategory = escapeHtml(category || "N/A");
  const safeSummary = escapeHtml(summary || "N/A");

  const subject = `[BHMS] Report #${reportId} status updated to ${statusLabel}`;

  const text =
    `Hello ${ownerName || "Owner"},\n\n` +
    `Your report #${reportId} has a status update.\n` +
    `Current status: ${statusLabel}\n` +
    `Category: ${category || "N/A"}\n` +
    `Summary: ${summary || "N/A"}\n\n` +
    `Thank you for helping us improve BHMS.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
      <h2 style="margin: 0 0 12px;">BHMS Report Status Update</h2>
      <p>Hello <strong>${safeOwnerName}</strong>,</p>
      <p>Your report <strong>#${reportId}</strong> has a status update.</p>

      <table style="border-collapse: collapse; width: 100%; max-width: 560px; margin: 12px 0; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">Current status</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(statusLabel)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; background: #f9fafb;">Category</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${safeCategory}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; background: #f9fafb;">Summary</td>
          <td style="padding: 8px 12px;">${safeSummary}</td>
        </tr>
      </table>

      <p style="margin-top: 12px;">Thank you for helping us improve BHMS.</p>
    </div>
  `;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  return { sent: true, messageId: info.messageId };
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
    <div style="margin: 0; padding: 0; background: #f3f6fb; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a;">
      <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
        Invoice for ${roomName} - ${month}/${year}: total ${formatUsd(totalAmount)}.
      </div>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f3f6fb; padding: 24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 680px; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);">
              <tr>
                <td style="padding: 24px 28px; background: linear-gradient(135deg, #0ea5e9, #2563eb); color: #ffffff;">
                  <div style="font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; opacity: 0.9;">Invoice Notification</div>
                  <h2 style="margin: 8px 0 4px; font-size: 26px; line-height: 1.3;">Room Invoice ${roomName}</h2>
                  <div style="font-size: 14px; opacity: 0.95;">Billing period: ${month}/${year}</div>
                </td>
              </tr>

              <tr>
                <td style="padding: 22px 28px 8px;">
                  <p style="margin: 0 0 8px; font-size: 16px; color: #334155;">Hello <strong style="color: #0f172a;">${tenantName || "there"}</strong>,</p>
                  <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7;">
                    Your invoice for <strong style="color: #0f172a;">${roomName}</strong>${houseName ? ` - <strong style="color: #0f172a;">${houseName}</strong>` : ""} has been created.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 14px 28px 8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <tr>
                      <td style="padding: 14px 16px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px;">Total Amount Due</td>
                      <td style="padding: 14px 16px; font-size: 24px; font-weight: 700; color: #1d4ed8; text-align: right;">${formatUsd(totalAmount)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 12px 28px 6px;">
                  <h3 style="margin: 0 0 10px; font-size: 18px; color: #0f172a;">Invoice breakdown</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <tr style="background: #f8fafc;">
                      <td style="padding: 10px 14px; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0;">Room rent</td>
                      <td style="padding: 10px 14px; font-size: 14px; color: #0f172a; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatUsd(roomPrice)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 14px; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0;">Electricity</td>
                      <td style="padding: 10px 14px; font-size: 14px; color: #0f172a; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatUsd(electricCost)}</td>
                    </tr>
                    <tr style="background: #f8fafc;">
                      <td style="padding: 10px 14px; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0;">Water</td>
                      <td style="padding: 10px 14px; font-size: 14px; color: #0f172a; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatUsd(waterCost)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 14px; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0;">Services</td>
                      <td style="padding: 10px 14px; font-size: 14px; color: #0f172a; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatUsd(serviceCost)}</td>
                    </tr>
                    <tr style="background: #eff6ff;">
                      <td style="padding: 12px 14px; font-size: 15px; font-weight: 700; color: #1e3a8a;">Total</td>
                      <td style="padding: 12px 14px; font-size: 16px; font-weight: 700; color: #1d4ed8; text-align: right;">${formatUsd(totalAmount)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 18px 28px 0;">
                  <h3 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">Payment options</h3>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 28px 8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px;">
                    <tr>
                      <td style="padding: 14px 14px 8px; font-size: 16px; font-weight: 700; color: #9a3412;">1) QR transfer</td>
                    </tr>
                    <tr>
                      <td style="padding: 0 14px 14px; font-size: 14px; color: #7c2d12; line-height: 1.6;">
                        Scan this QR and reply to this email with proof of payment (transfer receipt screenshot) for verification.
                        ${
                          qrDisplayUrl
                            ? `<div style="margin-top: 10px;"><img src="${qrDisplayUrl}" alt="Payment QR" style="width: 220px; height: 220px; border: 1px solid #fdba74; border-radius: 10px; object-fit: cover; background: #fff;" /></div>`
                            : `<div style="margin-top: 10px; color: #9a3412; font-size: 13px;">QR is currently unavailable. Please contact the owner for transfer details.</div>`
                        }
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 4px 28px 8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;">
                    <tr>
                      <td style="padding: 14px;">
                        <div style="font-size: 16px; font-weight: 700; color: #1e40af; margin-bottom: 8px;">2) Stripe payment</div>
                        <a href="${paymentLink}" target="_blank" rel="noreferrer" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600;">Open payment portal</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 4px 28px 18px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <tr>
                      <td style="padding: 14px;">
                        <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">3) Cash payment</div>
                        <div style="font-size: 14px; color: #475569;">Please reply to this email to schedule a time for collection.</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 28px 24px;">
                  <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                    Thank you for your prompt payment 💙
                  </p>
                </td>
              </tr>
            </table>

            <div style="max-width: 680px; margin-top: 10px; color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center;">
              This is an automated invoice email. If you need support, please reply to this message.
            </div>
          </td>
        </tr>
      </table>
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
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${idx + 1}. ${item.serviceName}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #334155;">${item.quantity}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #334155;">${formatCurrency(item.unitPrice)}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: 600;">${formatCurrency(item.totalPrice)}</td>
            </tr>
          `,
          )
          .join("")
      : `<tr><td colspan="4" style="padding: 10px; color: #64748b;">No additional services</td></tr>`;

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
    <div style="margin: 0; padding: 0; background: #f3f6fb; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a;">
      <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
        Payment received for invoice #${invoiceId}. Total paid: ${formatCurrency(totalAmount)}.
      </div>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f3f6fb; padding: 24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 680px; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #dbeafe; box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);">
              <tr>
                <td style="padding: 24px 28px; background: linear-gradient(135deg, #16a34a, #0ea5e9); color: #ffffff;">
                  <div style="font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; opacity: 0.9;">Payment Confirmation</div>
                  <h2 style="margin: 8px 0 4px; font-size: 26px; line-height: 1.3;">✅ Payment Received</h2>
                  <div style="font-size: 14px; opacity: 0.95;">Invoice #${invoiceId} • ${month}/${year}</div>
                </td>
              </tr>

              <tr>
                <td style="padding: 22px 28px 8px;">
                  <p style="margin: 0 0 8px; font-size: 16px; color: #334155;">Hello <strong style="color: #0f172a;">${tenantName || "there"}</strong>,</p>
                  <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.7;">
                    Your payment for invoice <strong style="color: #0f172a;">#${invoiceId}</strong> has been received successfully.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding: 14px 28px 8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; overflow: hidden;">
                    <tr>
                      <td style="padding: 14px 16px; font-size: 13px; color: #15803d; text-transform: uppercase; letter-spacing: 0.4px;">Total Paid</td>
                      <td style="padding: 14px 16px; font-size: 24px; font-weight: 700; color: #166534; text-align: right;">${formatCurrency(totalAmount)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 10px 28px 6px;">
                  <h3 style="margin: 0 0 10px; font-size: 18px; color: #0f172a;">Payment summary</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <tr style="background: #f8fafc;">
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">Room</td>
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${roomName}${houseName ? ` - ${houseName}` : ""}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">Billing period</td>
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${month}/${year}</td>
                    </tr>
                    <tr style="background: #f8fafc;">
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">Payment method</td>
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${paymentMethod}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">Paid at</td>
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${paidAtDisplay}</td>
                    </tr>
                    ${
                      transactionId
                        ? `<tr style="background: #f8fafc;"><td style="padding: 10px 12px; color: #334155;">Transaction</td><td style="padding: 10px 12px; color: #0f172a;">${transactionId}</td></tr>`
                        : ""
                    }
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 14px 28px 6px;">
                  <h3 style="margin: 0 0 10px; font-size: 18px; color: #0f172a;">Detailed invoice</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <tr style="background: #f8fafc;">
                      <td style="padding: 10px 14px; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0;">Room rent</td>
                      <td style="padding: 10px 14px; font-size: 14px; color: #0f172a; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatCurrency(roomPrice)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 14px; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0;">Electricity</td>
                      <td style="padding: 10px 14px; font-size: 14px; color: #0f172a; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatCurrency(electricCost)}</td>
                    </tr>
                    <tr style="background: #f8fafc;">
                      <td style="padding: 10px 14px; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0;">Water</td>
                      <td style="padding: 10px 14px; font-size: 14px; color: #0f172a; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatCurrency(waterCost)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 14px; font-size: 14px; color: #334155; border-bottom: 1px solid #e2e8f0;">Services</td>
                      <td style="padding: 10px 14px; font-size: 14px; color: #0f172a; text-align: right; border-bottom: 1px solid #e2e8f0;">${formatCurrency(serviceCost)}</td>
                    </tr>
                    <tr style="background: #dcfce7;">
                      <td style="padding: 12px 14px; font-size: 15px; font-weight: 700; color: #166534;">Total paid</td>
                      <td style="padding: 12px 14px; font-size: 16px; font-weight: 700; color: #166534; text-align: right;">${formatCurrency(totalAmount)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding: 14px 28px 20px;">
                  <h3 style="margin: 0 0 10px; font-size: 18px; color: #0f172a;">Service details</h3>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <tr style="background: #eff6ff;">
                      <th style="padding: 9px 10px; text-align: left; border-bottom: 1px solid #dbeafe; color: #1e3a8a;">Service</th>
                      <th style="padding: 9px 10px; text-align: center; border-bottom: 1px solid #dbeafe; color: #1e3a8a;">Qty</th>
                      <th style="padding: 9px 10px; text-align: right; border-bottom: 1px solid #dbeafe; color: #1e3a8a;">Unit</th>
                      <th style="padding: 9px 10px; text-align: right; border-bottom: 1px solid #dbeafe; color: #1e3a8a;">Amount</th>
                    </tr>
                    ${serviceItemsHtml}
                  </table>
                </td>
              </tr>
            </table>

            <div style="max-width: 680px; margin-top: 10px; color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center;">
              This is an automated payment confirmation email. Need support? Just reply to this message.
            </div>
          </td>
        </tr>
      </table>
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
