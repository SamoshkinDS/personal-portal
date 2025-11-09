import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION || "us-east-1";
const endpoint = process.env.S3_ENDPOINT || undefined;
const forcePathStyle = String(process.env.S3_FORCE_PATH_STYLE || "true").toLowerCase() !== "false";
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;
const publicBase = process.env.S3_PUBLIC_BASE_URL || "";

const hasCredentials = accessKeyId && secretAccessKey;
const s3 = bucket
  ? new S3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: hasCredentials
        ? {
            accessKeyId,
            secretAccessKey,
          }
        : undefined,
    })
  : null;

function assertS3Configured() {
  if (!bucket || !s3) {
    throw new Error("S3 is not configured. Please set S3_BUCKET and credentials.");
  }
}

function trimSlash(value = "") {
  return value.replace(/\/+$/, "");
}

export function buildPublicUrl(key) {
  if (!key) return "";
  if (publicBase) {
    return `${trimSlash(publicBase)}/${key}`;
  }
  if (endpoint && forcePathStyle) {
    return `${trimSlash(endpoint)}/${bucket}/${key}`;
  }
  if (endpoint && !forcePathStyle) {
    return `${trimSlash(endpoint)}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function uploadBuffer({ key, body, contentType, cacheControl = "public, max-age=31536000", acl = "public-read" }) {
  assertS3Configured();
  if (!key) throw new Error("S3 key is required");
  if (!body) throw new Error("S3 body is required");
  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ACL: acl,
      CacheControl: cacheControl,
      ContentType: contentType,
    },
  });
  await uploader.done();
  return buildPublicUrl(key);
}

export async function deleteByKey(key) {
  assertS3Configured();
  if (!key) return;
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch (error) {
    // swallow to avoid failing flows when file was already removed
    console.warn("[s3] delete failed", key, error?.message || error);
  }
}

export function isS3Ready() {
  try {
    assertS3Configured();
    return true;
  } catch {
    return false;
  }
}
