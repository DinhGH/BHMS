import cloudinary from "../config/cloudinary.js";

export const uploadSingle = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      reject(new Error("File buffer is required"));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (err, result) => {
        if (result) {
          resolve(result.secure_url);
        } else {
          reject(err || new Error("Upload failed"));
        }
      },
    );

    stream.on("error", (error) => {
      reject(error);
    });

    stream.end(fileBuffer);
  });
};

export const uploadMultiple = async (files, folder) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("Files array is required");
  }

  const uploads = files.map((file) => {
    if (!file || !file.buffer) {
      throw new Error("Each file must have a buffer");
    }
    return uploadSingle(file.buffer, folder);
  });

  return Promise.all(uploads);
};

export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return null;

    const urlParts = imageUrl.split("/");
    const uploadIndex = urlParts.indexOf("upload");

    if (uploadIndex === -1) {
      console.warn("Invalid Cloudinary URL:", imageUrl);
      return null;
    }
    const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join("/");

    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");

    console.log("Deleting image with public_id:", publicId);

    const result = await cloudinary.uploader.destroy(publicId);

    console.log("Delete result:", result);

    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return null;
  }
};
export const deleteMultipleImages = async (imageUrls) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return [];
  }

  const deletions = imageUrls
    .filter((url) => url)
    .map((url) => deleteImage(url));

  return Promise.all(deletions);
};
