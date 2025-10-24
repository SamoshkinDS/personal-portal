import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { pool } from "../db/connect.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.resolve(__dirname, "../proto/stats.proto");

const XRAY_API_HOST = process.env.XRAY_API_HOST || "127.0.0.1";
const XRAY_API_PORT = Number(process.env.XRAY_API_PORT || 10085);
const XRAY_API_EMAIL_FIELD = process.env.XRAY_API_EMAIL_FIELD || "";
const XRAY_CONFIG_PATH = process.env.XRAY_CONFIG_PATH || "/usr/local/etc/xray/config.json";
const XRAY_INBOUND_TAG = process.env.XRAY_INBOUND_TAG || "vless-in";

const ONE_MB = 1024 * 1024;

let grpcClient = null;

function getStatsClient() {
  if (!grpcClient) {
    const definition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const pkg = grpc.loadPackageDefinition(definition);
    const StatsService = pkg?.xray?.app?.stats?.command?.StatsService;
    if (!StatsService) {
      throw new Error("Failed to load Xray StatsService definition");
    }
    grpcClient = new StatsService(
      `${XRAY_API_HOST}:${XRAY_API_PORT}`,
      grpc.credentials.createInsecure()
    );
  }
  return grpcClient;
}

function callGetStats(name) {
  return new Promise((resolve, reject) => {
    const client = getStatsClient();
    client.GetStats({ name, reset: false }, (err, response) => {
      if (err) {
        if (err.code === grpc.status.NOT_FOUND) {
          return resolve(0);
        }
        return reject(err);
      }
      const raw = response?.stat?.value ?? 0;
      const value = Number(raw);
      if (!Number.isFinite(value)) return resolve(0);
      return resolve(value);
    });
  });
}

export async function getXrayUserTraffic(emailParam) {
  const email = (emailParam || XRAY_API_EMAIL_FIELD || "").trim();
  if (!email) {
    throw new Error("Email is required for Xray stats lookup");
  }
  const baseName = `user>>>${email}>>>traffic>>>`;
  try {
    const [uplink, downlink] = await Promise.all([
      callGetStats(`${baseName}uplink`),
      callGetStats(`${baseName}downlink`),
    ]);
    return {
      email,
      uplink,
      downlink,
      total: uplink + downlink,
    };
  } catch (error) {
    console.error(`[xray] getXrayUserTraffic failed for ${email}`, error);
    if (error?.code === grpc.status.UNAVAILABLE) {
      const err = new Error("Xray API unreachable");
      err.status = 503;
      throw err;
    }
    throw error;
  }
}

export async function getXrayInboundTraffic(tagParam) {
  const tag = (tagParam || XRAY_INBOUND_TAG || "").trim();
  const baseName = `inbound>>>${tag}>>>traffic>>>`;
  try {
    const [uplink, downlink] = await Promise.all([
      callGetStats(`${baseName}uplink`),
      callGetStats(`${baseName}downlink`),
    ]);
    return {
      tag,
      uplink,
      downlink,
      total: uplink + downlink,
      label: `Inbound: ${tag}`,
    };
  } catch (error) {
    console.error(`[xray] getXrayInboundTraffic failed for tag ${tag}`, error);
    if (error?.code === grpc.status.UNAVAILABLE) {
      const err = new Error("Xray API unreachable");
      err.status = 503;
      throw err;
    }
    throw error;
  }
}

async function readConfigEmails(configPath = XRAY_CONFIG_PATH) {
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(raw);
    const emails = new Set();
    const inbounds = Array.isArray(config?.inbounds) ? config.inbounds : [];
    for (const inbound of inbounds) {
      const clients =
        inbound?.settings?.clients ||
        inbound?.settings?.defaultClients ||
        inbound?.settings?.vnext?.flatMap((item) => item?.users || []) ||
        [];
      if (Array.isArray(clients)) {
        for (const client of clients) {
          const email = (client?.email || client?.Email || "").trim();
          if (email) emails.add(email);
        }
      }
    }
    if (emails.size === 0 && XRAY_API_EMAIL_FIELD) {
      emails.add(XRAY_API_EMAIL_FIELD);
    }
    return Array.from(emails);
  } catch (error) {
    console.warn("[xray] Failed to read config.json, falling back to env email", error.message);
    if (XRAY_API_EMAIL_FIELD) {
      return [XRAY_API_EMAIL_FIELD];
    }
    return [];
  }
}

