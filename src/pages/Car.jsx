import React from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import PageShell from "../components/PageShell.jsx";
import Modal from "../components/Modal.jsx";
import { carApi } from "../api/car.js";

const numberFormatter = new Intl.NumberFormat("ru-RU");

const formatNumber = (value, suffix = "") => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${numberFormatter.format(value)}${suffix}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU");
};

const blankInsurance = (type = "osago") => ({
  id: null,
  type,
  company: "",
  policyNumber: "",
  startDate: "",
  endDate: "",
  phone: "",
  notes: "",
  pdfFile: null,
  pdfUrl: "",
  removePdf: false,
});

const blankPlan = { id: null, title: "", intervalKm: "", intervalMonths: "", comments: "" };
const blankRecord = { id: null, serviceDate: "", mileage: "", description: "", cost: "", comments: "", planId: "" };
export default function CarPage() {
  const [loading, setLoading] = React.useState(true);
  const [info, setInfo] = React.useState(null);
  const [lastMileage, setLastMileage] = React.useState(null);
  const [mileageStats, setMileageStats] = React.useState({ avgPerMonth: 0, avgPerYear: 0, last: null });
  const [insurances, setInsurances] = React.useState([]);
  const [alarm, setAlarm] = React.useState(null);
  const [servicePlans, setServicePlans] = React.useState([]);
  const [serviceRecords, setServiceRecords] = React.useState([]);
  const [mileageEntries, setMileageEntries] = React.useState([]);

  const [infoModalOpen, setInfoModalOpen] = React.useState(false);
  const [infoForm, setInfoForm] = React.useState({ name: "", file: null, removeImage: false });

  const [insuranceModal, setInsuranceModal] = React.useState({ open: false, data: blankInsurance() });
  const [planModal, setPlanModal] = React.useState({ open: false, data: blankPlan });
  const [recordModal, setRecordModal] = React.useState({ open: false, data: blankRecord });
  const [alarmModalOpen, setAlarmModalOpen] = React.useState(false);
  const [alarmForm, setAlarmForm] = React.useState({ vendor: "", pinCode: "", contractNumber: "", supportPhones: "", notes: "" });
  const [mileageModalOpen, setMileageModalOpen] = React.useState(false);
  const [mileageForm, setMileageForm] = React.useState({ date: "", value: "" });

  const [submitting, setSubmitting] = React.useState(false);

  const osago = React.useMemo(() => insurances.find((item) => item.type === "osago") || null, [insurances]);
  const kasko = React.useMemo(() => insurances.find((item) => item.type === "kasko") || null, [insurances]);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [overview, insuranceData, alarmData, planData, recordData, mileageData] = await Promise.all([
        carApi.getOverview(),
        carApi.listInsurance(),
        carApi.getAlarm(),
        carApi.listServicePlan(),
        carApi.listServiceRecords(),
        carApi.listMileage(),
      ]);
      setInfo(overview.info);
      const last = overview.lastMileage || overview.mileageStats?.last || mileageData.stats?.last || null;
      setLastMileage(last);
      setMileageStats(overview.mileageStats || mileageData.stats || { avgPerMonth: 0, avgPerYear: 0, last: null });
      setInsurances(insuranceData.items || []);
      setAlarm(alarmData.alarm || null);
      setServicePlans(planData.items || []);
      setServiceRecords(recordData.items || []);
      setMileageEntries(mileageData.items || []);
      if (overview.info) {
        setInfoForm((prev) => ({ ...prev, name: overview.info.name || prev.name }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const heroMileage = lastMileage || mileageStats.last;
  const lastService = serviceRecords?.length ? serviceRecords[0] : null;

  const openInsurance = (type, existing = null) => {
    const payload = existing
      ? {
          id: existing.id,
          type: existing.type,
          company: existing.company || "",
          policyNumber: existing.policy_number || "",
          startDate: existing.start_date || "",
          endDate: existing.end_date || "",
          phone: existing.phone || "",
          notes: existing.notes || "",
          pdfUrl: existing.pdf_url || "",
          pdfFile: null,
          removePdf: false,
        }
      : blankInsurance(type);
    setInsuranceModal({ open: true, data: payload });
  };

  const openPlanModal = (plan = null) => {
    const payload = plan
      ? {
          id: plan.id,
          title: plan.title || "",
          intervalKm: plan.interval_km ?? "",
          intervalMonths: plan.interval_months ?? "",
          comments: plan.comments || "",
        }
      : blankPlan;
    setPlanModal({ open: true, data: payload });
  };

  const openRecordModal = (record = null) => {
    const payload = record
      ? {
          id: record.id,
          serviceDate: record.service_date || "",
          mileage: record.mileage ?? "",
          description: record.description || "",
          cost: record.cost ?? "",
          comments: record.comments || "",
          planId: record.plan_id || "",
        }
      : { ...blankRecord, serviceDate: new Date().toISOString().slice(0, 10), mileage: heroMileage?.value_km || "" };
    setRecordModal({ open: true, data: payload });
  };

  const openInfoModal = () => {
    setInfoForm({ name: info?.name || "Changan UNI V", file: null, removeImage: false });
    setInfoModalOpen(true);
  };

  const openAlarm = () => {
    setAlarmForm({
      vendor: alarm?.vendor || "",
      pinCode: alarm?.pin_code || "",
      contractNumber: alarm?.contract_number || "",
      supportPhones: (alarm?.support_phones || []).join("\n"),
      notes: alarm?.notes || "",
    });
    setAlarmModalOpen(true);
  };

  const openMileageModal = () => {
    const baseMileage = heroMileage?.value_km || 0;
    setMileageForm({ date: new Date().toISOString().slice(0, 10), value: baseMileage ? baseMileage + 100 : "" });
    setMileageModalOpen(true);
  };
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("name", infoForm.name || "Changan UNI V");
      if (infoForm.file) fd.set("image", infoForm.file);
      if (infoForm.removeImage) fd.set("removeImage", "true");
      const data = await carApi.updateCarInfo(fd);
      if (data?.info) setInfo(data.info);
      toast.success("Карточка авто обновлена");
      setInfoModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Не удалось обновить автомобиль");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveInsurance = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...insuranceModal.data };
      const fd = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (["id", "pdfFile"].includes(key)) return;
        if (value !== undefined && value !== null && value !== "") {
          fd.append(key, value);
        }
      });
      if (payload.pdfFile) fd.append("file", payload.pdfFile);
      if (payload.removePdf) fd.append("removePdf", "true");
      if (payload.id) {
        await carApi.updateInsurance(payload.id, fd);
        toast.success("Страховка обновлена");
      } else {
        await carApi.createInsurance(fd);
        toast.success("Страховка добавлена");
      }
      setInsuranceModal({ open: false, data: blankInsurance(payload.type) });
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить страховку");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInsurance = async (item) => {
    const sure = window.confirm("Удалить страховку?");
    if (!sure) return;
    try {
      await carApi.deleteInsurance(item.id);
      toast.success("Страховка удалена");
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось удалить страховку");
    }
  };

  const handleSaveAlarm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await carApi.saveAlarm({
        vendor: alarmForm.vendor,
        pinCode: alarmForm.pinCode,
        contractNumber: alarmForm.contractNumber,
        supportPhones: alarmForm.supportPhones,
        notes: alarmForm.notes,
      });
      toast.success("Сигнализация обновлена");
      setAlarmModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить сигнализацию");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = planModal.data;
      if (payload.id) {
        await carApi.updateServicePlan(payload.id, {
          title: payload.title,
          intervalKm: payload.intervalKm,
          intervalMonths: payload.intervalMonths,
          comments: payload.comments,
        });
        toast.success("Операция ТО обновлена");
      } else {
        await carApi.createServicePlan({
          title: payload.title,
          intervalKm: payload.intervalKm,
          intervalMonths: payload.intervalMonths,
          comments: payload.comments,
        });
        toast.success("Операция ТО добавлена");
      }
      setPlanModal({ open: false, data: blankPlan });
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить план ТО");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (plan) => {
    if (!window.confirm("Удалить операцию из плана ТО?")) return;
    try {
      await carApi.deleteServicePlan(plan.id);
      toast.success("Операция удалена");
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось удалить операцию");
    }
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = recordModal.data;
      const body = {
        serviceDate: payload.serviceDate,
        mileage: payload.mileage,
        description: payload.description,
        cost: payload.cost,
        comments: payload.comments,
        planId: payload.planId || null,
      };
      if (payload.id) {
        await carApi.updateServiceRecord(payload.id, body);
        toast.success("Запись ТО обновлена");
      } else {
        await carApi.createServiceRecord(body);
        toast.success("Запись ТО добавлена");
      }
      setRecordModal({ open: false, data: blankRecord });
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить запись ТО");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecord = async (record) => {
    if (!window.confirm("Удалить запись ТО?")) return;
    try {
      await carApi.deleteServiceRecord(record.id);
      toast.success("Запись удалена");
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось удалить запись");
    }
  };

  const handleSaveMileage = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await carApi.createMileage({ date: mileageForm.date, value: mileageForm.value });
      toast.success("Пробег обновлен");
      setMileageModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить пробег");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMileage = async (entry) => {
    if (!window.confirm("Удалить запись пробега?")) return;
    try {
      await carApi.deleteMileage(entry.id);
      toast.success("Пробег удален");
      await loadData();
    } catch (err) {
      toast.error(err.message || "Не удалось удалить пробег");
    }
  };

  const mileageAverageCards = [
    { label: "Средний пробег/мес", value: formatNumber(mileageStats?.avgPerMonth, " км") },
    { label: "Средний пробег/год", value: formatNumber(mileageStats?.avgPerYear, " км") },
  ];

  const renderInsuranceCard = (title, type, data) => {
    const hasData = Boolean(data);
    const expires = data?.end_date ? `до ${formatDate(data.end_date)}` : "срок не указан";
    return (
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{expires}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openInsurance(type, data)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {hasData ? "Редактировать" : "Добавить"}
            </button>
            {hasData && (
              <button
                onClick={() => handleDeleteInsurance(data)}
                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 dark:border-rose-700/60 dark:text-rose-300 dark:hover:bg-rose-900/40"
              >
                Удалить
              </button>
            )}
          </div>
        </div>
        {hasData ? (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <InfoRow label="Страховая" value={data.company} />
            <InfoRow label="Полис" value={data.policy_number} />
            <InfoRow label="Начало" value={formatDate(data.start_date)} />
            <InfoRow label="Окончание" value={formatDate(data.end_date)} />
            <InfoRow label="Телефон" value={data.phone} />
            <InfoRow
              label="Полис (PDF)"
              value={
                data.pdf_url ? (
                  <a
                    href={data.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                  >
                    Открыть
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <InfoRow label="Примечания" value={data.notes || "—"} className="sm:col-span-2" />
          </dl>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Нет данных. Добавьте полис, чтобы видеть детали и файл.</p>
        )}
      </div>
    );
  };
  return (
    <PageShell title="Автомобиль" contentClassName="bg-transparent">
      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60">
            Загружаем карточку автомобиля...
          </div>
        ) : (
          <>
            <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-6 shadow-lg ring-1 ring-blue-500/5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-400/10" />
                <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-400/10" />
                <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex w-full max-w-[440px] flex-shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60">
                      <div className="w-full max-w-[440px]">
                        {info?.image_url ? (
                          <img
                            src={info.image_url}
                            alt={info?.name || "Автомобиль"}
                            className="h-auto w-full max-h-[260px] object-contain"
                          />
                        ) : (
                          <div className="flex aspect-[1.8/1] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-4xl text-slate-400 dark:from-slate-800 dark:to-slate-900">
                            🚗
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Единственный авто</p>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{info?.name || "Changan UNI V"}</h1>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <StatChip
                          label="Последний пробег"
                          value={heroMileage ? formatNumber(heroMileage.value_km, " км") : "—"}
                          hint={heroMileage?.mileage_date ? formatDate(heroMileage.mileage_date) : ""}
                          className="min-w-[150px] flex-1 sm:flex-none"
                        />
                        <StatChip
                          label="Последнее ТО"
                          value={lastService ? `${formatDate(lastService.service_date)} · ${formatNumber(lastService.mileage, " км")}` : "—"}
                          hint={lastService?.description || ""}
                          className="min-w-[150px] flex-1 sm:flex-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-col sm:items-end lg:w-[200px]">
                    <button
                      onClick={openInfoModal}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-auto"
                    >
                      <span>Обновить авто</span>
                    </button>
                    <button
                      onClick={openMileageModal}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 sm:w-auto"
                    >
                      Добавить пробег
                    </button>
                    <button
                      onClick={() => openRecordModal()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 sm:w-auto"
                    >
                      Новое ТО
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Пробег</div>
                    <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">{heroMileage ? formatNumber(heroMileage.value_km, " км") : "—"}</div>
                    {heroMileage?.mileage_date && <div className="text-xs text-slate-500 dark:text-slate-400">от {formatDate(heroMileage.mileage_date)}</div>}
                  </div>
                  <button
                    onClick={openMileageModal}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-100"
                  >
                    Обновить
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {mileageAverageCards.map((card) => (
                    <div key={card.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</div>
                      <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{card.value}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Последние записи</div>
                  <div className="flex flex-col gap-2">
                    {mileageEntries.slice(0, 4).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/60">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{formatNumber(entry.value_km, " км")}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{formatDate(entry.mileage_date)}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteMileage(entry)}
                          className="text-xs font-semibold text-rose-500 transition hover:text-rose-600 dark:text-rose-300"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                    {mileageEntries.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">Нет данных о пробеге. Добавьте первую запись.</div>}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Страховки</div>
                    <div className="text-base text-slate-600 dark:text-slate-400">ОСАГО и КАСКО рядом</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openInsurance("osago", osago)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-100"
                    >
                      ОСАГО
                    </button>
                    <button
                      onClick={() => openInsurance("kasko", kasko)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-100"
                    >
                      КАСКО
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {renderInsuranceCard("ОСАГО", "osago", osago)}
                  {renderInsuranceCard("КАСКО", "kasko", kasko)}
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Сигнализация</div>
                    <div className="text-base text-slate-600 dark:text-slate-400">PIN, договор и телефоны</div>
                  </div>
                  <button
                    onClick={openAlarm}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-100"
                  >
                    Редактировать
                  </button>
                </div>
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  <InfoRow label="Поставщик" value={alarm?.vendor} />
                  <InfoRow label="PIN-код" value={alarm?.pin_code} />
                  <InfoRow label="Договор" value={alarm?.contract_number} />
                  <InfoRow label="Телефоны" value={(alarm?.support_phones || []).join(", ")} />
                  <InfoRow label="Примечания" value={alarm?.notes || "—"} />
                </dl>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">План ТО</div>
                    <div className="text-base text-slate-600 dark:text-slate-400">Интервалы по километрам и времени</div>
                  </div>
                  <button
                    onClick={() => openPlanModal()}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                  >
                    Добавить операцию
                  </button>
                </div>
                {servicePlans.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">План ТО пуст. Добавьте операции.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {servicePlans.map((plan) => {
                      const kmLeft = plan.computed?.kmToNext;
                      const daysLeft = plan.computed?.daysLeft;
                      const status = kmLeft === null ? "Нет данных" : kmLeft <= 0 ? "Требуется сейчас" : `Через ${formatNumber(kmLeft, " км")}`;
                      return (
                        <motion.div key={plan.id} whileHover={{ y: -4 }} className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/70">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{plan.title}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {plan.interval_km ? `${formatNumber(plan.interval_km, " км")}` : "—"} · {plan.interval_months ? `${plan.interval_months} мес.` : "—"}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openPlanModal(plan)}
                                className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-100"
                              >
                                Править
                              </button>
                              <button
                                onClick={() => handleDeletePlan(plan)}
                                className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 dark:border-rose-700/60 dark:text-rose-300 dark:hover:bg-rose-900/40"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-sm shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Статус</div>
                            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{status}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {plan.computed?.nextMileage ? `Следующее: ${formatNumber(plan.computed.nextMileage, " км")}` : "Нет расчета по пробегу"}
                              {plan.computed?.nextDate ? ` · до ${formatDate(plan.computed.nextDate)}` : ""}
                              {daysLeft !== null && daysLeft !== undefined ? ` · осталось ${daysLeft} дн.` : ""}
                            </div>
                            {plan.computed?.lastServiceDate && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Последний раз: {formatDate(plan.computed.lastServiceDate)} / {formatNumber(plan.computed.lastServiceMileage, " км")}
                              </div>
                            )}
                          </div>
                          {plan.comments && (
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Комментарий: </span>
                              {plan.comments}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">История ТО</div>
                    <div className="text-base text-slate-600 dark:text-slate-400">Вертикальная лента последних работ</div>
                  </div>
                  <button
                    onClick={() => openRecordModal()}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-100"
                  >
                    Добавить запись
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent dark:from-slate-700 dark:via-slate-700" />
                  <div className="flex flex-col gap-4">
                    {serviceRecords.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">Пока нет записей ТО.</div>}
                    {serviceRecords.slice(0, 10).map((record) => (
                      <div key={record.id} className="relative pl-8">
                        <div className="absolute left-1 top-2 h-3 w-3 rounded-full border border-blue-200 bg-blue-500 shadow-sm dark:border-blue-700 dark:bg-blue-400" />
                        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/70">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(record.service_date)} · {formatNumber(record.mileage, " км")}</div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openRecordModal(record)}
                                className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:text-slate-100"
                              >
                                Править
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(record)}
                                className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 dark:border-rose-700/60 dark:text-rose-300 dark:hover:bg-rose-900/40"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-300">{record.description || "Без описания"}</div>
                          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {record.plan_title ? `План: ${record.plan_title}` : "Без привязки к плану"}
                            {record.cost ? ` · ${formatNumber(record.cost, " ₽")}` : ""}
                          </div>
                          {record.comments && <div className="text-xs text-slate-500 dark:text-slate-400">Комментарий: {record.comments}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
      <Modal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} title="Обновление автомобиля" maxWidth="max-w-3xl">
        <form className="space-y-4" onSubmit={handleSaveInfo}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Название</span>
              <input
                value={infoForm.name}
                onChange={(e) => setInfoForm((prev) => ({ ...prev, name: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Changan UNI V"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Фото (PNG)</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setInfoForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {info?.image_url && (
                <label className="mt-1 inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={infoForm.removeImage} onChange={(e) => setInfoForm((prev) => ({ ...prev, removeImage: e.target.checked }))} />
                  Удалить текущее фото
                </label>
              )}
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setInfoModalOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {submitting ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={insuranceModal.open}
        onClose={() => setInsuranceModal({ open: false, data: blankInsurance() })}
        title={`${insuranceModal.data.type === "kasko" ? "КАСКО" : "ОСАГО"} — страховка`}
        maxWidth="max-w-3xl"
      >
        <form className="space-y-4" onSubmit={handleSaveInsurance}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Тип</span>
              <select
                value={insuranceModal.data.type}
                onChange={(e) => setInsuranceModal((prev) => ({ ...prev, data: { ...prev.data, type: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="osago">ОСАГО</option>
                <option value="kasko">КАСКО</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Страховая компания</span>
              <input
                value={insuranceModal.data.company}
                onChange={(e) => setInsuranceModal((prev) => ({ ...prev, data: { ...prev.data, company: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Номер полиса</span>
              <input
                value={insuranceModal.data.policyNumber}
                onChange={(e) => setInsuranceModal((prev) => ({ ...prev, data: { ...prev.data, policyNumber: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Телефон страховой</span>
              <input
                value={insuranceModal.data.phone}
                onChange={(e) => setInsuranceModal((prev) => ({ ...prev, data: { ...prev.data, phone: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Дата начала</span>
              <input
                type="date"
                value={insuranceModal.data.startDate || ""}
                onChange={(e) => setInsuranceModal((prev) => ({ ...prev, data: { ...prev.data, startDate: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Дата окончания</span>
              <input
                type="date"
                value={insuranceModal.data.endDate || ""}
                onChange={(e) => setInsuranceModal((prev) => ({ ...prev, data: { ...prev.data, endDate: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Примечания</span>
            <textarea
              value={insuranceModal.data.notes}
              onChange={(e) => setInsuranceModal((prev) => ({ ...prev, data: { ...prev.data, notes: e.target.value } }))}
              rows={3}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">PDF полиса</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setInsuranceModal((prev) => ({ ...prev, data: { ...prev.data, pdfFile: e.target.files?.[0] || null } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {insuranceModal.data.pdfUrl && (
                <a href={insuranceModal.data.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline-offset-2 hover:underline dark:text-blue-400">
                  Открыть текущий PDF
                </a>
              )}
              {(insuranceModal.data.pdfUrl || insuranceModal.data.pdfFile) && (
                <label className="mt-1 inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={insuranceModal.data.removePdf} onChange={(e) => setInsuranceModal((prev) => ({ ...prev, data: { ...prev.data, removePdf: e.target.checked } }))} />
                  Удалить вложение
                </label>
              )}
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setInsuranceModal({ open: false, data: blankInsurance() })}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {submitting ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={alarmModalOpen} onClose={() => setAlarmModalOpen(false)} title="Сигнализация" maxWidth="max-w-2xl">
        <form className="space-y-4" onSubmit={handleSaveAlarm}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Поставщик/марка</span>
              <input
                value={alarmForm.vendor}
                onChange={(e) => setAlarmForm((prev) => ({ ...prev, vendor: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">PIN-код</span>
              <input
                value={alarmForm.pinCode}
                onChange={(e) => setAlarmForm((prev) => ({ ...prev, pinCode: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Номер договора</span>
              <input
                value={alarmForm.contractNumber}
                onChange={(e) => setAlarmForm((prev) => ({ ...prev, contractNumber: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Телефоны техподдержки</span>
              <textarea
                rows={3}
                value={alarmForm.supportPhones}
                onChange={(e) => setAlarmForm((prev) => ({ ...prev, supportPhones: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="+7 ... (каждый с новой строки)"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Примечания</span>
            <textarea
              rows={3}
              value={alarmForm.notes}
              onChange={(e) => setAlarmForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAlarmModalOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {submitting ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={planModal.open} onClose={() => setPlanModal({ open: false, data: blankPlan })} title="План ТО" maxWidth="max-w-2xl">
        <form className="space-y-4" onSubmit={handleSavePlan}>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Название операции</span>
            <input
              value={planModal.data.title}
              onChange={(e) => setPlanModal((prev) => ({ ...prev, data: { ...prev.data, title: e.target.value } }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Интервал (км)</span>
              <input
                type="number"
                value={planModal.data.intervalKm}
                onChange={(e) => setPlanModal((prev) => ({ ...prev, data: { ...prev.data, intervalKm: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="10000"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Интервал (месяцы)</span>
              <input
                type="number"
                value={planModal.data.intervalMonths}
                onChange={(e) => setPlanModal((prev) => ({ ...prev, data: { ...prev.data, intervalMonths: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="12"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Комментарии</span>
            <textarea
              rows={3}
              value={planModal.data.comments}
              onChange={(e) => setPlanModal((prev) => ({ ...prev, data: { ...prev.data, comments: e.target.value } }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPlanModal({ open: false, data: blankPlan })}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {submitting ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={recordModal.open} onClose={() => setRecordModal({ open: false, data: blankRecord })} title="Запись в истории ТО" maxWidth="max-w-3xl">
        <form className="space-y-4" onSubmit={handleSaveRecord}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Дата</span>
              <input
                type="date"
                value={recordModal.data.serviceDate || ""}
                onChange={(e) => setRecordModal((prev) => ({ ...prev, data: { ...prev.data, serviceDate: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Пробег (км)</span>
              <input
                type="number"
                value={recordModal.data.mileage}
                onChange={(e) => setRecordModal((prev) => ({ ...prev, data: { ...prev.data, mileage: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Что делалось</span>
              <input
                value={recordModal.data.description}
                onChange={(e) => setRecordModal((prev) => ({ ...prev, data: { ...prev.data, description: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Замена масла"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Стоимость (опционально)</span>
              <input
                type="number"
                value={recordModal.data.cost}
                onChange={(e) => setRecordModal((prev) => ({ ...prev, data: { ...prev.data, cost: e.target.value } }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="15000"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Привязать к плану ТО</span>
            <select
              value={recordModal.data.planId || ""}
              onChange={(e) => setRecordModal((prev) => ({ ...prev, data: { ...prev.data, planId: e.target.value } }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Без привязки</option>
              {servicePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Комментарии</span>
            <textarea
              rows={3}
              value={recordModal.data.comments}
              onChange={(e) => setRecordModal((prev) => ({ ...prev, data: { ...prev.data, comments: e.target.value } }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRecordModal({ open: false, data: blankRecord })}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {submitting ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={mileageModalOpen} onClose={() => setMileageModalOpen(false)} title="Добавить пробег" maxWidth="max-w-md">
        <form className="space-y-4" onSubmit={handleSaveMileage}>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Дата</span>
            <input
              type="date"
              value={mileageForm.date}
              onChange={(e) => setMileageForm((prev) => ({ ...prev, date: e.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Пробег (км)</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={mileageForm.value}
                onChange={(e) => setMileageForm((prev) => ({ ...prev, value: e.target.value }))}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="43000"
                required
              />
              {[1, 10, 100].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => setMileageForm((prev) => ({ ...prev, value: Number(prev.value || heroMileage?.value_km || 0) + inc }))}
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  +{inc}
                </button>
              ))}
            </div>
            {heroMileage && <div className="text-xs text-slate-500 dark:text-slate-400">Текущий: {formatNumber(heroMileage.value_km, " км")} от {formatDate(heroMileage.mileage_date)}</div>}
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setMileageModalOpen(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-100"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {submitting ? "Сохраняем..." : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}

function StatChip({ label, value, hint, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70 ${className}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</div>
      {hint && <div className="text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
}

function InfoRow({ label, value, className = "" }) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-sm dark:border-slate-700/60 dark:bg-slate-800/70 ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-900 dark:text-slate-100">{value || "—"}</span>
    </div>
  );
}
