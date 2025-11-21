import express from "express";
import multer from "multer";
import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutBucketPolicyCommand,
  DeleteBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import { authRequired, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const MAX_UPLOAD_MB = Number(process.env.S3_MAX_UPLOAD_MB || 100);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
});

const endpoint = process.env.S3_ENDPOINT || "";
const region = process.env.S3_REGION || "us-east-1";
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;
const forcePathStyle =
  String(process.env.S3_FORCE_PATH_STYLE || "true").toLowerCase() !== "false";
const publicBase = process.env.S3_PUBLIC_BASE_URL || "";

function getS3() {
  if (!accessKeyId || !secretAccessKey || !endpoint) {
    const err = new Error("S3 not configured");
    err.status = 503;
    throw err;
  }
  return new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });
}

router.use(authRequired, requirePermission("admin_access"));

router.get("/buckets", async (_req, res) => {
  try {
    const client = getS3();
    const data = await client.send(new ListBucketsCommand({}));
    const items =
      data.Buckets?.map((b) => ({
        name: b.Name,
        created: b.CreationDate ? new Date(b.CreationDate).toISOString() : null,
      })) || [];
    res.json(items);
  } catch (error) {
    console.error("GET /api/s3/buckets", error);
    respondError(res, error, "Не удалось получить список бакетов");
  }
});

router.post("/buckets", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ message: "name is required" });
    const client = getS3();
    await client.send(
      new CreateBucketCommand({
        Bucket: name,
        CreateBucketConfiguration: { LocationConstraint: region },
      })
    );
    res.status(201).json({ name });
  } catch (error) {
    console.error("POST /api/s3/buckets", error);
    respondError(res, error, "Не удалось создать бакет");
  }
});

router.delete("/buckets/:bucket", async (req, res) => {
  try {
    const bucket = req.params.bucket;
    if (!bucket) return res.status(400).json({ message: "bucket is required" });
    const client = getS3();
    await client.send(new DeleteBucketCommand({ Bucket: bucket }));
    res.json({ message: "Bucket deleted" });
  } catch (error) {
    console.error("DELETE /api/s3/buckets/:bucket", error);
    respondError(res, error, "Не удалось удалить бакет");
  }
});

router.get("/buckets/:bucket", async (req, res) => {
  try {
    const bucket = req.params.bucket;
    if (!bucket) return res.status(400).json({ message: "bucket is required" });
    const prefix = normalizePrefix(req.query.prefix || "");
    const client = getS3();
    const list = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        Delimiter: "/",
      })
    );
    const folders = (list.CommonPrefixes || []).map((p) => p.Prefix || "").filter(Boolean);
    const files =
      (list.Contents || [])
        .filter((obj) => obj.Key !== prefix) // Key equal to prefix represents the "folder" itself
        .map((obj) => ({
          name: obj.Key || "",
          size: obj.Size || 0,
          modified: obj.LastModified ? new Date(obj.LastModified).toISOString() : null,
        })) || [];
    res.json({
      folders,
      files,
      prefix,
      publicBase: buildPublicBase(bucket),
    });
  } catch (error) {
    console.error("GET /api/s3/buckets/:bucket", error);
    respondError(res, error, "Не удалось получить содержимое бакета");
  }
});

router.put("/buckets/:bucket/folders", async (req, res) => {
  try {
    const bucket = req.params.bucket;
    const path = normalizePrefix(req.body?.path || "");
    if (!bucket || !path) return res.status(400).json({ message: "bucket and path required" });
    const client = getS3();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: path.endsWith("/") ? path : `${path}/`,
        Body: "",
      })
    );
    res.json({ message: "Folder created" });
  } catch (error) {
    console.error("PUT /api/s3/buckets/:bucket/folders", error);
    respondError(res, error, "Не удалось создать папку");
  }
});

