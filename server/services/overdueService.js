import { prisma } from "../lib/prisma.js";
import { sendOverdueEmail } from "../lib/mailer.js";

const OVERDUE_AFTER_DAYS = Number(process.env.OVERDUE_AFTER_DAYS || 7);
const OVERDUE_CHECK_HOUR = Number(process.env.OVERDUE_CHECK_HOUR || 6);
const OVERDUE_CHECK_MINUTE = Number(process.env.OVERDUE_CHECK_MINUTE || 0);
const RUN_OVERDUE_CHECK_ON_START =
  String(process.env.RUN_OVERDUE_CHECK_ON_START || "true").toLowerCase() !==
  "false";

const getNextRunTime = (hour, minute) => {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target;
};

/**
 * Converts PENDING invoices to OVERDUE if they're older than 7 days
 * Sends notification email to all tenants in the room
 */
export async function checkAndMarkOverdueInvoices() {
  try {
    console.log("🔄 Starting overdue invoice check...");

    // Calculate cutoff date based on each invoice createdAt
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - OVERDUE_AFTER_DAYS);

    // Find all PENDING invoices older than 7 days
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lte: cutoffDate,
        },
      },
      include: {
        Room: {
          select: {
            id: true,
            name: true,
            house: {
              select: {
                name: true,
              },
            },
          },
        },
        Tenant: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (overdueInvoices.length === 0) {
      console.log("✅ No overdue invoices found");
      return { processed: 0, sent: 0 };
    }

    console.log(`📧 Found ${overdueInvoices.length} overdue invoices`);

    let emailsSent = 0;
    const processedIds = [];

    for (const invoice of overdueInvoices) {
      try {
        // Update invoice status to OVERDUE
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "OVERDUE" },
        });

        processedIds.push(invoice.id);

        // Get all tenants in the room
        const roomTenants = await prisma.tenant.findMany({
          where: { roomId: invoice.roomId },
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        });

        console.log(
          `📍 Invoice ${invoice.id} (Room: ${invoice.Room.name}) → ${roomTenants.length} tenants`,
        );

        // Send overdue email to each tenant
        for (const tenant of roomTenants) {
          try {
            await sendOverdueEmail({
              to: tenant.email,
              tenantName: tenant.fullName,
              roomName: invoice.Room.name,
              houseName: invoice.Room.house?.name || "",
              month: invoice.month,
              year: invoice.year,
              totalAmount: invoice.totalAmount,
              invoiceId: invoice.id,
              daysOverdue: Math.floor(
                (new Date() - new Date(invoice.createdAt)) /
                  (1000 * 60 * 60 * 24),
              ),
            });

            emailsSent++;
            console.log(
              `✉️ Overdue email sent to ${tenant.fullName} (${tenant.email})`,
            );
          } catch (emailError) {
            console.error(
              `❌ Failed to send overdue email to ${tenant.email}`,
              {
                message: emailError?.message,
                invoiceId: invoice.id,
              },
            );
          }
        }
      } catch (error) {
        console.error(`❌ Failed to process invoice ${invoice.id}`, {
          message: error?.message,
        });
      }
    }

    const result = {
      processed: processedIds.length,
      sent: emailsSent,
      invoiceIds: processedIds,
    };

    console.log("✅ Overdue check completed:", result);
    return result;
  } catch (error) {
    console.error("❌ Overdue invoice check failed:", {
      message: error?.message,
      stack: error?.stack,
    });
    return { processed: 0, sent: 0, error: error?.message };
  }
}

/**
 * Schedule overdue check to run every day at 6 AM
 */
export function scheduleOverdueCheck() {
  if (RUN_OVERDUE_CHECK_ON_START) {
    checkAndMarkOverdueInvoices().catch((error) => {
      console.error(
        "❌ Initial overdue check failed:",
        error?.message || error,
      );
    });
  }

  const scheduleNextRun = () => {
    const nextRun = getNextRunTime(OVERDUE_CHECK_HOUR, OVERDUE_CHECK_MINUTE);
    const delayMs = nextRun.getTime() - Date.now();

    console.log(
      `⏰ Next overdue check scheduled at ${nextRun.toISOString()} (after ${Math.round(delayMs / 1000)}s)`,
    );

    setTimeout(async () => {
      await checkAndMarkOverdueInvoices();
      scheduleNextRun();
    }, delayMs);
  };

  scheduleNextRun();
}
