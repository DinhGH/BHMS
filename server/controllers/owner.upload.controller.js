import { uploadImageToCloudinary } from "../lib/cloudinary.js";

const TARGET_FOLDER_MAP = {
  "owner-avatar": "bhms/owners/avatars",
  "owner-qr": "bhms/owners/qrs",
  "boarding-house": "bhms/boarding-houses",
  room: "bhms/rooms",
};

export async function uploadOwnerImage(req, res) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const target = String(req.query.target || "").trim();
    const folder = TARGET_FOLDER_MAP[target];

    if (!folder) {
      return res.status(400).json({
        message:
          "Invalid upload target. Use one of: owner-avatar, owner-qr, boarding-house, room",
      });
    }

    const uploadResult = await uploadImageToCloudinary(req.file.buffer, {
      folder,
    });

    return res.status(201).json({
      url: uploadResult?.secure_url,
      publicId: uploadResult?.public_id,
      target,
    });
  } catch (error) {
    console.error("uploadOwnerImage:", {
      message: error?.message,
      stack: error?.stack,
    });
    return res.status(500).json({ message: "Image upload failed" });
  }
}
