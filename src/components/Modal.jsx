// encoding: utf-8
import React from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-2xl" }) {
  const [mounted, setMounted] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(open);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    // Keep the modal in the DOM just long enough for exit animations without leaving focusable nodes hidden
    let timeout;
    if (open) {
      setShouldRender(true);
    } else if (shouldRender) {
      timeout = setTimeout(() => setShouldRender(false), 300);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [open, shouldRender]);

  React.useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!mounted || !shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-40 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
    >
      <div
        className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute left-1/2 top-1/2 w-full ${maxWidth} -translate-x-1/2 -translate-y-1/2 transform px-4 transition-all duration-300 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex max-h-[80vh] flex-col gap-4 overflow-hidden rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
          <div className="custom-scrollbar overflow-y-auto pr-1 text-sm text-gray-700 dark:text-gray-300">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
