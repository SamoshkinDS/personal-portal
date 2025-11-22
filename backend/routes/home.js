import express from "express";
import multer from "multer";
import path from "path";
import { pool } from "../db/connect.js";
import { authRequired } from "../middleware/auth.js";
import { isS3Ready } from "../services/s3Client.js";
import { uploadFile, deleteFile } from "../services/storageService.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/heic",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Неподдерживаемый тип файла"));
    }
    cb(null, true);
  },
});

router.use(authRequired);

const DEFAULT_COMPANY_TITLE = "Управляющая компания";

function respond(res, status, payload) {
  return res.status(status).json({ success: payload.success, data: payload.data ?? null, error: payload.error ?? null });
}

function safeFileName(name = "") {
  const ext = path.extname(name) || "";
  const base = name.replace(ext, "").replace(/[^a-z0-9._-]+/gi, "-") || "file";
  return `${base}${ext || ".dat"}`;
}

function normalizeCode(code) {
  const value = String(code || "").trim().toLowerCase();
  if (!value) return null;
  return value.replace(/[^a-z0-9_-]+/g, "-").slice(0, 32);
}

function mapCompany(row, files = []) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    emergency_phone: row.emergency_phone,
    email: row.email,
    work_hours: row.work_hours,
    account_number: row.account_number,
    office_address: row.office_address,
    comments: row.comments,
    files,
  };
}

function mapContact(row) {
  return {
    id: row.id,
    title: row.title,
    phone: row.phone,
    comments: row.comments,
  };
}

function mapCamera(row) {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    username: row.username,
    password: row.password,
  };
}

function mapMeter(row, lastRecord = null) {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    meter_number: row.meter_number,
    lastRecord,
  };
}

function mapRecord(row) {
  return {
    id: row.id,
    meter_id: row.meter_id,
    reading_date: row.reading_date,
    value: row.value !== null && row.value !== undefined ? Number(row.value) : null,
    diff: row.diff !== null && row.diff !== undefined ? Number(row.diff) : null,
  };
}

async function ensureCompanyRow() {
  const existing = await pool.query("SELECT * FROM home_company ORDER BY id ASC LIMIT 1");
  if (existing.rows.length > 0) return existing.rows[0];
  const inserted = await pool.query("INSERT INTO home_company (name) VALUES ($1) RETURNING *", [DEFAULT_COMPANY_TITLE]);
  return inserted.rows[0];
}

router.get("/company", async (_req, res) => {
  try {
    const company = await ensureCompanyRow();
    const filesQ = await pool.query(
      "SELECT id, company_id, file_name, mime_type, file_key, file_url, created_at FROM home_company_files WHERE company_id = $1 ORDER BY created_at DESC, id DESC",
      [company.id]
    );
    return respond(res, 200, { success: true, data: { company: mapCompany(company, filesQ.rows) } });
  } catch (err) {
    console.error("GET /api/home/company", err);
    return respond(res, 500, { success: false, error: "Не удалось получить данные управляющей компании" });
  }
});

