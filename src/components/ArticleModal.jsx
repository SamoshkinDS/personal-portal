// encoding: utf-8
import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function ArticleModal({ article, onClose }) {
  useEffect(() => {
    if (!article) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [article]);

  useEffect(() => {
    if (!article) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [article, onClose]);

  const renderParagraphs = (fullText) => {
    if (!fullText) return null;
    if (Array.isArray(fullText)) {
      return fullText.map((paragraph, index) => (
        <p
          key={`modal-paragraph-${index}`}
          className="text-sm leading-relaxed text-gray-700 dark:text-gray-200"
        >
          {paragraph}
        </p>
      ));
    }

    return fullText
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((paragraph, index) => (
        <p
          key={`modal-paragraph-${index}`}
          className="text-sm leading-relaxed text-gray-700 dark:text-gray-200"
        >
          {paragraph}
        </p>
      ));
  };

  return (
    <AnimatePresence>
      {article && (
        <motion.div
          key="article-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative flex max-h-[85vh] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              ×
            </button>

            <h2 className="pr-10 text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {article.title}
            </h2>

            <div className="space-y-4 pr-2">{renderParagraphs(article.fullText)}</div>

            <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Закрыть
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
