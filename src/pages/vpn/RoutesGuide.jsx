// encoding: utf-8
import React from "react";
import PageShell from "../../components/PageShell.jsx";

const keywords = ["instagram.com", "cdninstagram.com", "youtube.com", "ytimg.com", "googlevideo.com"];

export default function RoutesGuide() {
  return (
    <PageShell
      title="Настройка маршрутов (Selective Proxy)"
      contentClassName="vpn-routes-guide flex flex-col gap-6 bg-transparent p-0"
    >
      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Настройка маршрутизации VPN в V2Box
        </h2>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
          С помощью правил маршрутизации вы можете направлять через VPN только часть трафика — например, YouTube и
          Instagram, оставляя остальное подключение напрямую через мобильную сеть.
        </p>
      </section>

      <section className="rounded-3xl border border-indigo-100/60 bg-white/70 p-6 shadow-sm transition-all duration-500 hover:shadow-md dark:border-indigo-500/20 dark:bg-slate-900/60">
        <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">Шаг 1. Создание набора правил</h3>
        <ol className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300 sm:text-base">
          <li>1. Откройте приложение V2Box.</li>
          <li>2. Перейдите во вкладку <span className="font-semibold">Routing Rules</span> (Маршруты).</li>
          <li>3. Создайте новый набор правил.</li>
          <li>
            4. В разделе <span className="font-semibold">Match Mode</span> выберите <span className="font-semibold">Domain Keyword</span>.
          </li>
          <li>5. Добавьте ключевые слова:</li>
        </ol>
        <ul className="mt-3 grid gap-2 rounded-2xl bg-slate-900/80 p-4 text-sm text-emerald-200 shadow-inner sm:grid-cols-2">
          {keywords.map((item) => (
            <li key={item} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 sm:text-base">
          Для действий выберите: <span className="font-semibold">Proxy → VPN Profile</span>.
        </p>
      </section>

      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-all duration-500 hover:shadow-md dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Шаг 2. Применение правил</h3>
        <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
          <p>Назначьте созданный набор маршрутов вашему активному VPN-профилю.</p>
          <p>Остальной трафик останется через мобильную сеть или Wi-Fi.</p>
          <p>Можно создать несколько наборов: например, «VPN Only YouTube» или «VPN Social».</p>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200/60 bg-amber-50/70 p-6 shadow-sm transition-all duration-500 hover:shadow-md dark:border-amber-500/30 dark:bg-amber-500/10">
        <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-200">Шаг 3. Советы</h3>
        <ul className="mt-4 space-y-2 text-sm text-amber-800 dark:text-amber-100 sm:text-base">
          <li>• Используйте отдельные ключи для разных устройств — это повышает безопасность и облегчает аналитику.</li>
          <li>
            • Проверяйте IP-адрес через{" "}
            <a
              href="https://ipinfo.io"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline decoration-dotted underline-offset-4 hover:text-amber-900 dark:hover:text-amber-50"
            >
              https://ipinfo.io
            </a>
            .
          </li>
          <li>• Если соединение нестабильное, убедитесь, что порт 443 или 4443 открыт в фаерволе вашего VPS.</li>
        </ul>
      </section>
    </PageShell>
  );
}
