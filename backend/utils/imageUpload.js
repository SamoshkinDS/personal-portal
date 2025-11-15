import sharp from "sharp";

function createValidationError(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

export async function normalizeUploadFile(file) {
  if (!file) throw createValidationError("file is required");
  const ext = getExtension(file);
  if (ext) {
    return { buffer: file.buffer, mimetype: file.mimetype, extension: ext };
  }
  if (isHeicFile(file)) {
    const converted = await sharp(file.buffer).rotate().jpeg({ quality: 92 });
    return { buffer: converted, mimetype: "image/jpeg", extension: "jpg" };
  }
  throw createValidationError("Unsupported file type");
}

export function getExtension(file) {
  if (!file?.mimetype) return null;
  if (file.mimetype === "image/jpeg") return "jpg";
  if (file.mimetype === "image/png") return "png";
  if (file.mimetype === "image/webp") return "webp";
  const match = file.originalname?.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : null;
}

function isHeicFile(file) {
  const mimetype = String(file?.mimetype || "").toLowerCase();
  const original = String(file?.originalname || "").toLowerCase();
  return mimetype.includes("image/heic") || mimetype.includes("image/heif") || original.endsWith(".heic") || original.endsWith(".heif");
}
