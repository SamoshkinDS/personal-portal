// encoding: utf-8
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";

const TYPES = ["mortgage", "loan", "utilities", "parking_rent", "mobile", "subscription"];

const schema = z.object({
  title: z.string().min(1, "Укажите название"),
  type: z.enum(TYPES),
  is_active: z.boolean().optional(),
  amount: z.string().optional(),
  currency: z.string().optional(),
  renewal_date: z.string().optional(),
  billing_period: z.string().optional(),
  billing_day: z.string().optional(),
  day_of_month: z.string().optional(),
  start_date: z.string().optional(),
  principal_total: z.string().optional(),
  interest_rate_apy: z.string().optional(),
  term_months: z.string().optional(),
  account_currency: z.string().optional(),
  service_url: z.string().optional(),
  provider: z.string().optional(),
  last_amount: z.string().optional(),
  notes: z.string().optional(),
});

const TYPE_LABELS = {
  mortgage: "Ипотека",
  loan: "Кредит",
  utilities: "Коммунальные",
  parking_rent: "Аренда парковки",
  mobile: "Связь",
  subscription: "Подписка",
};

const BILLING_OPTIONS = [
  { value: "monthly", label: "Ежемесячно" },
  { value: "weekly", label: "Еженедельно" },
  { value: "yearly", label: "Ежегодно" },
  { value: "custom", label: "Своя" },
];

function toNumber(value) {
  if (value === "" || value === undefined || value === null) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalize(values) {
  const payload = {
    title: values.title.trim(),
    type: values.type,
    is_active: values.is_active ?? true,
    notes: values.notes || undefined,
    amount: toNumber(values.amount),
    currency: values.currency ? values.currency.toUpperCase() : undefined,
    renewal_date: values.renewal_date || undefined,
    billing_period: values.billing_period || undefined,
    billing_day: values.billing_day || undefined,
    day_of_month: values.day_of_month || undefined,
    start_date: values.start_date || undefined,
    principal_total: toNumber(values.principal_total),
    interest_rate_apy: toNumber(values.interest_rate_apy),
    term_months: toNumber(values.term_months),
    account_currency: values.account_currency ? values.account_currency.toUpperCase() : undefined,
    service_url: values.service_url || undefined,
    provider: values.provider || undefined,
    last_amount: toNumber(values.last_amount),
  };
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });
  return payload;
}

