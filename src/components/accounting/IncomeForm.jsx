// encoding: utf-8
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const incomeSchema = z.object({
  source_name: z.string().min(1, "Название источника обязательно"),
  amount: z.string().min(1, "Сумма обязательна"),
  currency: z.string().min(1, "Валюта обязательна"),
  periodicity: z.enum(["monthly", "quarterly", "custom_ndays"]),
  n_days: z.string().optional(),
  next_date: z.string().min(1, "Дата обязательна"),
  is_active: z.boolean().optional(),
  income_category_id: z.string().optional(),
});

function normalize(values) {
  const payload = {
    source_name: values.source_name.trim(),
    amount: Number(values.amount),
    currency: values.currency.toUpperCase(),
    periodicity: values.periodicity,
    next_date: values.next_date,
    is_active: values.is_active ?? true,
    n_days:
      values.periodicity === "custom_ndays" && values.n_days
        ? Number(values.n_days)
        : undefined,
    income_category_id: values.income_category_id || undefined,
  };
  return payload;
}

export default function IncomeForm({ initial, categories = [], onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      source_name: initial?.source_name || "",
      amount: initial?.amount ?? "",
      currency: initial?.currency || "RUB",
      periodicity: initial?.periodicity || "monthly",
      n_days: initial?.n_days ?? "",
      next_date: initial?.next_date || "",
      is_active: initial?.is_active ?? true,
      income_category_id: initial?.income_category_id || "",
    },
  });

  React.useEffect(() => {
    reset({
      source_name: initial?.source_name || "",
      amount: initial?.amount ?? "",
      currency: initial?.currency || "RUB",
      periodicity: initial?.periodicity || "monthly",
      n_days: initial?.n_days ?? "",
      next_date: initial?.next_date || "",
      is_active: initial?.is_active ?? true,
      income_category_id: initial?.income_category_id || "",
    });
  }, [initial, reset]);

  const periodicity = watch("periodicity");

  const submit = async (values) => {
    await onSubmit?.(normalize(values));
    if (!initial) reset();
  };

  const incomeCategories = categories.filter((cat) => cat.type === "income");

  return (
    <form onSubmit={handleSubmit(submit)} className="grid gap-3 sm:grid-cols-2">
      <Field label="Источник" error={errors.source_name?.message}>
        <input type="text" {...register("source_name")} />
      </Field>
      <Field label="Сумма" error={errors.amount?.message}>
        <input type="number" step="0.01" {...register("amount")} />
      </Field>
      <Field label="Валюта" error={errors.currency?.message}>
        <input type="text" className="uppercase" {...register("currency")} />
      </Field>
      <Field label="Категория">
        <select {...register("income_category_id")}>
          <option value="">Без категории</option>
          {incomeCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Периодичность" error={errors.periodicity?.message}>
        <select {...register("periodicity")}>
          <option value="monthly">Ежемесячно</option>
          <option value="quarterly">Ежеквартально</option>
          <option value="custom_ndays">Через N дней</option>
        </select>
      </Field>
      {periodicity === "custom_ndays" && (
        <Field label="Через сколько дней" error={errors.n_days?.message}>
          <input type="number" {...register("n_days")} />
        </Field>
      )}
      <Field label="Следующая дата" error={errors.next_date?.message}>
        <input type="date" {...register("next_date")} />
      </Field>
      <label className="col-span-2 inline-flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-sm font-medium text-slate-600 dark:bg-slate-900/30 dark:text-slate-200">
        <input type="checkbox" {...register("is_active")} />
        Активный источник
      </label>
      <div className="col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {initial ? "Сохранить" : "Добавить"}
        </button>
        {initial && (
          <button type="button" onClick={onCancel} className="text-sm text-slate-500">
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      {React.cloneElement(children, {
        className:
          "rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-800 dark:text-white",
      })}
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </label>
  );
}
