const buckets = new Map();

function cleanup(key, now, windowMs) {
  const entry = buckets.get(key);
  if (!entry) return;
  entry.hits = entry.hits.filter((ts) => now - ts < windowMs);
  if (entry.hits.length === 0) {
    buckets.delete(key);
  }
}

export function rateLimit(options = {}) {
  const windowMs = Number(options.windowMs || 60_000);
  const limit = Number(options.limit || 10);
  const message = options.message || "Слишком много запросов. Повторите позже.";
  const statusCode = Number(options.statusCode || 429);
  const keyGenerator = options.keyGenerator || ((req) => req.ip || req.headers["x-forwarded-for"] || "unknown");

  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator(req);
    cleanup(key, now, windowMs);
    const entry = buckets.get(key) || { hits: [] };
    entry.hits.push(now);
    buckets.set(key, entry);
    if (entry.hits.length > limit) {
      return res.status(statusCode).json({ message });
    }
    next();
  };
}