router.post("/company", upload.array("files", 8), async (req, res) => {
  try {
    const company = await ensureCompanyRow();
    const payload = req.body || {};
    const removeFileIdsRaw = payload.removeFileIds || payload.removeFiles || payload.remove_file_ids;
    const removeFileIds = Array.isArray(removeFileIdsRaw)
      ? removeFileIdsRaw
      : String(removeFileIdsRaw || "")
          .split(/[,;]/)
          .map((v) => Number(v))
          .filter((v) => Number.isInteger(v));

    if (removeFileIds.length > 0) {
      const filesToDelete = await pool.query("SELECT id, file_key FROM home_company_files WHERE id = ANY($1)", [removeFileIds]);
      await pool.query("DELETE FROM home_company_files WHERE id = ANY($1)", [removeFileIds]);
      for (const file of filesToDelete.rows) {
        if (file.file_key) {
          await deleteFile(file.file_key);
        }
      }
    }

    const updated = await pool.query(
      `
      UPDATE home_company
      SET name = $1,
          phone = $2,
          emergency_phone = $3,
          email = $4,
          work_hours = $5,
          account_number = $6,
          office_address = $7,
          comments = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING *;
    `,
      [
        payload.name || DEFAULT_COMPANY_TITLE,
        payload.phone || null,
        payload.emergencyPhone || payload.emergency_phone || null,
        payload.email || null,
        payload.workHours || payload.work_hours || null,
        payload.accountNumber || payload.account_number || null,
        payload.officeAddress || payload.office_address || null,
        payload.comments || null,
        company.id,
      ]
    );
    const current = updated.rows[0];

    if (req.files?.length) {
      if (!isS3Ready()) {
        return respond(res, 503, { success: false, error: "S3 не готов к приёму файлов" });
      }
      for (const file of req.files) {
        const key = `home/company/${Date.now()}-${safeFileName(file.originalname || "document.pdf")}`;
        const fileUrl = await uploadFile({ body: file.buffer, key, contentType: file.mimetype });
        await pool.query(
          `
          INSERT INTO home_company_files (company_id, file_name, mime_type, file_key, file_url)
          VALUES ($1,$2,$3,$4,$5);
        `,
          [current.id, file.originalname || path.basename(key), file.mimetype, key, fileUrl]
        );
      }
    }

    const filesQ = await pool.query(
      "SELECT id, company_id, file_name, mime_type, file_key, file_url, created_at FROM home_company_files WHERE company_id = $1 ORDER BY created_at DESC, id DESC",
      [current.id]
    );
    return respond(res, 200, { success: true, data: { company: mapCompany(current, filesQ.rows) } });
  } catch (err) {
    console.error("POST /api/home/company", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить данные управляющей компании" });
  }
});

router.get("/contacts", async (_req, res) => {
  try {
    const q = await pool.query("SELECT * FROM home_contacts ORDER BY created_at DESC, id DESC");
    return respond(res, 200, { success: true, data: { items: q.rows.map(mapContact) } });
  } catch (err) {
    console.error("GET /api/home/contacts", err);
    return respond(res, 500, { success: false, error: "Не удалось получить контакты" });
  }
});

router.post("/contacts", async (req, res) => {
  try {
    const payload = req.body || {};
    const title = String(payload.title || "").trim();
    if (!title) {
      return respond(res, 400, { success: false, error: "Название контакта обязательно" });
    }
    const inserted = await pool.query(
      `INSERT INTO home_contacts (title, phone, comments)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [title, payload.phone || null, payload.comments || null]
    );
    return respond(res, 201, { success: true, data: { contact: mapContact(inserted.rows[0]) } });
  } catch (err) {
    console.error("POST /api/home/contacts", err);
    return respond(res, 500, { success: false, error: "Не удалось добавить контакт" });
  }
});

router.put("/contacts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор контакта" });
    }
    const existing = await pool.query("SELECT * FROM home_contacts WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Контакт не найден" });
    }
    const payload = req.body || {};
    const title = payload.title !== undefined ? String(payload.title || "").trim() : existing.rows[0].title;
    if (!title) {
      return respond(res, 400, { success: false, error: "Название контакта обязательно" });
    }
    const updated = await pool.query(
      `UPDATE home_contacts
       SET title = $1,
           phone = $2,
           comments = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [title, payload.phone ?? existing.rows[0].phone, payload.comments ?? existing.rows[0].comments, id]
    );
    return respond(res, 200, { success: true, data: { contact: mapContact(updated.rows[0]) } });
  } catch (err) {
    console.error("PUT /api/home/contacts/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить контакт" });
  }
});

router.delete("/contacts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор контакта" });
    }
    const deleted = await pool.query("DELETE FROM home_contacts WHERE id = $1 RETURNING *", [id]);
    if (deleted.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Контакт не найден" });
    }
    return respond(res, 200, { success: true, data: { message: "Контакт удалён" } });
  } catch (err) {
    console.error("DELETE /api/home/contacts/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить контакт" });
  }
});

router.get("/cameras", async (_req, res) => {
  try {
    const q = await pool.query("SELECT * FROM home_cameras ORDER BY created_at DESC, id DESC");
    return respond(res, 200, { success: true, data: { items: q.rows.map(mapCamera) } });
  } catch (err) {
    console.error("GET /api/home/cameras", err);
    return respond(res, 500, { success: false, error: "Не удалось получить список камер" });
  }
});

