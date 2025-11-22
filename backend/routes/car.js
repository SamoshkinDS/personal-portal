import express from "express";
import multer from "multer";
import path from "path";
import { pool } from "../db/connect.js";
import { authRequired } from "../middleware/auth.js";
import { uploadFile, deleteFile, buildUrl } from "../services/storageService.js";
import { isS3Ready } from "../services/s3Client.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Недопустимый тип файла"));
    }
    cb(null, true);
  },
});

router.use(authRequired);

const INSURANCE_TYPES = new Set(["osago", "kasko"]);
const DEFAULT_CAR_NAME = "Changan UNI V";
const MS_IN_DAY = 24 * 60 * 60 * 1000;

function respond(res, status, payload) {
  return res.status(status).json({ success: payload.success, data: payload.data ?? null, error: payload.error ?? null });
}

function safeFileName(name = "") {
  const ext = path.extname(name) || "";
  const base = name.replace(ext, "").replace(/[^a-z0-9._-]+/gi, "-") || "file";
  return `${base}${ext || ".dat"}`;
}

function normalizeInsuranceType(value) {
  const type = String(value || "").toLowerCase();
  if (INSURANCE_TYPES.has(type)) return type;
  return null;
}

function parseSupportPhones(raw) {
  if (!raw) return [];
  const source = Array.isArray(raw) ? raw : String(raw).split(/[\n,;]/);
  return source
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .slice(0, 10);
}

