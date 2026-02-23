import multer from "multer";

const MAX_FILE_SIZE_MB = Number(process.env.MAX_UPLOAD_MB || 5);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file?.mimetype?.startsWith("image/")) {
    cb(new Error("Only image files are allowed"));
    return;
  }
  cb(null, true);
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter,
});
