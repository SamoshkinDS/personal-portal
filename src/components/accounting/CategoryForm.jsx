// encoding: utf-8
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(1, "Название обязательно"),
  type: z.enum(["expense", "income"]),
  color_hex: z.string().optional(),
  mcc_mask: z.string().optional(),
});

export default function CategoryForm({ initial, onSubmit, onCancel, disabled = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name || "",
      type: initial?.type || "expense",
      color_hex: initial?.color_hex || "#6366F1",
      mcc_mask: initial?.mcc_mask || "",
    },
  });

  React.useEffect(() => {
    reset({
      name: initial?.name || "",
      type: initial?.type || "expense",
      color_hex: initial?.color_hex || "#6366F1",
      mcc_mask: initial?.mcc_mask || "",
    });
  }, [initial, reset]);

  const submit = async (values) => {
    await onSubmit?.(values);
    if (!initial) reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3 text-sm">
      <Field label="Название" error={errors.name?.message}>
        <input type="text" disabled={disabled} {...register("name")} />
      </Field>
      <Field label="Тип" error={errors.type?.message}>
        <select disabled={disabled || initial?.is_system} {...register("type")}>
          <option value="expense">Расход</option>
          <option value="income">Доход</option>
        </select>
      </Field>
      <Field label="Цвет" error={errors.color_hex?.message}>
        <input type="color" {...register("color_hex")} />
      </Field>
      <Field label="MCC / маска" error={errors.mcc_mask?.message}>
        <input type="text" {...register("mcc_mask")} placeholder="Например: 57**" />
      </Field>
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || disabled}
          className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {initial ? "Сохранить" : "Добавить"}
        </button>
        {initial && (
          <button type="button" onClick={onCancel} className="text-xs text-slate-500">
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
