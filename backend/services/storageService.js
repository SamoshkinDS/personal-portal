import path from "path";
import { uploadBuffer, deleteByKey, buildPublicUrl } from "./s3Client.js";

export async function uploadFile(bufferOrOptions, key, contentType) {
  // Support both legacy positional arguments and object-based calls
  const payload =
    bufferOrOptions && typeof bufferOrOptions === "object" && bufferOrOptions.body
      ? bufferOrOptions
      : { body: bufferOrOptions, key, contentType };
  await uploadBuffer({
    key: payload.key,
    body: payload.body,
    contentType: payload.contentType,
  });
  return buildPublicUrl(payload.key);
}

export async function deleteFile(key) {
  await deleteByKey(key);
}

export function buildUrl(key) {
  return buildPublicUrl(key);
}
