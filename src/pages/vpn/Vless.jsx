// encoding: utf-8
import React from "react";
import PageShell from "../../components/PageShell.jsx";

export default function VLESS() {
  return (
    <PageShell
      title="VPN VLESS"
      contentClassName="vpn-vless flex flex-col gap-6 bg-transparent p-0"
    >
      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Настройки VLESS-прокси
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Здесь появятся параметры подключения, список клиентов и краткая статистика.
          Мы подготовим интеграцию с сервисом Xray, чтобы вы могли выдавать доступ в два клика.
        </p>
      </section>

      <section className="rounded-3xl border border-dashed border-gray-200 bg-white/60 p-6 text-sm text-gray-500 shadow-sm transition-colors duration-500 dark:border-gray-700 dark:bg-slate-900/60 dark:text-gray-400">
        Заглушка: таблица ключей VLESS. Планируется отображение статуса сессии,
        лимитов и даты создания.
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Добавить ключ
        </button>
      </div>
    </PageShell>
  );
}
