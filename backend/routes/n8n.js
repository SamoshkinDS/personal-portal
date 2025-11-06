import express from "express";
import { authRequired, requirePermission } from "../middleware/auth.js";

const router = express.Router();

function cleanEnvValue(value) {
  return (value || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "");
}

const RAW_BASE = cleanEnvValue(process.env.N8N_API_BASE_URL || process.env.N8N_BASE_URL);
const N8N_API_BASE_URL = RAW_BASE.replace(/\/$/, "");
const RAW_APP_BASE = cleanEnvValue(process.env.N8N_APP_BASE_URL);
const N8N_APP_BASE_URL = RAW_APP_BASE
  ? RAW_APP_BASE.replace(/\/$/, "")
  : N8N_API_BASE_URL.replace(/\/api\/v1$/i, "");
const N8N_API_KEY = cleanEnvValue(process.env.N8N_API_KEY);
const RAW_WORKFLOWS_PATH = cleanEnvValue(process.env.N8N_WORKFLOWS_PATH);
const RAW_EXECUTIONS_PATH = cleanEnvValue(process.env.N8N_EXECUTIONS_PATH);

if (!N8N_API_BASE_URL || !N8N_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[n8n] N8N_API_BASE_URL or N8N_API_KEY is not configured. /api/n8n endpoints will be disabled.");
}

function notConfigured() {
  return !N8N_API_BASE_URL || !N8N_API_KEY;
}

