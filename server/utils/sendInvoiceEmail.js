import nodemailer from "nodemailer";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2022-11-15",
});

export const sendInvoiceEmail = async (tenantOrEmail, invoice) => {
  // Handle both string email and tenant object
  let emails = [];
  if (typeof tenantOrEmail === "string") {
    // Single email address
    emails = [tenantOrEmail];
  } else if (Array.isArray(tenantOrEmail)) {
    // Array of tenant objects
    emails = tenantOrEmail.filter((t) => t && t.email).map((t) => t.email);
  } else if (tenantOrEmail && tenantOrEmail.email) {
    // Single tenant object
    emails = [tenantOrEmail.email];
  }

  if (!emails || emails.length === 0) {
    console.warn("No valid email addresses to send invoice to");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  let checkoutUrl = null;

  try {
    // Only create Stripe session if amount >= $0.50 (5000 cents)
    const amountInCents = Math.round(invoice.totalAmount * 100);
    const minStripeAmount = 5000; // $0.50 minimum

    if (
      amountInCents >= minStripeAmount &&
      process.env.STRIPE_SECRET_KEY &&
      process.env.FRONTEND_URL
    ) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: process.env.STRIPE_CURRENCY || "usd",
              product_data: {
                name: `Room Invoice ${invoice.month}/${invoice.year}`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: { invoiceId: String(invoice.id) },
        success_url: `${process.env.FRONTEND_URL}/success`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      });

      checkoutUrl = session.url;
    } else if (amountInCents < minStripeAmount) {
      console.warn(
        `Invoice ${invoice.id} amount too small for Stripe ($${(amountInCents / 100).toFixed(2)}); using QR/bank transfer only`,
      );
    }
  } catch (err) {
    console.error("Stripe error:", err.message);
  }

  // 📧 Gửi cho TẤT CẢ email
  for (const email of emails) {
    try {
      const paymentPageUrl = `${process.env.FRONTEND_URL}/payment/${invoice.id}`;

      await transporter.sendMail({
        from: `"Boarding House" <${process.env.MAIL_USER}>`,
        to: email,
        subject: `Invoice ${invoice.month}/${invoice.year} - Payment Required`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">📍 Invoice ${invoice.month}/${invoice.year}</h2>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px;">Room Fee:</td>
                  <td style="text-align: right; padding: 8px;"><strong>$${invoice.roomPrice.toFixed(2)}</strong></td>
                </tr>
                <tr style="background: #fff;">
                  <td style="padding: 8px;">Electric:</td>
                  <td style="text-align: right; padding: 8px;"><strong>$${invoice.electricCost.toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px;">Water:</td>
                  <td style="text-align: right; padding: 8px;"><strong>$${invoice.waterCost.toFixed(2)}</strong></td>
                </tr>
                <tr style="background: #fff;">
                  <td style="padding: 8px;">Service:</td>
                  <td style="text-align: right; padding: 8px;"><strong>$${invoice.serviceCost.toFixed(2)}</strong></td>
                </tr>
                <tr style="border-top: 2px solid #333; background: #e8f5e9;">
                  <td style="padding: 12px;"><strong>TOTAL:</strong></td>
                  <td style="text-align: right; padding: 12px;"><strong style="font-size: 18px; color: #d32f2f;">$${invoice.totalAmount.toFixed(2)}</strong></td>
                </tr>
              </table>
            </div>

            <h3 style="color: #333; margin-top: 30px;">💳 Payment Methods</h3>
            <p>Choose one of the following payment methods:</p>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 20px 0;">
              ${
                checkoutUrl
                  ? `<a href="${checkoutUrl}" style="display: block; padding: 15px; background: #1976d2; color: white; text-align: center; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      💳 Pay with Stripe
                    </a>`
                  : ""
              }
              
              <a href="${paymentPageUrl}?method=qr" style="display: block; padding: 15px; background: #f57c00; color: white; text-align: center; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📱 Scan QR
              </a>
              
              <a href="${paymentPageUrl}?method=cash" style="display: block; padding: 15px; background: #388e3c; color: white; text-align: center; text-decoration: none; border-radius: 6px; font-weight: bold;">
                💵 Pay Cash
              </a>
            </div>

            <div style="background: #fff3e0; padding: 15px; border-left: 4px solid #f57c00; margin-top: 20px; border-radius: 4px;">
              <strong>❓ Need Help?</strong><br/>
              If you have any questions about this invoice, please contact your boarding house owner.
            </div>
          </div>
        `,
      });
      console.log(`Invoice email sent to ${email}`);
    } catch (emailErr) {
      console.error(
        `Failed to send invoice email to ${email}:`,
        emailErr.message,
      );
    }
  }
};