router.post("/cameras", async (req, res) => {
  try {
    const payload = req.body || {};
    const title = String(payload.title || "").trim();
    if (!title) {
      return respond(res, 400, { success: false, error: "Название камеры обязательно" });
    }
    const inserted = await pool.query(
      `INSERT INTO home_cameras (title, url, username, password)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [title, payload.url || null, payload.username || null, payload.password || null]
    );
    return respond(res, 201, { success: true, data: { camera: mapCamera(inserted.rows[0]) } });
  } catch (err) {
    console.error("POST /api/home/cameras", err);
    return respond(res, 500, { success: false, error: "Не удалось добавить камеру" });
  }
});

router.put("/cameras/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор камеры" });
    }
    const existing = await pool.query("SELECT * FROM home_cameras WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Камера не найдена" });
    }
    const payload = req.body || {};
    const title = payload.title !== undefined ? String(payload.title || "").trim() : existing.rows[0].title;
    if (!title) {
      return respond(res, 400, { success: false, error: "Название камеры обязательно" });
    }
    const updated = await pool.query(
      `UPDATE home_cameras
       SET title = $1,
           url = $2,
           username = $3,
           password = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, payload.url ?? existing.rows[0].url, payload.username ?? existing.rows[0].username, payload.password ?? existing.rows[0].password, id]
    );
    return respond(res, 200, { success: true, data: { camera: mapCamera(updated.rows[0]) } });
  } catch (err) {
    console.error("PUT /api/home/cameras/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить камеру" });
  }
});

router.delete("/cameras/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор камеры" });
    }
    const deleted = await pool.query("DELETE FROM home_cameras WHERE id = $1 RETURNING *", [id]);
    if (deleted.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Камера не найдена" });
    }
    return respond(res, 200, { success: true, data: { message: "Камера удалена" } });
  } catch (err) {
    console.error("DELETE /api/home/cameras/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить камеру" });
  }
});

router.get("/meters", async (_req, res) => {
  try {
    const metersQ = await pool.query("SELECT * FROM home_meters ORDER BY code NULLS LAST, id ASC");
    const lastRecordsQ = await pool.query(`
      SELECT DISTINCT ON (meter_id)
        id,
        meter_id,
        reading_date,
        value,
        value - LAG(value) OVER (PARTITION BY meter_id ORDER BY reading_date, id) AS diff
      FROM home_meter_records
      ORDER BY meter_id, reading_date DESC, id DESC
    `);
    const lastByMeter = new Map();
    lastRecordsQ.rows.forEach((row) => {
      lastByMeter.set(row.meter_id, mapRecord(row));
    });
    return respond(res, 200, {
      success: true,
      data: { items: metersQ.rows.map((row) => mapMeter(row, lastByMeter.get(row.id) || null)) },
    });
  } catch (err) {
    console.error("GET /api/home/meters", err);
    return respond(res, 500, { success: false, error: "Не удалось получить список счётчиков" });
  }
});

router.post("/meters", async (req, res) => {
  try {
    const payload = req.body || {};
    const title = String(payload.title || "").trim();
    if (!title) {
      return respond(res, 400, { success: false, error: "Название счётчика обязательно" });
    }
    const code = normalizeCode(payload.code || payload.slug || null);
    try {
      const inserted = await pool.query(
        `INSERT INTO home_meters (code, title, meter_number)
         VALUES ($1,$2,$3)
         RETURNING *`,
        [code, title, payload.meterNumber || payload.meter_number || null]
      );
      return respond(res, 201, { success: true, data: { meter: mapMeter(inserted.rows[0]) } });
    } catch (err) {
      if (err.code === "23505") {
        return respond(res, 409, { success: false, error: "Счётчик с таким кодом уже существует" });
      }
      throw err;
    }
  } catch (err) {
    console.error("POST /api/home/meters", err);
    return respond(res, 500, { success: false, error: "Не удалось добавить счётчик" });
  }
});

