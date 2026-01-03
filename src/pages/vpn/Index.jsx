// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { vpnApi } from "../../api/vpn.js";

const cards = [
  {
    to: "/vpn/outline",
    title: "Outline",
    desc: "Готовая интеграция с Outline: управление ключами, лимитами и статистикой.",
  },
  {
    to: "/vpn/vless",
    title: "VLESS",
    desc: "Управление собственными VLESS-ключами и их параметрами.",
  },
];

export default function VPNIndex() {
  const [savedLink, setSavedLink] = React.useState("");
  const [linkLoading, setLinkLoading] = React.useState(true);
  const [linkSaving, setLinkSaving] = React.useState(false);
  const [linkError, setLinkError] = React.useState(null);
  const [copyHint, setCopyHint] = React.useState(null);

  React.useEffect(() => {
    let active = true;
    setLinkLoading(true);
    vpnApi
      .getSavedLink()
      .then((data) => {
        if (!active) return;
        setSavedLink(data?.link || "");
      })
      .catch((error) => {
        if (!active) return;
        setLinkError(error?.message || "Не удалось загрузить ссылку");
      })
      .finally(() => {
        if (!active) return;
        setLinkLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!copyHint) return undefined;
    const timer = setTimeout(() => setCopyHint(null), 3000);
    return () => clearTimeout(timer);
  }, [copyHint]);

  const handleSave = async () => {
    setLinkSaving(true);
    setLinkError(null);
    try {
      const data = await vpnApi.saveSavedLink(savedLink);
      setSavedLink(data?.link || "");
      toast.success("Ссылка сохранена");
    } catch (error) {
      setLinkError(error?.message || "Не удалось сохранить ссылку");
    } finally {
      setLinkSaving(false);
    }
  };

  const handleCopy = async () => {
    const link = savedLink.trim();
    if (!link) {
      setCopyHint("Ссылка не заполнена");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopyHint("Ссылка скопирована");
    } catch (error) {
      console.error("Clipboard write failed", error);
      setCopyHint("Буфер обмена недоступен");
    }
  };

  return (
    <PageShell title="VPN" contentClassName="p-0 bg-transparent">
      <section className="rounded-2xl bg-white/70 p-6 shadow-md transition-all hover:shadow-xl dark:bg-gray-800/60">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Центр VPN</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Соберите все инструменты VPN в одном месте: внешний Outline, собственный VLESS и полезные гайды.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-emerald-100 bg-white/70 p-6 shadow-sm transition hover:shadow-md dark:border-emerald-500/20 dark:bg-gray-800/60">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-gray-100">Быстрое копирование для ТВ</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Сохраните один VPN-ключ или ссылку, чтобы на телевизоре быстро скопировать подключение в буфер обмена.
            </p>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {linkLoading ? "Загрузка..." : "Хранится в профиле"}
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <label className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-300" htmlFor="vpn-saved-link">
            VPN ключ или ссылка
          </label>
          <textarea
            id="vpn-saved-link"
            rows={3}
            value={savedLink}
            onChange={(event) => setSavedLink(event.target.value)}
            placeholder="Вставьте ключ или ссылку для подключения"
            disabled={linkLoading}
            className="w-full resize-none rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-gray-100"
          />
        </div>

        {linkError && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {linkError}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={handleSave}
            disabled={linkSaving || linkLoading}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {linkSaving ? "Сохраняю..." : "Сохранить"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={linkLoading}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-500/10"
          >
            Скопировать
          </button>
          {copyHint && <span className="text-xs text-emerald-600 dark:text-emerald-300">{copyHint}</span>}
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <motion.div key={card.to} whileHover={{ y: -2 }}>
            <Link
              to={card.to}
              className="block rounded-2xl bg-white/70 p-6 shadow-md ring-1 ring-black/5 transition-all hover:shadow-xl dark:bg-gray-800/60"
            >
              <div className="text-base font-semibold text-slate-900 dark:text-gray-100">{card.title}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-gray-400">{card.desc}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-indigo-100 bg-white/70 p-5 shadow-sm transition hover:shadow-md dark:border-indigo-500/20 dark:bg-gray-800/60">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
          Быстрые ссылки
        </h3>
        <div className="mt-3 flex flex-col gap-2 text-sm text-slate-700 dark:text-gray-200">
          <Link
            to="/vpn/vless/guide"
            className="text-indigo-500 transition hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            Инструкция по установке
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