export default function PaymentsForm({ initial, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title || "",
      type: initial?.type || "subscription",
      is_active: initial?.is_active ?? true,
      amount: initial?.amount ?? "",
      currency: initial?.currency ?? "RUB",
      renewal_date: initial?.renewal_date || "",
      billing_period: initial?.billing_period || "monthly",
      billing_day: initial?.billing_day ?? "",
      day_of_month: initial?.day_of_month ?? "",
      start_date: initial?.start_date || "",
      principal_total: initial?.principal_total ?? "",
      interest_rate_apy: initial?.interest_rate_apy ?? "",
      term_months: initial?.term_months ?? "",
      account_currency: initial?.account_currency ?? "RUB",
      service_url: initial?.service_url || "",
      provider: initial?.provider || "",
      last_amount: initial?.last_amount ?? "",
      notes: initial?.notes || "",
    },
  });

  React.useEffect(() => {
    reset({
      title: initial?.title || "",
      type: initial?.type || "subscription",
      is_active: initial?.is_active ?? true,
      amount: initial?.amount ?? "",
      currency: initial?.currency ?? "RUB",
      renewal_date: initial?.renewal_date || "",
      billing_period: initial?.billing_period || "monthly",
      billing_day: initial?.billing_day ?? "",
      day_of_month: initial?.day_of_month ?? "",
      start_date: initial?.start_date || "",
      principal_total: initial?.principal_total ?? "",
      interest_rate_apy: initial?.interest_rate_apy ?? "",
      term_months: initial?.term_months ?? "",
      account_currency: initial?.account_currency ?? "RUB",
      service_url: initial?.service_url || "",
      provider: initial?.provider || "",
      last_amount: initial?.last_amount ?? "",
      notes: initial?.notes || "",
    });
  }, [initial, reset]);

  const type = watch("type");

  const submit = async (values) => {
    await onSubmit?.(normalize(values));
    if (!initial) reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Название" error={errors.title?.message}>
          <input type="text" {...register("title")} />
        </Field>
        <Field label="Тип" error={errors.type?.message}>
          <select {...register("type")}>
            {TYPES.map((value) => (
              <option key={value} value={value}>
                {TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        <input type="checkbox" {...register("is_active")} />
        Активный платёж
      </label>

      <LoanFields type={type} register={register} errors={errors} />
      <SubscriptionFields type={type} register={register} errors={errors} />
      <RecurringFields type={type} register={register} errors={errors} />
      <UtilitiesFields type={type} register={register} errors={errors} />

      <Field label="Заметки" error={errors.notes?.message}>
        <textarea rows={3} {...register("notes")} />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow hover:bg-indigo-500 disabled:opacity-60"
        >
          {initial ? "Сохранить" : "Добавить"}
        </button>
        {initial && (
          <button type="button" onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

function LoanFields({ type, register, errors }) {
  if (!["mortgage", "loan"].includes(type)) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Сумма кредита" error={errors.principal_total?.message}>
        <input type="number" step="0.01" {...register("principal_total")} />
      </Field>
      <Field label="Ставка, % годовых" error={errors.interest_rate_apy?.message}>
        <input type="number" step="0.01" {...register("interest_rate_apy")} />
      </Field>
      <Field label="Срок (мес.)" error={errors.term_months?.message}>
        <input type="number" {...register("term_months")} />
      </Field>
      <Field label="Дата начала" error={errors.start_date?.message}>
        <input type="date" {...register("start_date")} />
      </Field>
      <Field label="День платежа" error={errors.day_of_month?.message}>
        <input type="number" min="1" max="31" {...register("day_of_month")} />
      </Field>
      <Field label="Валюта счёта" error={errors.account_currency?.message}>
        <input type="text" className="uppercase" {...register("account_currency")} />
      </Field>
    </div>
  );
}

function SubscriptionFields({ type, register, errors }) {
  if (type !== "subscription") return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Сумма списания" error={errors.amount?.message}>
        <input type="number" step="0.01" {...register("amount")} />
      </Field>
      <Field label="Валюта" error={errors.currency?.message}>
        <input type="text" className="uppercase" {...register("currency")} />
      </Field>
      <Field label="Дата продления" error={errors.renewal_date?.message}>
        <input type="date" {...register("renewal_date")} />
      </Field>
      <Field label="Ссылка на сервис" error={errors.service_url?.message}>
        <input type="url" {...register("service_url")} />
      </Field>
    </div>
  );
}

function RecurringFields({ type, register, errors }) {
  if (!["subscription", "mobile", "parking_rent"].includes(type)) return null;
  const showFixedAmount = type !== "subscription";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Периодичность" error={errors.billing_period?.message}>
        <select {...register("billing_period")}>
          {BILLING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="День списания" error={errors.billing_day?.message}>
        <input type="number" min="1" max="31" {...register("billing_day")} />
      </Field>
      {showFixedAmount && (
        <>
          <Field label="Сумма платежа" error={errors.amount?.message}>
            <input type="number" step="0.01" {...register("amount")} />
          </Field>
          <Field label="Валюта" error={errors.currency?.message}>
            <input type="text" className="uppercase" {...register("currency")} />
          </Field>
        </>
      )}
    </div>
  );
}

function UtilitiesFields({ type, register, errors }) {
  if (type !== "utilities") return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Последняя сумма" error={errors.last_amount?.message}>
        <input type="number" step="0.01" {...register("last_amount")} />
      </Field>
      <Field label="Поставщик" error={errors.provider?.message}>
        <input type="text" {...register("provider")} />
      </Field>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      {React.cloneElement(children, {
        className: clsx(
          "rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-slate-800 dark:text-white",
          children.props.className
        ),
      })}
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  );
}
