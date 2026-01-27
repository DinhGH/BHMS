import { prisma } from "../lib/prisma.js";
import { sendInvoiceStatusEmail } from "../lib/mailer.js";

const HOURS_3_DAYS = 72;

const buildRoomLabel = (invoice) => {
  const roomName = invoice.room?.name || "";
  const houseName = invoice.room?.house?.name || "";
  if (!roomName && !houseName) return "";
  return roomName
    ? `Phòng ${roomName}${houseName ? ` - ${houseName}` : ""}`
    : houseName;
};

const processOverdueInvoices = async () => {
  try {
    const overdueDate = new Date(Date.now() - HOURS_3_DAYS * 60 * 60 * 1000);
    const invoices = await prisma.invoice.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lte: overdueDate,
        },
      },
      select: {
        id: true,
        month: true,
        year: true,
        totalAmount: true,
        tenant: {
          select: {
            email: true,
            fullName: true,
          },
        },
        room: {
          select: {
            name: true,
            house: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    for (const invoice of invoices) {
      try {
        const updated = await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "OVERDUE" },
          select: {
            id: true,
            month: true,
            year: true,
            totalAmount: true,
            tenant: {
              select: {
                email: true,
                fullName: true,
              },
            },
            room: {
              select: {
                name: true,
                house: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

        await sendInvoiceStatusEmail({
          to: updated.tenant?.email,
          tenantName: updated.tenant?.fullName,
          roomLabel: buildRoomLabel(updated),
          month: updated.month,
          year: updated.year,
          status: "OVERDUE",
          totalAmount: updated.totalAmount,
        });
      } catch (error) {
        console.error("Failed to mark overdue invoice", error);
      }
    }
  } catch (error) {
    console.error("Failed to scan overdue invoices", error);
  }
};

export const startInvoiceOverdueJob = () => {
  processOverdueInvoices();
  setInterval(processOverdueInvoices, 60 * 60 * 1000);
};
