import React from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { IMaskInput } from "react-imask";
import { FiEdit2 } from "react-icons/fi";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { homeApi } from "../../api/home.js";
import { getMeterDeadlineInfo } from "../../utils/meterDeadline.js";

const blankContact = { id: null, title: "", phone: "", comments: "" };
const blankCamera = { id: null, title: "", url: "", username: "", password: "" };
const blankMeter = { id: null, title: "", code: "", meter_number: "" };
const PHONE_PLACEHOLDER = "+7 (___) ___-__-__";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ru-RU");
}

function formatNumber(value) {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 3 }).format(num);
}

function extractPhoneDigits(value) {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return "";
  let normalized = digits;
  if (normalized.length === 11 && (normalized.startsWith("7") || normalized.startsWith("8"))) {
    normalized = normalized.slice(1);
  } else if (normalized.length > 11) {
    normalized = normalized.slice(-10);
  }
  return normalized.slice(0, 10);
}

function formatPhoneFromDigits(digits) {
  if (!digits) return "";
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 8);
  const part4 = digits.slice(8, 10);
  let result = "+7";
  if (part1) {
    result += ` (${part1}`;
    if (part1.length === 3) {
      result += ")";
    }
  }
  if (part2) {
    result += `${part1 && part1.length === 3 ? " " : ""}${part2}`;
  }
  if (part3) {
    result += `-${part3}`;
  }
  if (part4) {
    result += `-${part4}`;
  }
  return result;
}

function formatPhoneInputValue(value) {
  const digits = extractPhoneDigits(value);
  return digits ? formatPhoneFromDigits(digits) : "";
}

function formatPhoneDisplay(value) {
  const digits = extractPhoneDigits(value);
  if (!digits) return value || "";
  return formatPhoneFromDigits(digits);
}

function buildTelHref(value) {
  const digits = extractPhoneDigits(value);
  return digits ? `tel:+7${digits}` : null;
}

