import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const run = async () => {
  const total = await prisma.subscription.count();

  const now = new Date();
  const year = now.getFullYear();
  const planPrices = {
    BASIC: 199_000,
    PREMIUM: 399_000,
    PROFESSIONAL: 699_000,
  };

  const data = [];
  const planKeys = Object.keys(planPrices);
  const baseSeed = total === 0;

  for (let month = 0; month < 12; month += 1) {
    const baseDay = 4 + (month % 5);

    if (baseSeed) {
      Object.entries(planPrices).forEach(([plan, amount], idx) => {
        const purchaseDate = new Date(year, month, baseDay + idx);
        const periodStart = new Date(year, month, baseDay + idx);
        const periodEnd = new Date(year, month + 1, baseDay + idx);

        data.push({
          plan,
          amount,
          currency: "VND",
          status: "ACTIVE",
          purchasedAt: purchaseDate,
          periodStart,
          periodEnd,
        });
      });
    }

    const extraCount = month % 4;
    for (let extra = 0; extra < extraCount; extra += 1) {
      const plan = planKeys[(month + extra) % planKeys.length];
      const amount = planPrices[plan];
      const purchaseDate = new Date(year, month, 18 + extra);
      const periodStart = new Date(year, month, 18 + extra);
      const periodEnd = new Date(year, month + 1, 18 + extra);

      data.push({
        plan,
        amount,
        currency: "VND",
        status: "ACTIVE",
        purchasedAt: purchaseDate,
        periodStart,
        periodEnd,
      });
    }
  }

  if (data.length > 0) {
    await prisma.subscription.createMany({ data });
    console.log("Inserted subscriptions:", data.length);
  } else {
    console.log("No new subscriptions inserted.");
  }

  await prisma.$disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
