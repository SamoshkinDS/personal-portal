import React from "react";
import Modal from "../../../components/Modal.jsx";

export default function CareFiltersModal({ open, onClose, sections = [], values = {}, onApply, onReset }) {
  const [localValues, setLocalValues] = React.useState(values);

  React.useEffect(() => {
    if (open) {
      setLocalValues(values || {});
    }
  }, [open, values]);

  const toggleMulti = (key, value) => {
    setLocalValues((prev) => {
      const current = new Set(prev?.[key] || []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [key]: Array.from(current) };
    });
  };

  const handleTextChange = (key, event) => {
    const value = event.target.value;
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply?.(localValues);
  };

  const handleReset = () => {
    const empty = {};
    sections.forEach((section) => {
      empty[section.key] = section.type === "multi" ? [] : "";
    });
    setLocalValues(empty);
    onReset?.();
  };

  return (
    <Modal open={open} onClose={onClose} title="Фильтры" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{section.label}</p>
                {section.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{section.description}</p>
                )}
              </div>
            </div>
            {section.type === "multi" ? (
              <div className="flex flex-wrap gap-2">
                {section.options?.map((option) => {
                  const active = (localValues?.[section.key] || []).includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleMulti(section.key, option.value)}
                      className={`rounded-2xl px-3 py-1 text-sm font-medium transition ${
                        active
                          ? option.activeClass ||
                            "bg-blue-600 text-white shadow-sm shadow-blue-500/30 dark:bg-blue-500"
                          : "border border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                value={localValues?.[section.key] || ""}
                onChange={(event) => handleTextChange(section.key, event)}
                placeholder={section.placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/50 dark:text-white"
              />
            )}
          </div>
        ))}
        <div className="flex justify-between border-t border-slate-100 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="text-sm font-semibold text-slate-500 underline-offset-4 hover:underline dark:text-slate-300"
          >
            Сбросить
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
