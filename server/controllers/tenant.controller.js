import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getTenants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const where = search
      ? {
          fullName: {
            contains: search,
            mode: "insensitive",
          },
        }
      : undefined;

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        include: {
          Room: {
            include: {
              house: true,
            },
          },
          RentalContract: {
            where: { active: true },
            orderBy: { moveInDate: "desc" },
            take: 1,
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    const formatted = tenants.map(t => ({
      id: t.id,
      name: t.fullName,
      gender: t.gender,
      room: t.Room?.name || "—",
      house: t.Room?.house?.name || "—",
      moveInDate: t.RentalContract[0]?.moveInDate || null,
      imageUrl: t.imageUrl || null,
    }));

    res.json({
      data: formatted,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET TENANTS ERROR:", error);
    res.status(500).json({ error: error.message });
  }


};

export const getTenantById = async (req, res) => {
  const { id } = req.params;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: Number(id) },
      include: {
        Room: {
          include: {
            house: true,
          },
        },
        RentalContract: {
          where: { active: true },
          orderBy: { moveInDate: "desc" },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json({
      data: {
        id: tenant.id,
        full_name: tenant.fullName,
        gender: tenant.gender,
        room: tenant.Room?.name || "—",
        house: tenant.Room?.house?.name || "—",
        move_in_date: tenant.RentalContract[0]?.moveInDate || null,
        dob: tenant.dob || null,
        email: tenant.email || "",
        address: tenant.address || "",
        image_url: tenant.imageUrl || null,
      },
    });
  } catch (error) {
    console.error("GET TENANT BY ID ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