export default function HomeModule() {
  const [loading, setLoading] = React.useState(true);
  const [company, setCompany] = React.useState(null);
  const [contacts, setContacts] = React.useState([]);
  const [cameras, setCameras] = React.useState([]);
  const [meters, setMeters] = React.useState([]);
  const [records, setRecords] = React.useState([]);
  const [meterSettings, setMeterSettings] = React.useState(null);
  const [meterSettingsForm, setMeterSettingsForm] = React.useState("");
  const [meterSettingsSaving, setMeterSettingsSaving] = React.useState(false);

  const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
  const [companyForm, setCompanyForm] = React.useState({
    name: "",
    phone: "",
    emergency_phone: "",
    email: "",
    work_hours: "",
    account_number: "",
    office_address: "",
    comments: "",
  });
  const [newCompanyFiles, setNewCompanyFiles] = React.useState([]);
  const [removeFileIds, setRemoveFileIds] = React.useState([]);

  const [contactModal, setContactModal] = React.useState({ open: false, data: blankContact });
  const [cameraModal, setCameraModal] = React.useState({ open: false, data: blankCamera });
  const [meterModal, setMeterModal] = React.useState({ open: false, data: blankMeter });
  const [recordsModal, setRecordsModal] = React.useState({ open: false, meter: null });
  const [recordsLoading, setRecordsLoading] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);

  const meterDeadlineInfo = React.useMemo(() => getMeterDeadlineInfo(meterSettings?.due_day), [meterSettings]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [companyData, contactsData, camerasData, metersData, meterSettingsData] = await Promise.all([
        homeApi.getCompany(),
        homeApi.listContacts(),
        homeApi.listCameras(),
        homeApi.listMeters(),
        homeApi.getMeterSettings(),
      ]);
      setCompany(companyData.company || null);
      setContacts(contactsData.items || []);
      setCameras(camerasData.items || []);
      setMeters(metersData.items || []);
      const settings = meterSettingsData.settings || null;
      setMeterSettings(settings);
      setMeterSettingsForm(settings?.due_day ? String(settings.due_day) : "");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Не удалось загрузить раздел Квартира");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const openCompanyEditor = () => {
    setCompanyForm({
      name: company?.name || "",
      phone: formatPhoneInputValue(company?.phone),
      emergency_phone: formatPhoneInputValue(company?.emergency_phone),
      email: company?.email || "",
      work_hours: company?.work_hours || "",
      account_number: company?.account_number || "",
      office_address: company?.office_address || "",
      comments: company?.comments || "",
    });
    setNewCompanyFiles([]);
    setRemoveFileIds([]);
    setCompanyModalOpen(true);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(companyForm).forEach(([key, value]) => fd.append(key, value || ""));
      removeFileIds.forEach((id) => fd.append("removeFileIds", id));
      newCompanyFiles.forEach((file) => fd.append("files", file));
      const data = await homeApi.saveCompany(fd);
      setCompany(data.company || null);
      toast.success("Компания обновлена");
      setCompanyModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить данные");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    const payload = contactModal.data;
    if (!payload.title.trim()) {
      toast.error("Название обязательно");
      return;
    }
    setSubmitting(true);
    try {
      if (payload.id) {
        await homeApi.updateContact(payload.id, payload);
        toast.success("Контакт обновлён");
      } else {
        await homeApi.createContact(payload);
        toast.success("Контакт добавлен");
      }
      setContactModal({ open: false, data: blankContact });
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить контакт");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (item) => {
    if (!window.confirm("Удалить контакт?")) return false;
    try {
      await homeApi.deleteContact(item.id);
      toast.success("Контакт удалён");
      await loadData();
      return true;
    } catch (err) {
      toast.error(err.message || "Не удалось удалить контакт");
      return false;
    }
  };

  const handleContactModalDelete = async () => {
    if (!contactModal.data?.id) return;
    const success = await handleDeleteContact(contactModal.data);
    if (success) {
      setContactModal({ open: false, data: blankContact });
    }
  };

  const handleSaveCamera = async (e) => {
    e.preventDefault();
    const payload = cameraModal.data;
    if (!payload.title.trim()) {
      toast.error("Название камеры обязательно");
      return;
    }
    setSubmitting(true);
    try {
      if (payload.id) {
        await homeApi.updateCamera(payload.id, payload);
        toast.success("Камера обновлена");
      } else {
        await homeApi.createCamera(payload);
        toast.success("Камера добавлена");
      }
      setCameraModal({ open: false, data: blankCamera });
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить камеру");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCamera = async (item) => {
    if (!window.confirm("Удалить камеру?")) return;
    try {
      await homeApi.deleteCamera(item.id);
      toast.success("Камера удалена");
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось удалить камеру");
    }
  };

  const handleSaveMeter = async (e) => {
    e.preventDefault();
    const payload = meterModal.data;
    if (!payload.title.trim()) {
      toast.error("Название счётчика обязательно");
      return;
    }
    setSubmitting(true);
    try {
      const body = { title: payload.title, code: payload.code, meterNumber: payload.meter_number };
      if (payload.id) {
        await homeApi.updateMeter(payload.id, body);
        toast.success("Счётчик обновлён");
      } else {
        await homeApi.createMeter(body);
        toast.success("Счётчик добавлен");
      }
      setMeterModal({ open: false, data: blankMeter });
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить счётчик");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeter = async (item) => {
    if (!window.confirm("Удалить счётчик и его историю?")) return false;
    try {
      await homeApi.deleteMeter(item.id);
      toast.success("Счётчик удалён");
      await loadData();
      return true;
    } catch (err) {
      toast.error(err.message || "Не удалось удалить счётчик");
      return false;
    }
  };

  const handleMeterModalDelete = async () => {
    if (!meterModal.data?.id) return;
    const success = await handleDeleteMeter(meterModal.data);
    if (success) {
      setMeterModal({ open: false, data: blankMeter });
    }
  };

  const handleSaveMeterSettings = async (e) => {
    e.preventDefault();
    const raw = (meterSettingsForm || "").toString().trim();
    let dueDay = null;
    if (raw) {
      const parsed = Number(raw);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) {
        toast.error("Укажите число от 1 до 31");
        return;
      }
      dueDay = parsed;
    }
    setMeterSettingsSaving(true);
    try {
      const data = await homeApi.saveMeterSettings({ due_day: dueDay });
      const settings = data.settings || null;
      setMeterSettings(settings);
      setMeterSettingsForm(settings?.due_day ? String(settings.due_day) : "");
      toast.success(dueDay ? "Дата сдачи обновлена" : "Дата сдачи сброшена");
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить дату сдачи");
    } finally {
      setMeterSettingsSaving(false);
    }
  };

  const openRecords = async (meter) => {
    setRecordsModal({ open: true, meter });
    setRecords([]);
    setRecordsLoading(true);
    try {
      const data = await homeApi.listMeterRecords(meter.id);
      setRecords(data.items || []);
    } catch (err) {
      toast.error(err.message || "Не удалось загрузить историю");
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!recordsModal.meter) return;
    const form = new FormData(e.target);
    const value = form.get("value");
    const date = form.get("date");
    if (!value) {
      toast.error("Укажите показание");
      return;
    }
    setSubmitting(true);
    try {
      await homeApi.createMeterRecord(recordsModal.meter.id, { value, date });
      toast.success("Показание добавлено");
      const data = await homeApi.listMeterRecords(recordsModal.meter.id);
      setRecords(data.items || []);
      await loadData();
      e.target.reset();
    } catch (err) {
      toast.error(err.message || "Не удалось добавить показание");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm("Удалить показание?")) return;
    try {
      await homeApi.deleteMeterRecord(record.id);
      toast.success("Показание удалено");
      if (recordsModal.meter) {
        const data = await homeApi.listMeterRecords(recordsModal.meter.id);
        setRecords(data.items || []);
      }
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось удалить показание");
    }
  };

  const meterCards = meters.map((meter) => {
    const last = meter.lastRecord;
    const consumption = last?.diff !== null && last?.diff !== undefined ? formatNumber(last.diff) : null;
    return (
      <motion.div
        layout
        key={meter.id}
        whileHover={{ y: -4 }}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm transition dark:border-slate-700/60 dark:bg-slate-900/70"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <IconButton
                onClick={() => setMeterModal({ open: true, data: { ...meter, meter_number: meter.meter_number || "" } })}
                ariaLabel="Редактировать счётчик"
              />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{meter.code || "счётчик"}</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{meter.title}</div>
              </div>
            </div>
            {meter.meter_number && <div className="text-xs text-slate-500 dark:text-slate-400">№ {meter.meter_number}</div>}
          </div>
          {last && (
            <div className="text-right text-sm text-slate-500 dark:text-slate-400">
              <div className="font-semibold text-slate-900 dark:text-slate-100">{formatNumber(last?.value)}</div>
              <div>последнее</div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Последнее: <span className="font-semibold">{formatNumber(last?.value)}</span>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Дата: <span className="font-semibold">{formatDate(last?.reading_date)}</span>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Расход: <span className="font-semibold">{consumption ?? "-"}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openRecords(meter)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 hover:bg-indigo-700 transition dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            История
          </button>
        </div>
      </motion.div>
    );
  });

  return (
    <PageShell title="Квартира" description="Управляющая компания, важные телефоны, камеры и счётчики" contentClassName="bg-transparent">
      {loading ? (
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
          Загружаем данные...
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <motion.div
              layout
              className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-sm ring-1 ring-blue-500/5 dark:border-slate-700/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Управляющая компания</p>
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{company?.name || "—"}</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={openCompanyEditor}
                    className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 hover:bg-indigo-700 transition dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  >
                    Редактировать
                  </button>
                </div>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoCell label="Телефон" value={company?.phone} isPhone />
                <InfoCell label="Аварийный" value={company?.emergency_phone} isPhone />
                <InfoCell label="Почта" value={company?.email} />
                <InfoCell label="График" value={company?.work_hours} />
                <InfoCell label="Лицевой счёт" value={company?.account_number} />
                <InfoCell label="Адрес офиса" value={company?.office_address} />
              </dl>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-sm text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-200">
                {company?.comments || "Комментарии не добавлены"}
              </div>
              <div className="flex flex-wrap gap-2">
                {company?.files?.length ? (
                  company.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      📄 {file.file_name || "Документ"}
                    </a>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400">Нет приложенных файлов</div>
                )}
              </div>
            </motion.div>

            <motion.div
              layout
              className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/50 dark:border-slate-700/60 dark:bg-slate-900/70"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Телефоны</p>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Важные контакты</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setContactModal({ open: true, data: blankContact })}
                  className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  Добавить
                </button>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                {contacts.length === 0 && <div className="py-4 text-sm text-slate-500 dark:text-slate-400">Контактов пока нет</div>}
                {contacts.map((item) => (
                  <div key={item.id} className="flex flex-col gap-1 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <IconButton
                          onClick={() => setContactModal({ open: true, data: { ...item, phone: formatPhoneInputValue(item.phone) } })}
                          ariaLabel="Редактировать контакт"
                        />
                        <span>{item.title}</span>
                      </div>
                      <PhoneActionText value={item.phone} className="text-sm text-slate-900 dark:text-slate-100 text-right" />
                    </div>
                    {item.comments && <div className="text-xs text-slate-500 dark:text-slate-400">{item.comments}</div>}
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <motion.div
              layout
              className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/50 dark:border-slate-700/60 dark:bg-slate-900/70"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Счётчики</p>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Вода и учёт</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMeterModal({ open: true, data: blankMeter })}
                  className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  Новый
                </button>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm dark:border-slate-700/60 dark:bg-slate-800/60">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Срок сдачи показаний</p>
                    {meterDeadlineInfo.dueDay ? (
                      <>
                        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          До {meterDeadlineInfo.dueDay}-го числа каждого месяца
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            meterDeadlineInfo.isOverdue ? "text-rose-500 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {meterDeadlineInfo.daysLeft === 0
                            ? meterDeadlineInfo.isOverdue
                              ? "Срок в этом месяце пропущен"
                              : "Нужно передать сегодня"
                            : meterDeadlineInfo.isOverdue
                            ? `Следующий срок через ${meterDeadlineInfo.daysLeft} дн.`
                            : `Осталось ${meterDeadlineInfo.daysLeft} дн.`}
                        </p>
                      </>
                    ) : (
                      <p className="text-base text-slate-600 dark:text-slate-300">
                        Укажите день месяца, чтобы следить за сдачей показаний.
                      </p>
                    )}
                  </div>
                  <form className="flex flex-wrap items-end gap-3" onSubmit={handleSaveMeterSettings}>
                    <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <span>День месяца</span>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={meterSettingsForm}
                        onChange={(e) => setMeterSettingsForm(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                        placeholder="20"
                        className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <span className="text-[10px] font-normal normal-case text-slate-400 dark:text-slate-500">
                        Оставьте поле пустым для сброса
                      </span>
                    </label>
                    <button
                      type="submit"
                      disabled={meterSettingsSaving}
                      className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                      {meterSettingsSaving ? "Сохраняем..." : "Сохранить"}
                    </button>
                  </form>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">{meterCards}</div>
            </motion.div>

            <motion.div
              layout
              className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/50 dark:border-slate-700/60 dark:bg-slate-900/70"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Камеры</p>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Двор и подъезд</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCameraModal({ open: true, data: blankCamera })}
                  className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  Добавить
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {cameras.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">Камеры не добавлены</div>}
                {cameras.map((cam) => (
                  <div
                    key={cam.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cam.title}</div>
                      <div className="break-all text-xs text-slate-500 dark:text-slate-400">{cam.url}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {cam.username && <span>Логин: {cam.username} </span>}
                        {cam.password && <span>Пароль: {cam.password}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {cam.url && (
                        <a
                          href={cam.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow transition hover:-translate-y-0.5 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                        >
                          Открыть камеру
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setCameraModal({ open: true, data: { ...cam } })}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-100"
                      >
                        Править
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCamera(cam)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 dark:border-rose-700/60 dark:text-rose-300 dark:hover:bg-rose-900/40"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        </div>
      )}

      <Modal open={companyModalOpen} onClose={() => setCompanyModalOpen(false)} title="Управляющая компания" maxWidth="max-w-4xl">
        <form className="space-y-4" onSubmit={handleSaveCompany}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Название" value={companyForm.name} onChange={(v) => setCompanyForm((prev) => ({ ...prev, name: v }))} required />
            <PhoneInput label="Телефон" value={companyForm.phone} onChange={(v) => setCompanyForm((prev) => ({ ...prev, phone: v }))} />
            <PhoneInput
              label="Аварийный телефон"
              value={companyForm.emergency_phone}
              onChange={(v) => setCompanyForm((prev) => ({ ...prev, emergency_phone: v }))}
            />
            <Input label="Почта" value={companyForm.email} onChange={(v) => setCompanyForm((prev) => ({ ...prev, email: v }))} />
            <Input label="График работы" value={companyForm.work_hours} onChange={(v) => setCompanyForm((prev) => ({ ...prev, work_hours: v }))} />
            <Input
              label="Лицевой счёт"
              value={companyForm.account_number}
              onChange={(v) => setCompanyForm((prev) => ({ ...prev, account_number: v }))}
            />
            <Input
              label="Адрес офиса"
              value={companyForm.office_address}
              onChange={(v) => setCompanyForm((prev) => ({ ...prev, office_address: v }))}
            />
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Комментарии</span>
            <textarea
              rows={3}
              value={companyForm.comments}
              onChange={(e) => setCompanyForm((prev) => ({ ...prev, comments: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Файлы</div>
            <div className="flex flex-wrap gap-2">
              {company?.files?.length ? (
                company.files.map((file) => {
                  const marked = removeFileIds.includes(file.id);
                  return (
                    <button
                      type="button"
                      key={file.id}
                      onClick={() =>
                        setRemoveFileIds((prev) => (marked ? prev.filter((id) => id !== file.id) : [...prev, file.id]))
                      }
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        marked
                          ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-700/60 dark:bg-rose-900/40 dark:text-rose-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      }`}
                    >
                      {marked ? "Убрать" : "Оставить"} · {file.file_name || "Документ"}
                    </button>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400">Нет файлов</div>
              )}
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Прикрепить новые файлы</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
                multiple
                onChange={(e) => setNewCompanyFiles(Array.from(e.target.files || []))}
                className="text-sm text-slate-700 dark:text-slate-200"
              />
              {newCompanyFiles.length > 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400">{newCompanyFiles.length} файл(ов) будет загружено</div>
              )}
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCompanyModalOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {submitting ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={contactModal.open} onClose={() => setContactModal({ open: false, data: blankContact })} title="Контакт" maxWidth="max-w-md">
        <form className="space-y-4" onSubmit={handleSaveContact}>
          <Input
            label="Название"
            value={contactModal.data.title}
            onChange={(v) => setContactModal((prev) => ({ ...prev, data: { ...prev.data, title: v } }))}
            required
          />
          <PhoneInput label="Телефон" value={contactModal.data.phone} onChange={(v) => setContactModal((prev) => ({ ...prev, data: { ...prev.data, phone: v } }))} />
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Комментарии</span>
            <textarea
              rows={3}
              value={contactModal.data.comments}
              onChange={(e) => setContactModal((prev) => ({ ...prev, data: { ...prev.data, comments: e.target.value } }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {contactModal.data.id && (
              <button
                type="button"
                onClick={handleContactModalDelete}
                className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 dark:border-rose-700/60 dark:text-rose-300 dark:hover:bg-rose-900/40"
              >
                Удалить
              </button>
            )}
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={() => setContactModal({ open: false, data: blankContact })}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {submitting ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal open={cameraModal.open} onClose={() => setCameraModal({ open: false, data: blankCamera })} title="Камера" maxWidth="max-w-md">
        <form className="space-y-4" onSubmit={handleSaveCamera}>
          <Input
            label="Название зоны"
            value={cameraModal.data.title}
            onChange={(v) => setCameraModal((prev) => ({ ...prev, data: { ...prev.data, title: v } }))}
            required
          />
          <Input
            label="URL просмотра"
            value={cameraModal.data.url}
            onChange={(v) => setCameraModal((prev) => ({ ...prev, data: { ...prev.data, url: v } }))}
            placeholder="https://..."
          />
          <Input
            label="Логин"
            value={cameraModal.data.username}
            onChange={(v) => setCameraModal((prev) => ({ ...prev, data: { ...prev.data, username: v } }))}
          />
          <Input
            label="Пароль"
            value={cameraModal.data.password}
            onChange={(v) => setCameraModal((prev) => ({ ...prev, data: { ...prev.data, password: v } }))}
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCameraModal({ open: false, data: blankCamera })}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {submitting ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={meterModal.open} onClose={() => setMeterModal({ open: false, data: blankMeter })} title="Счётчик" maxWidth="max-w-md">
        <form className="space-y-4" onSubmit={handleSaveMeter}>
          <Input
            label="Название"
            value={meterModal.data.title}
            onChange={(v) => setMeterModal((prev) => ({ ...prev, data: { ...prev.data, title: v } }))}
            required
          />
          <Input
            label="Код (hvs1, gvs2...)"
            value={meterModal.data.code || ""}
            onChange={(v) => setMeterModal((prev) => ({ ...prev, data: { ...prev.data, code: v } }))}
            placeholder="hvs1"
          />
          <Input
            label="Номер счётчика"
            value={meterModal.data.meter_number || ""}
            onChange={(v) => setMeterModal((prev) => ({ ...prev, data: { ...prev.data, meter_number: v } }))}
            placeholder="серийный номер"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {meterModal.data.id && (
              <button
                type="button"
                onClick={handleMeterModalDelete}
                className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 dark:border-rose-700/60 dark:text-rose-300 dark:hover:bg-rose-900/40"
              >
                Удалить счётчик
              </button>
            )}
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={() => setMeterModal({ open: false, data: blankMeter })}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {submitting ? "Сохраняем..." : "Сохранить"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={recordsModal.open}
        onClose={() => {
          setRecordsModal({ open: false, meter: null });
          setRecords([]);
        }}
        title={recordsModal.meter ? `История · ${recordsModal.meter.title}` : "История"}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <form className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end" onSubmit={handleAddRecord}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Дата</span>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Показание</span>
                <input
                  type="number"
                  step="0.001"
                  name="value"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  required
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting || !recordsModal.meter}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Добавить
            </button>
          </form>

          {recordsLoading ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">Загружаем историю...</div>
          ) : records.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">Показаний пока нет</div>
          ) : (
            <div className="space-y-2">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatNumber(rec.value)}</span>
                    <span className="text-slate-500 dark:text-slate-400">{formatDate(rec.reading_date)}</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                      Δ {rec.diff !== null && rec.diff !== undefined ? formatNumber(rec.diff) : "-"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRecord(rec)}
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 dark:border-rose-700/60 dark:text-rose-300 dark:hover:bg-rose-900/40"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </PageShell>
  );
}

function Input({ label, value, onChange, placeholder = "", required = false }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-slate-800 dark:text-slate-100">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </label>
  );
}

function PhoneInput({ label, value, onChange, required = false, placeholder = PHONE_PLACEHOLDER }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-slate-800 dark:text-slate-100">{label}</span>
      <IMaskInput
        mask="+7 (000) 000-00-00"
        lazy
        overwrite
        autofix
        value={value || ""}
        inputMode="tel"
        placeholder={placeholder}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        onAccept={(val) => {
          onChange?.(val || "");
        }}
        required={required}
      />
    </label>
  );
}

function PhoneActionText({ value, className = "", showHint = false }) {
  const formattedValue = formatPhoneDisplay(value);

  const handleClick = () => {
    if (!formattedValue) return;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(formattedValue)
        .then(() => toast.success("Номер скопирован"))
        .catch(() => {});
    }
    const telHref = buildTelHref(value);
    if (telHref && typeof window !== "undefined") {
      window.location.href = telHref;
    }
  };

  if (!formattedValue) {
    return <span className={`text-slate-500 dark:text-slate-400 ${className}`}>—</span>;
  }

  const buttonClasses = [
    "font-semibold text-slate-900 dark:text-slate-100",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition",
    showHint ? "group flex flex-col items-start text-left gap-0.5" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" onClick={handleClick} className={buttonClasses} title="Скопировать номер или позвонить">
      <span>{formattedValue}</span>
      {showHint && (
        <span className="text-[11px] font-medium text-indigo-600/80 opacity-0 transition group-hover:opacity-100 dark:text-indigo-300/90">
          Нажмите, чтобы скопировать или позвонить
        </span>
      )}
    </button>
  );
}

function IconButton({ onClick, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-200 p-1.5 text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-300"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <FiEdit2 className="h-4 w-4" />
    </button>
  );
}

function InfoCell({ label, value, isPhone = false }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-sm dark:border-slate-700/60 dark:bg-slate-800/70">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      {isPhone ? (
        <PhoneActionText
          value={value}
          className="flex flex-col items-start text-left text-slate-900 dark:text-slate-100"
          showHint
        />
      ) : (
        <span className="text-slate-900 dark:text-slate-100">{value || "—"}</span>
      )}
    </div>
  );
}
