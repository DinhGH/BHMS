import express from "express";
import { prisma } from "../lib/prisma.js";

const router = express.Router();

// Get all services for a boarding house
router.get("/house/:houseId", async (req, res) => {
  try {
    const { houseId } = req.params;

    const services = await prisma.service.findMany({
      where: {
        houseId: parseInt(houseId),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// Create a new service
router.post("/", async (req, res) => {
  try {
    const { houseId, name, description, price, priceType, unit } = req.body;

    if (!houseId || !name || price === undefined || !priceType) {
      return res
        .status(400)
        .json({
          error: "Missing required fields: houseId, name, price, priceType",
        });
    }

    const service = await prisma.service.create({
      data: {
        houseId: parseInt(houseId),
        name,
        description: description || null,
        price: parseFloat(price),
        priceType,
        unit: unit || null,
      },
    });

    res.status(201).json(service);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ error: "Failed to create service" });
  }
});

// Update a service
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, priceType, unit, isActive } = req.body;

    const service = await prisma.service.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(priceType && { priceType }),
        ...(unit !== undefined && { unit }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(service);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
});

// Delete a service
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.service.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: "Failed to delete service" });
  }
});

export default router;