function mapInsurance(row) {
  return {
    id: row.id,
    type: row.type,
    company: row.company,
    policy_number: row.policy_number,
    start_date: row.start_date,
    end_date: row.end_date,
    phone: row.phone,
    pdf_url: row.pdf_url || (row.pdf_key ? buildUrl(row.pdf_key) : null),
    pdf_key: row.pdf_key,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function ensureCarInfo() {
  const existing = await pool.query("SELECT * FROM car_info ORDER BY id ASC LIMIT 1");
  if (existing.rows.length > 0) return existing.rows[0];
  const inserted = await pool.query("INSERT INTO car_info (name) VALUES ($1) RETURNING *", [DEFAULT_CAR_NAME]);
  return inserted.rows[0];
}

async function getCurrentMileage() {
  const q = await pool.query(
    `SELECT id, mileage_date, value_km, created_at
     FROM car_mileage
     ORDER BY mileage_date DESC, id DESC
     LIMIT 1`
  );
  return q.rows[0] || null;
}

async function calculateMileageStats() {
  const q = await pool.query(
    `SELECT id, mileage_date, value_km, created_at
     FROM car_mileage
     ORDER BY mileage_date ASC, id ASC`
  );
  if (q.rows.length === 0) {
    return { last: null, avgPerMonth: 0, avgPerYear: 0 };
  }
  const first = q.rows[0];
  const last = q.rows[q.rows.length - 1];
  const distance = Math.max(0, Number(last.value_km || 0) - Number(first.value_km || 0));
  const days = Math.max(1, Math.round((new Date(last.mileage_date) - new Date(first.mileage_date)) / MS_IN_DAY) || 1);
  const daily = distance / days;
  return {
    last,
    avgPerMonth: Math.round(daily * 30),
    avgPerYear: Math.round(daily * 365),
  };
}

async function getLastServiceRecord() {
  const q = await pool.query(
    `SELECT r.*, p.title AS plan_title
     FROM car_service_records r
     LEFT JOIN car_service_plan p ON p.id = r.plan_id
     ORDER BY service_date DESC NULLS LAST, id DESC
     LIMIT 1`
  );
  return q.rows[0] || null;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function buildPlanStatuses(plans, lastRecordsByPlan, currentMileage) {
  return plans.map((plan) => {
    const lastRecord = lastRecordsByPlan.get(plan.id) || null;
    const currentValue = currentMileage?.value_km ?? null;
    let kmToNext = null;
    let nextMileage = null;
    if (plan.interval_km !== null && plan.interval_km !== undefined && currentValue !== null) {
      const lastMileage = lastRecord?.mileage ?? 0;
      const passed = Math.max(0, currentValue - lastMileage);
      kmToNext = Math.max(0, plan.interval_km - passed);
      nextMileage = lastMileage + plan.interval_km;
    }

    let nextDate = null;
    let daysLeft = null;
    if (plan.interval_months && lastRecord?.service_date) {
      nextDate = addMonths(new Date(lastRecord.service_date), plan.interval_months);
      daysLeft = Math.max(0, Math.ceil((nextDate - Date.now()) / MS_IN_DAY));
      nextDate = nextDate.toISOString().slice(0, 10);
    }

    return {
      ...plan,
      computed: {
        kmToNext,
        nextMileage,
        daysLeft,
        nextDate,
        lastServiceMileage: lastRecord?.mileage ?? null,
        lastServiceDate: lastRecord?.service_date ?? null,
      },
    };
  });
}

router.get("/", async (_req, res) => {
  try {
    const [info, lastMileage, mileageStats, lastService] = await Promise.all([
      ensureCarInfo(),
      getCurrentMileage(),
      calculateMileageStats(),
      getLastServiceRecord(),
    ]);
    return respond(res, 200, {
      success: true,
      data: { info, lastMileage, mileageStats, lastService },
    });
  } catch (err) {
    console.error("GET /api/car", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить данные об автомобиле" });
  }
});

router.post("/update", upload.single("image"), async (req, res) => {
  try {
    const info = await ensureCarInfo();
    const name = req.body?.name ? String(req.body.name).trim() : info.name;
    const removeImage = String(req.body?.removeImage || "false").toLowerCase() === "true";
    let imageUrl = info.image_url;
    let imageKey = info.image_key;

    if (req.file) {
      if (!req.file.mimetype.startsWith("image/")) {
        return respond(res, 400, { success: false, error: "Можно загрузить только изображение" });
      }
      if (!isS3Ready()) {
        return respond(res, 503, { success: false, error: "S3 не настроен для загрузки изображений" });
      }
      const ext = path.extname(req.file.originalname) || ".png";
      const key = `car/info/${Date.now()}-${safeFileName(req.file.originalname || `car${ext}`)}`;
      imageUrl = await uploadFile({ body: req.file.buffer, key, contentType: req.file.mimetype });
      if (imageKey && imageKey !== key) {
        await deleteFile(imageKey);
      }
      imageKey = key;
    } else if (removeImage && imageKey) {
      await deleteFile(imageKey);
      imageUrl = null;
      imageKey = null;
    }

    const updated = await pool.query(
      `UPDATE car_info
       SET name = $1,
           image_url = $2,
           image_key = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [name || DEFAULT_CAR_NAME, imageUrl, imageKey, info.id]
    );
    return respond(res, 200, { success: true, data: { info: updated.rows[0] } });
  } catch (err) {
    console.error("POST /api/car/update", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить информацию об авто" });
  }
});

router.get("/insurance", async (_req, res) => {
  try {
    const q = await pool.query("SELECT * FROM car_insurance ORDER BY type ASC, end_date DESC NULLS LAST, id DESC");
    return respond(res, 200, { success: true, data: { items: q.rows.map(mapInsurance) } });
  } catch (err) {
    console.error("GET /api/car/insurance", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить страховки" });
  }
});

router.post("/insurance", upload.single("file"), async (req, res) => {
  try {
    const type = normalizeInsuranceType(req.body?.type);
    if (!type) {
      return respond(res, 400, { success: false, error: "Тип страховки обязателен" });
    }
    let pdfUrl = req.body?.pdfUrl || null;
    let pdfKey = null;
    if (req.file) {
      if (!isS3Ready()) {
        return respond(res, 503, { success: false, error: "S3 не настроен для загрузки файлов" });
      }
      const key = `car/insurance/${type}/${Date.now()}-${safeFileName(req.file.originalname)}`;
      pdfUrl = await uploadFile({ body: req.file.buffer, key, contentType: req.file.mimetype });
      pdfKey = key;
    }
    const inserted = await pool.query(
      `INSERT INTO car_insurance (type, company, policy_number, start_date, end_date, phone, pdf_key, pdf_url, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        type,
        req.body?.company || null,
        req.body?.policyNumber || null,
        req.body?.startDate || null,
        req.body?.endDate || null,
        req.body?.phone || null,
        pdfKey,
        pdfUrl,
        req.body?.notes || null,
      ]
    );
    return respond(res, 201, { success: true, data: { insurance: mapInsurance(inserted.rows[0]) } });
  } catch (err) {
    console.error("POST /api/car/insurance", err);
    return respond(res, 500, { success: false, error: "Не удалось сохранить страховку" });
  }
});

router.put("/insurance/:id", upload.single("file"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор" });
    }
    const existing = await pool.query("SELECT * FROM car_insurance WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Страховка не найдена" });
    }
    const current = existing.rows[0];
    const type = req.body?.type ? normalizeInsuranceType(req.body.type) : current.type;
    if (!type) {
      return respond(res, 400, { success: false, error: "Тип страховки обязателен" });
    }
    const removePdf = String(req.body?.removePdf || "false").toLowerCase() === "true";
    let pdfUrl = req.body?.pdfUrl !== undefined ? req.body.pdfUrl : current.pdf_url;
    let pdfKey = current.pdf_key;
    if (req.file) {
      if (!isS3Ready()) {
        return respond(res, 503, { success: false, error: "S3 не настроен для загрузки файлов" });
      }
      const key = `car/insurance/${type}/${Date.now()}-${safeFileName(req.file.originalname)}`;
      pdfUrl = await uploadFile({ body: req.file.buffer, key, contentType: req.file.mimetype });
      if (pdfKey && pdfKey !== key) {
        await deleteFile(pdfKey);
      }
      pdfKey = key;
    } else if (removePdf && pdfKey) {
      await deleteFile(pdfKey);
      pdfUrl = null;
      pdfKey = null;
    }
    const updated = await pool.query(
      `UPDATE car_insurance
       SET type = $1,
           company = $2,
           policy_number = $3,
           start_date = $4,
           end_date = $5,
           phone = $6,
           pdf_key = $7,
           pdf_url = $8,
           notes = $9,
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        type,
        req.body?.company ?? current.company,
        req.body?.policyNumber ?? current.policy_number,
        req.body?.startDate ?? current.start_date,
        req.body?.endDate ?? current.end_date,
        req.body?.phone ?? current.phone,
        pdfKey,
        pdfUrl,
        req.body?.notes ?? current.notes,
        id,
      ]
    );
    return respond(res, 200, { success: true, data: { insurance: mapInsurance(updated.rows[0]) } });
  } catch (err) {
    console.error("PUT /api/car/insurance/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить страховку" });
  }
});

router.delete("/insurance/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор" });
    }
    const existing = await pool.query("DELETE FROM car_insurance WHERE id = $1 RETURNING *", [id]);
    if (existing.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Страховка не найдена" });
    }
    if (existing.rows[0].pdf_key) {
      await deleteFile(existing.rows[0].pdf_key);
    }
    return respond(res, 200, { success: true, data: { message: "Страховка удалена" } });
  } catch (err) {
    console.error("DELETE /api/car/insurance/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить страховку" });
  }
});

router.get("/alarm", async (_req, res) => {
  try {
    const q = await pool.query("SELECT * FROM car_alarm ORDER BY id DESC LIMIT 1");
    return respond(res, 200, { success: true, data: { alarm: q.rows[0] || null } });
  } catch (err) {
    console.error("GET /api/car/alarm", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить данные по сигнализации" });
  }
});

router.post("/alarm", async (req, res) => {
  try {
    const payload = req.body || {};
    const phones = parseSupportPhones(payload.supportPhones || payload.support_phones);
    const existing = await pool.query("SELECT id FROM car_alarm ORDER BY id DESC LIMIT 1");
    if (existing.rows.length === 0) {
      const inserted = await pool.query(
        `INSERT INTO car_alarm (vendor, pin_code, contract_number, support_phones, notes)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [
          payload.vendor || null,
          payload.pinCode || payload.pin_code || null,
          payload.contractNumber || payload.contract_number || null,
          phones,
          payload.notes || null,
        ]
      );
      return respond(res, 201, { success: true, data: { alarm: inserted.rows[0] } });
    }
    const id = existing.rows[0].id;
    const updated = await pool.query(
      `UPDATE car_alarm
       SET vendor = $1,
           pin_code = $2,
           contract_number = $3,
           support_phones = $4,
           notes = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        payload.vendor ?? null,
        payload.pinCode ?? payload.pin_code ?? null,
        payload.contractNumber ?? payload.contract_number ?? null,
        phones,
        payload.notes ?? null,
        id,
      ]
    );
    return respond(res, 200, { success: true, data: { alarm: updated.rows[0] } });
  } catch (err) {
    console.error("POST /api/car/alarm", err);
    return respond(res, 500, { success: false, error: "Не удалось сохранить сигнализацию" });
  }
});

router.get("/service-plan", async (_req, res) => {
  try {
    const [plansQ, lastByPlanQ, currentMileage] = await Promise.all([
      pool.query("SELECT * FROM car_service_plan ORDER BY id ASC"),
      pool.query(
        `SELECT DISTINCT ON (plan_id) plan_id, id, mileage, service_date
         FROM car_service_records
         WHERE plan_id IS NOT NULL
         ORDER BY plan_id, service_date DESC NULLS LAST, id DESC`
      ),
      getCurrentMileage(),
    ]);
    const lastByPlan = new Map();
    lastByPlanQ.rows.forEach((row) => {
      if (row.plan_id) {
        lastByPlan.set(row.plan_id, row);
      }
    });
    const plans = buildPlanStatuses(plansQ.rows, lastByPlan, currentMileage);
    return respond(res, 200, { success: true, data: { items: plans, currentMileage } });
  } catch (err) {
    console.error("GET /api/car/service-plan", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить план ТО" });
  }
});

router.post("/service-plan", async (req, res) => {
  try {
    const { title, intervalKm, intervalMonths, comments } = req.body || {};
    if (!title || !String(title).trim()) {
      return respond(res, 400, { success: false, error: "Название операции обязательно" });
    }
    const interval_km = intervalKm !== undefined ? Number(intervalKm) : null;
    const interval_months = intervalMonths !== undefined ? Number(intervalMonths) : null;
    const inserted = await pool.query(
      `INSERT INTO car_service_plan (title, interval_km, interval_months, comments)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [String(title).trim(), Number.isFinite(interval_km) ? interval_km : null, Number.isFinite(interval_months) ? interval_months : null, comments || null]
    );
    return respond(res, 201, { success: true, data: { plan: inserted.rows[0] } });
  } catch (err) {
    console.error("POST /api/car/service-plan", err);
    return respond(res, 500, { success: false, error: "Не удалось создать запись в плане ТО" });
  }
});

