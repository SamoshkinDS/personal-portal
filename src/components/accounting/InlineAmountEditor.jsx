// encoding: utf-8
import React from "react";

export default function InlineAmountEditor({
  value,
  currency = "₽",
  onSave,
  disabled = false,
}) {
  const [editing, setEditing] = React.useState(false);
  const [amount, setAmount] = React.useState(value ?? "");
  const [moneyCurrency, setMoneyCurrency] = React.useState(currency);

  React.useEffect(() => {
    setAmount(value ?? "");
  }, [value]);

  React.useEffect(() => {
    setMoneyCurrency(currency);
  }, [currency]);

  const commit = async () => {
    await onSave?.({
      amount_account: amount,
      currency_account: moneyCurrency,
    });
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setEditing(true)}
        className="rounded-2xl border border-transparent px-2 py-1 text-left text-sm font-semibold text-slate-900 transition hover:border-slate-300 dark:text-white dark:hover:border-white/20"
      >
        {value !== null && value !== undefined
          ? `${Number(value).toLocaleString("ru-RU")} ${currency}`
          : "—"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="w-28 rounded-xl border border-slate-300 bg-white px-2 py-1 text-sm dark:border-white/20 dark:bg-slate-800"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        autoFocus
      />
      <input
        type="text"
        className="w-16 rounded-xl border border-slate-300 bg-white px-2 py-1 text-sm uppercase dark:border-white/20 dark:bg-slate-800"
        value={moneyCurrency}
        onChange={(e) => setMoneyCurrency(e.target.value.toUpperCase())}
      />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={commit}
          className="rounded-xl bg-emerald-500/80 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
        >
          OK
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-xl bg-slate-200/80 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-white"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