router.put("/meters/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор счётчика" });
    }
    const existing = await pool.query("SELECT * FROM home_meters WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Счётчик не найден" });
    }
    const payload = req.body || {};
    const title = payload.title !== undefined ? String(payload.title || "").trim() : existing.rows[0].title;
    if (!title) {
      return respond(res, 400, { success: false, error: "Название счётчика обязательно" });
    }
    const code = payload.code !== undefined || payload.slug !== undefined ? normalizeCode(payload.code || payload.slug) : existing.rows[0].code;
    try {
      const updated = await pool.query(
        `UPDATE home_meters
         SET code = $1,
             title = $2,
             meter_number = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [code, title, payload.meterNumber ?? payload.meter_number ?? existing.rows[0].meter_number, id]
      );
      return respond(res, 200, { success: true, data: { meter: mapMeter(updated.rows[0]) } });
    } catch (err) {
      if (err.code === "23505") {
        return respond(res, 409, { success: false, error: "Счётчик с таким кодом уже существует" });
      }
      throw err;
    }
  } catch (err) {
    console.error("PUT /api/home/meters/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить счётчик" });
  }
});

router.delete("/meters/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор счётчика" });
    }
    const deleted = await pool.query("DELETE FROM home_meters WHERE id = $1 RETURNING *", [id]);
    if (deleted.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Счётчик не найден" });
    }
    return respond(res, 200, { success: true, data: { message: "Счётчик удалён" } });
  } catch (err) {
    console.error("DELETE /api/home/meters/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить счётчик" });
  }
});

router.get("/meter-records/:meterId", async (req, res) => {
  try {
    const meterId = Number(req.params.meterId);
    if (!Number.isInteger(meterId)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор счётчика" });
    }
    const existing = await pool.query("SELECT id FROM home_meters WHERE id = $1", [meterId]);
    if (existing.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Счётчик не найден" });
    }
    const q = await pool.query(
      `
      SELECT
        id,
        meter_id,
        reading_date,
        value,
        value - LAG(value) OVER (PARTITION BY meter_id ORDER BY reading_date, id) AS diff
      FROM home_meter_records
      WHERE meter_id = $1
      ORDER BY reading_date DESC, id DESC
    `,
      [meterId]
    );
    return respond(res, 200, { success: true, data: { meterId, items: q.rows.map(mapRecord) } });
  } catch (err) {
    console.error("GET /api/home/meter-records/:meterId", err);
    return respond(res, 500, { success: false, error: "Не удалось получить историю показаний" });
  }
});

router.post("/meter-records/:meterId", async (req, res) => {
  try {
    const meterId = Number(req.params.meterId);
    if (!Number.isInteger(meterId)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор счётчика" });
    }
    const meter = await pool.query("SELECT * FROM home_meters WHERE id = $1", [meterId]);
    if (meter.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Счётчик не найден" });
    }
    const valueRaw = req.body?.value ?? req.body?.reading ?? req.body?.readingValue;
    const value = Number(valueRaw);
    if (!Number.isFinite(value) || value < 0) {
      return respond(res, 400, { success: false, error: "Показание должно быть числом" });
    }
    const readingDate =
      req.body?.date || req.body?.readingDate || req.body?.reading_date || new Date().toISOString().slice(0, 10);
    const inserted = await pool.query(
      `INSERT INTO home_meter_records (meter_id, reading_date, value)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [meterId, readingDate, value]
    );
    const prev = await pool.query(
      `
      SELECT value
      FROM home_meter_records
      WHERE meter_id = $1
        AND (reading_date < $2 OR (reading_date = $2 AND id < $3))
      ORDER BY reading_date DESC, id DESC
      LIMIT 1
    `,
      [meterId, inserted.rows[0].reading_date, inserted.rows[0].id]
    );
    const diff = prev.rows.length ? Number(value) - Number(prev.rows[0].value) : null;
    return respond(res, 201, { success: true, data: { record: mapRecord({ ...inserted.rows[0], diff }) } });
  } catch (err) {
    console.error("POST /api/home/meter-records/:meterId", err);
    return respond(res, 500, { success: false, error: "Не удалось добавить показание" });
  }
});

router.delete("/meter-records/:recordId", async (req, res) => {
  try {
    const recordId = Number(req.params.recordId);
    if (!Number.isInteger(recordId)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор записи" });
    }
    const deleted = await pool.query("DELETE FROM home_meter_records WHERE id = $1 RETURNING *", [recordId]);
    if (deleted.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Запись не найдена" });
    }
    return respond(res, 200, { success: true, data: { message: "Показание удалено" } });
  } catch (err) {
    console.error("DELETE /api/home/meter-records/:recordId", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить показание" });
  }
});

export default router;