router.post(
  "/buckets/:bucket/upload",
  upload.single("file"),
  async (req, res, next) => {
    if (!req.file) return res.status(400).json({ message: "file is required" });
    next();
  },
  async (req, res) => {
    try {
      const bucket = req.params.bucket;
      if (!bucket) return res.status(400).json({ message: "bucket is required" });
      const prefixRaw = String(req.body?.path || "").trim();
      const prefix = normalizePrefix(prefixRaw);
      const key = `${prefix}${req.file.originalname}`;
      const client = getS3();
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );
      res.status(201).json({ key, url: `${buildPublicBase(bucket)}/${key}` });
    } catch (error) {
      console.error("POST /api/s3/buckets/:bucket/upload", error);
      respondError(res, error, "Не удалось загрузить файл");
    }
  }
);

router.delete("/buckets/:bucket/file", async (req, res) => {
  try {
    const bucket = req.params.bucket;
    const key = String(req.body?.key || "").trim();
    if (!bucket || !key) return res.status(400).json({ message: "bucket and key required" });
    const client = getS3();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    res.json({ message: "File deleted" });
  } catch (error) {
    console.error("DELETE /api/s3/buckets/:bucket/file", error);
    respondError(res, error, "Не удалось удалить файл");
  }
});

router.delete("/buckets/:bucket/folder", async (req, res) => {
  try {
    const bucket = req.params.bucket;
    const prefix = normalizePrefix(req.body?.prefix || "");
    if (!bucket || !prefix) return res.status(400).json({ message: "bucket and prefix required" });
    const client = getS3();
    let continuationToken = undefined;
    let deletedCount = 0;
    do {
      const { Contents = [], IsTruncated, NextContinuationToken } = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );
      const keys = Contents.map((c) => c.Key).filter(Boolean);
      if (keys.length) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: keys.map((Key) => ({ Key })),
            },
          })
        );
        deletedCount += keys.length;
      }
      continuationToken = IsTruncated ? NextContinuationToken : undefined;
    } while (continuationToken);
    res.json({ message: "Folder deleted", deleted: deletedCount });
  } catch (error) {
    console.error("DELETE /api/s3/buckets/:bucket/folder", error);
    respondError(res, error, "Не удалось удалить папку");
  }
});

router.post("/buckets/:bucket/public", async (req, res) => {
  try {
    const bucket = req.params.bucket;
    if (!bucket) return res.status(400).json({ message: "bucket is required" });
    const client = getS3();
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: `arn:aws:s3:::${bucket}/*`,
        },
      ],
    };
    await client.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify(policy),
      })
    );
    res.json({ message: "Bucket is public" });
  } catch (error) {
    console.error("POST /api/s3/buckets/:bucket/public", error);
    respondError(res, error, "Не удалось сделать бакет публичным");
  }
});

router.delete("/buckets/:bucket/public", async (req, res) => {
  try {
    const bucket = req.params.bucket;
    if (!bucket) return res.status(400).json({ message: "bucket is required" });
    const client = getS3();
    await client.send(new DeleteBucketPolicyCommand({ Bucket: bucket }));
    res.json({ message: "Bucket is private" });
  } catch (error) {
    console.error("DELETE /api/s3/buckets/:bucket/public", error);
    respondError(res, error, "Не удалось сделать бакет приватным");
  }
});

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(413)
        .json({ message: `Размер файла превышает лимит ${MAX_UPLOAD_MB} МБ` });
    }
    return res.status(400).json({ message: error.message });
  }
  return next(error);
});

export default router;

function normalizePrefix(value) {
  const trimmed = String(value || "").replace(/^\/+/, "");
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function buildPublicBase(bucket) {
  if (publicBase) return `${publicBase.replace(/\/$/, "")}/${bucket}`;
  if (endpoint && forcePathStyle) return `${endpoint.replace(/\/$/, "")}/${bucket}`;
  if (endpoint && !forcePathStyle) return `${endpoint.replace(/\/$/, "")}`;
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

function respondError(res, error, fallback) {
  if (error?.status && Number.isInteger(error.status)) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error?.name === "NoSuchBucket") {
    return res.status(404).json({ message: "Бакет не найден" });
  }
  return res.status(500).json({ message: fallback });
}