router.put("/service-plan/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор" });
    }
    const existing = await pool.query("SELECT * FROM car_service_plan WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Операция не найдена" });
    }
    const { title, intervalKm, intervalMonths, comments } = req.body || {};
    const interval_km = intervalKm !== undefined ? Number(intervalKm) : existing.rows[0].interval_km;
    const interval_months = intervalMonths !== undefined ? Number(intervalMonths) : existing.rows[0].interval_months;
    const updated = await pool.query(
      `UPDATE car_service_plan
       SET title = $1,
           interval_km = $2,
           interval_months = $3,
           comments = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        title !== undefined ? String(title).trim() : existing.rows[0].title,
        Number.isFinite(interval_km) ? interval_km : null,
        Number.isFinite(interval_months) ? interval_months : null,
        comments !== undefined ? comments : existing.rows[0].comments,
        id,
      ]
    );
    return respond(res, 200, { success: true, data: { plan: updated.rows[0] } });
  } catch (err) {
    console.error("PUT /api/car/service-plan/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить план ТО" });
  }
});

router.delete("/service-plan/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор" });
    }
    const deleted = await pool.query("DELETE FROM car_service_plan WHERE id = $1 RETURNING *", [id]);
    if (deleted.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Операция не найдена" });
    }
    await pool.query("UPDATE car_service_records SET plan_id = NULL WHERE plan_id = $1", [id]);
    return respond(res, 200, { success: true, data: { message: "Операция удалена" } });
  } catch (err) {
    console.error("DELETE /api/car/service-plan/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить запись из плана ТО" });
  }
});

router.get("/service-records", async (_req, res) => {
  try {
    const q = await pool.query(
      `SELECT r.*, p.title AS plan_title
       FROM car_service_records r
       LEFT JOIN car_service_plan p ON p.id = r.plan_id
       ORDER BY service_date DESC NULLS LAST, id DESC`
    );
    return respond(res, 200, { success: true, data: { items: q.rows } });
  } catch (err) {
    console.error("GET /api/car/service-records", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить историю ТО" });
  }
});

router.post("/service-records", async (req, res) => {
  try {
    const payload = req.body || {};
    const mileage = payload.mileage !== undefined ? Number(payload.mileage) : null;
    const cost = payload.cost !== undefined && payload.cost !== null ? Number(payload.cost) : null;
    const planId = payload.planId || payload.plan_id;
    const plan_id = planId ? Number(planId) : null;
    const inserted = await pool.query(
      `INSERT INTO car_service_records (service_date, mileage, description, cost, comments, plan_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        payload.serviceDate || payload.service_date || null,
        Number.isFinite(mileage) ? mileage : null,
        payload.description || null,
        Number.isFinite(cost) ? cost : null,
        payload.comments || null,
        Number.isInteger(plan_id) ? plan_id : null,
      ]
    );
    return respond(res, 201, { success: true, data: { record: inserted.rows[0] } });
  } catch (err) {
    console.error("POST /api/car/service-records", err);
    return respond(res, 500, { success: false, error: "Не удалось сохранить запись ТО" });
  }
});