async function n8nFetch(path, options = {}) {
  if (notConfigured()) {
    throw Object.assign(new Error("n8n integration is not configured"), { code: "N8N_CONFIG_MISSING" });
  }
  const url = path.startsWith("http") ? path : `${N8N_API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("X-N8N-API-KEY")) {
    headers.set("X-N8N-API-KEY", N8N_API_KEY);
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  return fetch(url, { ...options, headers });
}

function ensureLeadingPath(path, { keepTrailing = false } = {}) {
  if (!path) return "";
  let normalized = path.trim();
  const queryIndex = normalized.indexOf("?");
  const hashIndex = normalized.indexOf("#");
  let query = "";
  let hash = "";
  if (queryIndex !== -1) {
    query = normalized.slice(queryIndex);
    normalized = normalized.slice(0, queryIndex);
  }
  if (hashIndex !== -1) {
    hash = normalized.slice(hashIndex);
    normalized = normalized.slice(0, hashIndex);
  }
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  if (!keepTrailing) {
    normalized = normalized.replace(/\/+$/, "");
  }
  return `${normalized}${query}${hash}`;
}

function stripQueryAndHash(path) {
  if (!path) return "";
  const idx = path.indexOf("?");
  const hashIdx = path.indexOf("#");
  const end = idx === -1 ? (hashIdx === -1 ? path.length : hashIdx) : Math.min(idx, hashIdx === -1 ? idx : hashIdx);
  return path.slice(0, end);
}

function appendQuery(path, queryString) {
  if (!path) return queryString ? `?${queryString}` : "";
  if (!queryString) return path;
  const hasQuery = path.includes("?");
  const separator = hasQuery ? (path.endsWith("?") || path.endsWith("&") ? "" : "&") : "?";
  return `${path}${separator}${queryString}`;
}

async function fetchWithFallback(pathCandidates, options = {}) {
  const candidates = Array.from(
    new Set(
      pathCandidates
        .map((p) => ensureLeadingPath(p, { keepTrailing: false }))
        .filter(Boolean)
    )
  );
  const attempts = [];
  for (const candidate of candidates) {
    try {
      const res = await n8nFetch(candidate, options);
      if (res.ok) {
        let data = null;
        try {
          data = await res.json();
        } catch {
          const text = await res.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        }
        return { ok: true, data, path: candidate };
      }
      const text = await res.text().catch(() => null);
      attempts.push({ status: res.status, text, path: candidate });
      if (res.status !== 404) {
        break;
      }
    } catch (error) {
      attempts.push({ status: 0, text: error.message, path: candidate });
      break;
    }
  }
  return { ok: false, attempts };
}

function serializeNodes(nodes = []) {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
    parameters: node.parameters || {},
  }));
}

function serializeWorkflow(base, detail) {
  const source = detail || base || {};
  const nodes = Array.isArray(detail?.nodes) ? detail.nodes : Array.isArray(base?.nodes) ? base.nodes : [];
  return {
    id: source.id ?? base?.id,
    name: source.name ?? base?.name ?? "Untitled workflow",
    active: source.active ?? base?.active ?? false,
    createdAt: source.createdAt ?? base?.createdAt ?? null,
    updatedAt: source.updatedAt ?? base?.updatedAt ?? null,
    tags: source.tags ?? base?.tags ?? [],
    nodeCount: Array.isArray(nodes) ? nodes.length : 0,
    nodes: serializeNodes(nodes),
    versionId: source.versionId ?? base?.versionId ?? null,
    appUrl: source.id ? `${N8N_APP_BASE_URL}/workflow/${source.id}` : null,
  };
}

function serializeExecution(exec) {
  if (!exec || typeof exec !== "object") return null;
  const workflowName = exec.workflowName || exec.workflowData?.name || null;
  return {
    id: exec.id,
    status: exec.status,
    mode: exec.mode,
    workflowId: exec.workflowId ?? exec.workflowData?.id ?? null,
    workflowName,
    startedAt: exec.startedAt || null,
    finishedAt: exec.finishedAt || exec.stoppedAt || null,
    waitTill: exec.waitTill || null,
    retryOf: exec.retryOf ?? null,
    retrySuccessId: exec.retrySuccessId ?? null,
    errorMessage: exec.error?.message || null,
    durationMs: exec.startedAt && (exec.finishedAt || exec.stoppedAt)
      ? Date.parse(exec.finishedAt || exec.stoppedAt) - Date.parse(exec.startedAt)
      : null,
  };
}

router.use(authRequired, requirePermission(["view_ai"]));

router.get("/workflows", async (req, res) => {
  try {
    if (notConfigured()) {
      return res.status(503).json({ message: "n8n integration is not configured" });
    }
    const workflowPathCandidates = [
      RAW_WORKFLOWS_PATH || "",
      "/workflows",
      "/rest/workflows",
    ].filter(Boolean);

    const listResult = await fetchWithFallback(workflowPathCandidates, { method: "GET" });
    if (!listResult.ok) {
      const status = listResult.attempts?.[0]?.status || 502;
      return res.status(status === 404 ? 502 : status).json({
        message: "Failed to fetch n8n workflows",
        attempts: listResult.attempts || [],
      });
    }

    const payload = listResult.data;
    const list = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.workflows)
      ? payload.workflows
      : Array.isArray(payload)
      ? payload
      : [];

    const listPathUsed = listResult.path || "/workflows";
    const detailBasePath = ensureLeadingPath(stripQueryAndHash(listPathUsed) || "/workflows");

    const detailPromises = list.map(async (wf) => {
      try {
        const workflowId = encodeURIComponent(wf.id);
        const detailResult = await fetchWithFallback([
          `${detailBasePath}/${workflowId}`,
          `/workflows/${workflowId}`,
          `/rest/workflows/${workflowId}`,
        ]);
        if (detailResult.ok) {
          const detailPayload = detailResult.data;
          const detail = detailPayload?.data || detailPayload;
          return serializeWorkflow(wf, detail);
        }
        return serializeWorkflow(wf);
      } catch (detailError) {
        return serializeWorkflow(wf);
      }
    });

    const workflows = await Promise.all(detailPromises);

    return res.json({ workflows });
  } catch (error) {
    if (error?.code === "N8N_CONFIG_MISSING") {
      return res.status(503).json({ message: "n8n integration is not configured" });
    }
    console.error("GET /api/n8n/workflows error", error);
    return res.status(500).json({ message: "Unexpected error fetching workflows" });
  }
});

router.get("/executions", async (req, res) => {
  try {
    if (notConfigured()) {
      return res.status(503).json({ message: "n8n integration is not configured" });
    }
    const query = new URLSearchParams();
    if (req.query.limit) {
      query.set("limit", String(req.query.limit));
    }
    if (req.query.status) {
      query.set("status", String(req.query.status));
    }
    const qs = query.toString();
    const executionBaseCandidates = [
      RAW_EXECUTIONS_PATH || "",
      "/executions",
      "/rest/executions",
    ].filter(Boolean);

    const executionsPathCandidates = executionBaseCandidates.map((p) => {
      const normalized = ensureLeadingPath(p, { keepTrailing: false });
      return appendQuery(normalized, qs);
    });

    const execResult = await fetchWithFallback(executionsPathCandidates, { method: "GET" });
    if (!execResult.ok) {
      const status = execResult.attempts?.[0]?.status || 502;
      return res.status(status === 404 ? 502 : status).json({
        message: "Failed to fetch n8n executions",
        attempts: execResult.attempts || [],
      });
    }

    const payload = execResult.data;
    const list = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.executions)
      ? payload.executions
      : Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload)
      ? payload
      : [];

    const executions = list
      .map(serializeExecution)
      .filter(Boolean);

    return res.json({ executions });
  } catch (error) {
    if (error?.code === "N8N_CONFIG_MISSING") {
      return res.status(503).json({ message: "n8n integration is not configured" });
    }
    console.error("GET /api/n8n/executions error", error);
    return res.status(500).json({ message: "Unexpected error fetching executions" });
  }
});

export default router;
