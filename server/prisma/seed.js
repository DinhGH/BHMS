import { prisma } from "../lib/prisma.js";
import { faker } from "@faker-js/faker";

const OWNER_USER_ID = 5;
const ADMIN_USER_ID = 2;
const BOARDING_HOUSE_COUNT = 7;
const REPORT_CONTENT_MAX_LENGTH = 180;

const randomInt = (min, max) => faker.number.int({ min, max });
const fitVarchar191 = (value) =>
  String(value).slice(0, REPORT_CONTENT_MAX_LENGTH);

function getBaseRoomPriceByOccupancy(occupancy) {
  const table = {
    0: 280,
    1: 360,
    2: 470,
    3: 590,
    4: 720,
    5: 860,
  };

  return table[Math.max(0, Math.min(5, occupancy))] ?? 360;
}

async function main() {
  faker.seed(20260221);
  console.log(
    "🌱 Seeding database with schema-consistent sample data (English + USD)...",
  );

  const requiredUsers = await prisma.user.findMany({
    where: { id: { in: [OWNER_USER_ID, ADMIN_USER_ID] } },
    select: { id: true, role: true },
  });

  if (requiredUsers.length !== 2) {
    throw new Error(
      `❌ Missing required users. Need user id ${OWNER_USER_ID} (OWNER) and ${ADMIN_USER_ID} (ADMIN).`,
    );
  }

  const ownerUser = requiredUsers.find((u) => u.id === OWNER_USER_ID);
  const adminUser = requiredUsers.find((u) => u.id === ADMIN_USER_ID);
  if (!ownerUser || !adminUser) {
    throw new Error("❌ Required owner/admin users not found.");
  }

  console.log(
    `✅ Found users: owner id=${ownerUser.id} (${ownerUser.role}), admin id=${adminUser.id} (${adminUser.role})`,
  );

  // ===== CLEAR EXISTING DATA (ALL TABLES EXCEPT USER) =====
  console.log("🧹 Clearing existing non-user data...");
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.rentalContract.deleteMany({});
  await prisma.tenant.deleteMany({});
  await prisma.roomService.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.boardingHouse.deleteMany({});
  await prisma.reportAdmin.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.owner.deleteMany({});
  await prisma.licenseKey.deleteMany({});
  await prisma.subscription.deleteMany({});
  console.log("✅ Cleared all non-user tables (User table preserved)");

  // ===== BASE RECORDS =====
  const owner = await prisma.owner.create({
    data: { userId: OWNER_USER_ID },
  });
  console.log(`✅ Owner record created for userId ${OWNER_USER_ID}`);

  await prisma.licenseKey.createMany({
    data: [{ userId: OWNER_USER_ID }, { userId: ADMIN_USER_ID }],
  });

  const now = new Date();
  const subscriptionPlans = ["BASIC", "PREMIUM", "PROFESSIONAL"];
  for (let i = 0; i < 6; i++) {
    const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    await prisma.subscription.create({
      data: {
        plan: faker.helpers.arrayElement(subscriptionPlans),
        amount: faker.helpers.arrayElement([19, 39, 79]),
        currency: "USD",
        status:
          i === 0
            ? "ACTIVE"
            : faker.helpers.arrayElement(["ACTIVE", "EXPIRED"]),
        purchasedAt: periodStart,
        periodStart,
        periodEnd,
        updatedAt: periodEnd,
      },
    });
  }
  console.log("✅ Created license keys and subscriptions");

  // ===== SERVICES =====
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: "Internet WiFi",
        description: "High-speed internet access",
        price: 45,
        priceType: "FIXED",
      },
    }),
    prisma.service.create({
      data: {
        name: "Parking Slot",
        description: "Secure parking space",
        price: 30,
        priceType: "FIXED",
      },
    }),
    prisma.service.create({
      data: {
        name: "Cleaning Service",
        description: "Room cleaning service",
        price: 12,
        priceType: "UNIT_BASED",
        unit: "sessions",
      },
    }),
    prisma.service.create({
      data: {
        name: "Laundry",
        description: "Laundry service",
        price: 4,
        priceType: "UNIT_BASED",
        unit: "kg",
      },
    }),
    prisma.service.create({
      data: {
        name: "Security",
        description: "Night security",
        price: 20,
        priceType: "FIXED",
      },
    }),
  ]);
  console.log(`✅ Created ${services.length} services`);

  // ===== BOARDING HOUSES =====
  const houseNames = [
    "Sunrise Haven",
    "Maple Court Residence",
    "Bluebird Villa",
    "Oakview Inn",
    "Riverside Hostel",
    "Garden Lane Stay",
    "Morninglight Rooms",
  ];

  const houses = [];
  for (let i = 0; i < BOARDING_HOUSE_COUNT; i++) {
    const house = await prisma.boardingHouse.create({
      data: {
        ownerId: owner.id,
        name: houseNames[i],
        address: `${faker.location.streetAddress()}, ${faker.location.city()}, USA`,
        electricFee: faker.number.float({
          min: 0.18,
          max: 0.35,
          fractionDigits: 2,
        }),
        waterFee: faker.number.float({ min: 1.5, max: 4.5, fractionDigits: 2 }),
        imageUrl: faker.image.urlPicsumPhotos({ width: 1200, height: 800 }),
      },
    });
    houses.push(house);
  }
  console.log(
    `✅ Created ${houses.length} boarding houses for owner userId=${OWNER_USER_ID}`,
  );

  // ===== ROOMS + TENANTS + CONTRACTS + INVOICES + PAYMENTS =====
  let roomCount = 0;
  let tenantCount = 0;
  let contractCount = 0;
  let invoiceCount = 0;
  let paymentCount = 0;

  for (const house of houses) {
    const roomsInHouse = randomInt(5, 10);

    for (let i = 1; i <= roomsInHouse; i++) {
      const occupancy = randomInt(0, 5); // 0-5 tenants/room
      const basePrice = getBaseRoomPriceByOccupancy(occupancy);
      const adjustedPrice = basePrice + randomInt(-25, 40);

      const meterAfterElectric = randomInt(300, 1500);
      const meterNowElectric = meterAfterElectric + randomInt(10, 80);
      const meterAfterWater = randomInt(100, 600);
      const meterNowWater = meterAfterWater + randomInt(3, 30);

      const room = await prisma.room.create({
        data: {
          houseId: house.id,
          name: `Room ${i.toString().padStart(2, "0")}`,
          price: Math.max(220, adjustedPrice),
          isLocked: occupancy === 0 ? faker.datatype.boolean(0.2) : false,
          imageUrl: faker.image.urlPicsumPhotos({ width: 900, height: 700 }),
          electricMeterAfter: meterAfterElectric,
          electricMeterNow: meterNowElectric,
          waterMeterAfter: meterAfterWater,
          waterMeterNow: meterNowWater,
          contractStart: faker.date.past({ years: 3 }),
          contractEnd: faker.date.future({ years: 1 }),
        },
      });
      roomCount++;

      const selectedServices = faker.helpers.arrayElements(
        services,
        randomInt(2, 4),
      );
      let monthlyServiceCost = 0;
      for (const service of selectedServices) {
        const quantity =
          service.priceType === "UNIT_BASED" ? randomInt(1, 6) : 1;
        const totalPrice = service.price * quantity;
        monthlyServiceCost += totalPrice;

        await prisma.roomService.create({
          data: {
            roomId: room.id,
            serviceId: service.id,
            price: service.price,
            quantity,
            totalPrice,
          },
        });
      }

      const tenantsInRoom = [];
      for (let t = 0; t < occupancy; t++) {
        const startDate = faker.date.past({ years: 2 });
        const tenant = await prisma.tenant.create({
          data: {
            fullName: faker.person.fullName(),
            age: randomInt(18, 45),
            gender: faker.helpers.arrayElement(["MALE", "FEMALE", "OTHER"]),
            email: faker.internet.email().toLowerCase(),
            phone: faker.phone.number("+1-###-###-####"),
            roomId: room.id,
            startDate,
            endDate: null,
            imageUrl: faker.image.avatar(),
          },
        });
        tenantCount++;
        tenantsInRoom.push(tenant);

        await prisma.rentalContract.create({
          data: {
            tenantId: tenant.id,
            roomId: room.id,
            startDate,
            endDate: null,
            terms: `Rental agreement for ${room.name} at ${house.name}. Rent is due by the 5th of each month.`,
          },
        });
        contractCount++;
      }

      // Invoice table unique(roomId, month, year) -> one invoice per room per month
      if (tenantsInRoom.length > 0) {
        const billedTenant = tenantsInRoom[0];
        const billedMonths = randomInt(8, 18); // long-stay history: latest 8-18 months

        for (let m = billedMonths; m >= 0; m--) {
          const billDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
          const month = billDate.getMonth() + 1;
          const year = billDate.getFullYear();

          const electricUsage = randomInt(
            40 + tenantsInRoom.length * 15,
            90 + tenantsInRoom.length * 45,
          );
          const waterUsage = randomInt(
            6 + tenantsInRoom.length * 2,
            14 + tenantsInRoom.length * 5,
          );
          const electricCost = electricUsage * house.electricFee;
          const waterCost = waterUsage * house.waterFee;
          const serviceCost = monthlyServiceCost;
          const totalAmount =
            room.price + electricCost + waterCost + serviceCost;

          const status =
            m >= 2
              ? "PAID"
              : faker.helpers.arrayElement(["PAID", "PENDING", "OVERDUE"]);

          const invoice = await prisma.invoice.create({
            data: {
              roomId: room.id,
              tenantId: billedTenant.id,
              roomPrice: room.price,
              electricCost,
              waterCost,
              serviceCost,
              totalAmount,
              status,
              month,
              year,
              createdAt: new Date(year, month - 1, randomInt(1, 27)),
            },
          });
          invoiceCount++;

          if (status === "PAID") {
            await prisma.payment.create({
              data: {
                invoiceId: invoice.id,
                method: faker.helpers.arrayElement(["QR_TRANSFER", "GATEWAY"]),
                amount: totalAmount,
                confirmed: true,
                createdAt: new Date(year, month - 1, randomInt(1, 28)),
              },
            });
            paymentCount++;
          }
        }
      }
    }
  }

  // ===== ADMIN / OWNER SOCIAL DATA =====
  await prisma.notification.createMany({
    data: [
      {
        userId: OWNER_USER_ID,
        title: "Rent Collection Reminder",
        content:
          "Some invoices this month are currently in PENDING or OVERDUE status.",
      },
      {
        userId: ADMIN_USER_ID,
        title: "System Report",
        content:
          "Boarding house and invoice data have been updated successfully.",
      },
      {
        userId: OWNER_USER_ID,
        title: "New Rental Contracts",
        content: "New tenants have moved into several rooms this month.",
      },
    ],
  });

  const reportTargets = [
    "PAYMENT",
    "SYSTEM",
    "ELECTRIC",
    "WATER",
    "INTERNET",
    "SECURITY",
    "FACILITY",
    "ROOM_SERVICE",
  ];
  const reportStatuses = [
    "PENDING",
    "PROCESSING",
    "REVIEWING",
    "FIXING",
    "RESOLVED",
  ];

  const reportSeedData = Array.from({ length: 22 }).map((_, idx) => {
    const senderId = idx % 3 === 0 ? ADMIN_USER_ID : OWNER_USER_ID;
    const target = reportTargets[idx % reportTargets.length];
    const status = reportStatuses[idx % reportStatuses.length];

    const reportDate = new Date(
      now.getFullYear(),
      now.getMonth() - randomInt(0, 5),
      randomInt(1, 28),
      randomInt(7, 21),
      randomInt(0, 59),
    );

    return {
      senderId,
      target,
      content: fitVarchar191(
        `${target} report #${idx + 1}: ${faker.lorem.sentences(2)} Please verify and update status in dashboard.`,
      ),
      images:
        idx % 4 === 0
          ? [faker.image.urlPicsumPhotos({ width: 640, height: 480 })]
          : idx % 7 === 0
            ? [
                faker.image.urlPicsumPhotos({ width: 640, height: 480 }),
                faker.image.urlPicsumPhotos({ width: 640, height: 480 }),
              ]
            : null,
      status,
      createdAt: reportDate,
    };
  });

  await prisma.report.createMany({
    data: reportSeedData,
  });

  const adminReportTargets = [
    "ELECTRIC_METER",
    "WATER_METER",
    "TENANT_BEHAVIOR",
    "MAINTENANCE",
    "SECURITY_CHECK",
    "REVENUE_REVIEW",
    "CONTRACT_COMPLIANCE",
  ];
  const adminReportStatuses = [
    "PENDING",
    "PROCESSING",
    "REVIEWING",
    "FIXING",
    "RESOLVED",
  ];

  const reportAdminSeedData = Array.from({ length: 18 }).map((_, idx) => {
    const target = adminReportTargets[idx % adminReportTargets.length];
    const status = adminReportStatuses[idx % adminReportStatuses.length];
    const createdAt = new Date(
      now.getFullYear(),
      now.getMonth() - randomInt(0, 4),
      randomInt(1, 28),
      randomInt(8, 20),
      randomInt(0, 59),
    );

    return {
      senderId: owner.id,
      target,
      content: fitVarchar191(
        `Owner admin report #${idx + 1} for ${target}: ${faker.lorem.sentences(2)} Follow-up action is required this week.`,
      ),
      images:
        idx % 3 === 0
          ? [faker.image.urlPicsumPhotos({ width: 720, height: 480 })]
          : null,
      status,
      createdAt,
    };
  });

  await prisma.reportAdmin.createMany({
    data: reportAdminSeedData,
  });

  console.log("\n🎉 Seeding completed successfully!");
  console.log("========================================");
  console.log("📊 Summary:");
  console.log(`   - Owner User ID: ${OWNER_USER_ID}`);
  console.log(`   - Admin User ID: ${ADMIN_USER_ID}`);
  console.log(`   - Boarding Houses: ${houses.length}`);
  console.log(`   - Rooms: ${roomCount}`);
  console.log(`   - Tenants: ${tenantCount}`);
  console.log(`   - Rental Contracts: ${contractCount}`);
  console.log(`   - Services: ${services.length}`);
  console.log(`   - Invoices: ${invoiceCount}`);
  console.log(`   - Payments: ${paymentCount}`);
  console.log(`   - Reports: ${reportSeedData.length}`);
  console.log(`   - ReportAdmin: ${reportAdminSeedData.length}`);
  console.log("   - Notifications / Subscriptions: seeded");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