router.put("/service-records/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор" });
    }
    const existing = await pool.query("SELECT * FROM car_service_records WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Запись не найдена" });
    }
    const payload = req.body || {};
    const mileage = payload.mileage !== undefined ? Number(payload.mileage) : existing.rows[0].mileage;
    const cost = payload.cost !== undefined && payload.cost !== null ? Number(payload.cost) : existing.rows[0].cost;
    const planId = payload.planId || payload.plan_id;
    const plan_id = planId !== undefined ? Number(planId) : existing.rows[0].plan_id;
    const updated = await pool.query(
      `UPDATE car_service_records
       SET service_date = $1,
           mileage = $2,
           description = $3,
           cost = $4,
           comments = $5,
           plan_id = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        payload.serviceDate ?? payload.service_date ?? existing.rows[0].service_date,
        Number.isFinite(mileage) ? mileage : null,
        payload.description ?? existing.rows[0].description,
        Number.isFinite(cost) ? cost : null,
        payload.comments ?? existing.rows[0].comments,
        Number.isInteger(plan_id) ? plan_id : null,
        id,
      ]
    );
    return respond(res, 200, { success: true, data: { record: updated.rows[0] } });
  } catch (err) {
    console.error("PUT /api/car/service-records/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось обновить запись ТО" });
  }
});

router.delete("/service-records/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор" });
    }
    const deleted = await pool.query("DELETE FROM car_service_records WHERE id = $1 RETURNING *", [id]);
    if (deleted.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Запись не найдена" });
    }
    return respond(res, 200, { success: true, data: { message: "Запись удалена" } });
  } catch (err) {
    console.error("DELETE /api/car/service-records/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить запись ТО" });
  }
});

router.get("/mileage", async (_req, res) => {
  try {
    const [itemsQ, stats] = await Promise.all([
      pool.query("SELECT * FROM car_mileage ORDER BY mileage_date DESC, id DESC"),
      calculateMileageStats(),
    ]);
    return respond(res, 200, { success: true, data: { items: itemsQ.rows, stats } });
  } catch (err) {
    console.error("GET /api/car/mileage", err);
    return respond(res, 500, { success: false, error: "Не удалось загрузить пробег" });
  }
});

router.post("/mileage", async (req, res) => {
  try {
    const value = Number(req.body?.value ?? req.body?.valueKm ?? req.body?.value_km);
    if (!Number.isFinite(value) || value < 0) {
      return respond(res, 400, { success: false, error: "Пробег должен быть числом" });
    }
    const mileageDate =
      req.body?.date ||
      req.body?.mileageDate ||
      req.body?.mileage_date ||
      new Date().toISOString().slice(0, 10);
    const inserted = await pool.query(
      `INSERT INTO car_mileage (mileage_date, value_km)
       VALUES ($1, $2)
       RETURNING *`,
      [mileageDate, Math.round(value)]
    );
    return respond(res, 201, { success: true, data: { mileage: inserted.rows[0] } });
  } catch (err) {
    console.error("POST /api/car/mileage", err);
    return respond(res, 500, { success: false, error: "Не удалось добавить пробег" });
  }
});

router.delete("/mileage/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return respond(res, 400, { success: false, error: "Некорректный идентификатор" });
    }
    const deleted = await pool.query("DELETE FROM car_mileage WHERE id = $1 RETURNING *", [id]);
    if (deleted.rows.length === 0) {
      return respond(res, 404, { success: false, error: "Запись пробега не найдена" });
    }
    return respond(res, 200, { success: true, data: { message: "Пробег удален" } });
  } catch (err) {
    console.error("DELETE /api/car/mileage/:id", err);
    return respond(res, 500, { success: false, error: "Не удалось удалить пробег" });
  }
});

export default router;
