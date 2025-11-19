import path from "path";
import { uploadBuffer, deleteByKey, buildPublicUrl } from "./s3Client.js";

export async function uploadFile(buffer, key, contentType) {
  await uploadBuffer(buffer, key, { contentType });
  return buildPublicUrl(key);
}

export async function deleteFile(key) {
  await deleteByKey(key);
}

export function buildUrl(key) {
  return buildPublicUrl(key);
}
