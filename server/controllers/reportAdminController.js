import { prisma } from "../lib/prisma.js";

export const createReportAdmin = async (req, res) => {
  try {
    const { senderId, target, content, images } = req.body || {};

    const senderIdNum = Number(senderId);
    if (!senderIdNum) {
      return res.status(400).json({ message: "Invalid senderId" });
    }
    if (!target || typeof target !== "string") {
      return res.status(400).json({ message: "Target is required" });
    }
    if (!content || typeof content !== "string" || content.trim().length < 20) {
      return res
        .status(400)
        .json({ message: "Content must be at least 20 characters" });
    }

    if (images !== null && images !== undefined) {
      const isStringArray =
        Array.isArray(images) && images.every((item) => typeof item === "string");
      if (!isStringArray) {
        return res
          .status(400)
          .json({ message: "Images must be an array of base64 strings" });
      }
    }
    const ownerExists = await prisma.owner.findUnique({
      where: { id: senderIdNum },
      select: { id: true },
    });
    if (!ownerExists) {
      return res.status(404).json({ message: "Owner not found" });
    }

    const report = await prisma.reportAdmin.create({
      data: {
        senderId: senderIdNum,
        target: target.trim(),
        content: content.trim(),
        images: images ?? null,
      },
    });

    return res.status(201).json(report);
  } catch (error) {
    console.error("createReportAdmin error:", error);
    return res.status(500).json({ message: "Failed to create report" });
  }
};