async function readKeyEmails() {
  const emails = new Set();
  try {
    const { rows } = await pool.query("SELECT name, comment FROM vless_keys");
    for (const row of rows) {
      const maybeName = String(row?.name || "").trim();
      const maybeComment = String(row?.comment || "").trim();
      if (maybeName) emails.add(maybeName);
      if (maybeComment && maybeComment.includes("@")) emails.add(maybeComment);
    }
  } catch (error) {
    console.warn("[xray] Failed to read vless_keys for emails", error.message);
  }
  return Array.from(emails);
}

export async function syncVlessStats({ emails, thresholdBytes = ONE_MB } = {}) {
  let targets = Array.isArray(emails) ? emails.slice() : null;
  if (!targets || targets.length === 0) {
    const [configEmails, keyEmails] = await Promise.all([readConfigEmails(), readKeyEmails()]);
    const merged = new Set();
    for (const value of [...configEmails, ...keyEmails]) {
      const candidate = String(value || "").trim();
      if (candidate) merged.add(candidate);
    }
    targets = Array.from(merged);
  }
  if (targets.length === 0) {
    return [];
  }
  const results = [];
  for (const email of targets) {
    try {
      const stats = await getXrayUserTraffic(email);
      const { rows } = await pool.query(
        "SELECT uplink, downlink FROM vless_stats WHERE email = $1 ORDER BY created_at DESC LIMIT 1",
        [email]
      );
      const last = rows[0];
      const changed =
        !last ||
        Math.abs(stats.uplink - Number(last.uplink || 0)) > thresholdBytes ||
        Math.abs(stats.downlink - Number(last.downlink || 0)) > thresholdBytes;
      if (changed) {
        await pool.query(
          "INSERT INTO vless_stats (email, uplink, downlink) VALUES ($1, $2, $3)",
          [email, stats.uplink, stats.downlink]
        );
      }
      await pool.query(
        `
          UPDATE vless_keys
          SET stats_json = jsonb_build_object(
            'bytes_up', $2,
            'bytes_down', $3,
            'total', $4,
            'synced_at', NOW()
          )
          WHERE TRIM(LOWER(name)) = TRIM(LOWER($1))
             OR TRIM(LOWER(comment)) = TRIM(LOWER($1))
             OR LOWER(comment) LIKE '%' || TRIM(LOWER($1)) || '%'
        `,
        [email, stats.uplink, stats.downlink, stats.total]
      );
      results.push({ ...stats, persisted: changed });
    } catch (error) {
      console.error(`[xray] Failed to sync stats for ${email}`, error);
      if (error?.status === 503) {
        throw error;
      }
    }
  }
  return results;
}

export async function getVlessHistory(emailParam, days) {
  const range = Number(days) === 30 ? 30 : 7;
  const raw = String(emailParam || "").trim();
  if (!raw || raw.toLowerCase() === "aggregate" || raw.toLowerCase() === "default") {
    const { rows } = await pool.query(
      `
        SELECT
          MIN(id) AS id,
          NULL::text AS email,
          SUM(uplink) AS uplink,
          SUM(downlink) AS downlink,
          SUM(total) AS total,
          created_at
        FROM vless_stats
        WHERE created_at >= NOW() - ($1 || ' days')::interval
        GROUP BY created_at
        ORDER BY created_at ASC
      `,
      [String(range)]
    );
    return {
      email: null,
      range,
      history: rows.map((row) => ({
        id: row.id,
        email: row.email,
        uplink: Number(row.uplink || 0),
        downlink: Number(row.downlink || 0),
        total: Number(row.total || 0),
        created_at: row.created_at,
      })),
    };
  }
  const email = raw;
  const { rows } = await pool.query(
    `
      SELECT id, email, uplink, downlink, total, created_at
      FROM vless_stats
      WHERE email = $1
        AND created_at >= NOW() - ($2 || ' days')::interval
      ORDER BY created_at ASC
    `,
    [email, String(range)]
  );
  return { email, range, history: rows.map((row) => ({
    id: row.id,
    email: row.email,
    uplink: Number(row.uplink || 0),
    downlink: Number(row.downlink || 0),
    total: Number(row.total || 0),
    created_at: row.created_at,
  })) };
}

export function getDefaultVlessEmail() {
  return XRAY_API_EMAIL_FIELD;
}

export async function listKnownVlessEmails() {
  return readConfigEmails();
}

// Keeping the original placeholder for compatibility with existing code paths.
export async function getStatsByUUID(uuid) {
  void uuid;
  return null;
}

export const MB_BYTES = ONE_MB;
