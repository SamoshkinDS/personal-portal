// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import { RiAppleFill, RiAndroidFill } from "react-icons/ri";
import PageShell from "../../components/PageShell.jsx";

const cards = [
  {
    id: "ios",
    title: "V2Box для iOS",
    description: "Скачайте приложение из App Store и авторизуйтесь с помощью Apple ID.",
    href: "https://apps.apple.com/us/app/v2box-v2ray-client/id6446814690",
    icon: <RiAppleFill className="h-8 w-8 text-slate-900 dark:text-slate-100" aria-hidden="true" />,
    color: "from-blue-500/20 via-blue-500/10 to-transparent",
  },
  {
    id: "android",
    title: "V2Box для Android",
    description: "Установите клиент из Google Play и выдайте разрешения на работу в фоне.",
    href: "https://play.google.com/store/apps/details?id=dev.hexasoftware.v2box&pcampaignid=web_share",
    icon: <RiAndroidFill className="h-8 w-8 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />,
    color: "from-emerald-500/20 via-emerald-500/10 to-transparent",
  },
];

export default function VlessGuide() {
  return (
    <PageShell
      title="Инструкция по установке VPN VLESS"
      contentClassName="vpn-vless-guide flex flex-col gap-6 bg-transparent p-0"
    >
      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Настройка VPN (VLESS) на телефоне</h2>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
          Используйте безопасный протокол VLESS, чтобы подключаться к вашему серверу. Следуйте инструкции ниже для
          установки клиента и добавления ключа.
        </p>
      </section>

      <section className="rounded-3xl border border-indigo-100/60 bg-white/70 p-6 shadow-sm transition-all duration-500 hover:shadow-md dark:border-indigo-500/20 dark:bg-slate-900/60">
        <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">Шаг 1. Создайте ключ</h3>
        <div className="mt-3 space-y-3 text-sm text-gray-700 dark:text-gray-300 sm:text-base">
          <p>Перейдите в раздел «Мои ключи» и нажмите «Создать новый ключ».</p>
          <p>Укажите имя (например, «iPhone» или «Android») и скопируйте сгенерированную ссылку — она начинается с vless://.</p>
          <p>
            <Link to="/vpn" className="text-indigo-500 transition hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200">
              Открыть Мои ключи
            </Link>
          </p>
        </div>
      </section>

      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-all duration-500 hover:shadow-md dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Шаг 2. Установите V2Box</h3>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
          Выберите приложение для вашей платформы и установите его. Авторизуйтесь стандартным способом, чтобы использовать подписки.
        </p>
        <div className="mt-5 flex flex-col items-stretch justify-center gap-4 md:flex-row md:items-start">
          {cards.map((card) => (
            <a
              key={card.id}
              href={card.href}
              target="_blank"
              rel="noreferrer"
              className="w-full max-w-sm rounded-3xl border border-white/50 bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-white/10"
              style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
            >
              <div className={`relative overflow-hidden rounded-2xl bg-white/70 px-5 py-6 backdrop-blur-sm dark:bg-slate-900/70`}>
                <div className={`absolute inset-0 opacity-70 ${card.color}`} />
                <div className="relative flex flex-col items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm dark:bg-slate-950/60">
                    {card.icon}
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{card.title}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{card.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200">
                    Скачать
                    <span aria-hidden="true">↗</span>
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/70 bg-white/60 p-6 shadow-sm transition-all duration-500 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/60">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Шаг 3. Добавьте ключ</h3>
        <ol className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 sm:text-base">
          <li>1. Откройте V2Box.</li>
          <li>2. Перейдите на вкладку <span className="font-semibold">Subscriptions</span> (Подписки).</li>
          <li>3. Нажмите <span className="font-semibold">+</span> → <span className="font-semibold">Add from clipboard</span>.</li>
          <li>4. Убедитесь, что профиль активен.</li>
        </ol>
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900/90 p-3 shadow-inner dark:border-slate-800">
          <img
            src="/images/v2box_add.png"
            alt="Добавление подписки в приложении V2Box"
            className="mx-auto w-full max-w-md rounded-2xl border border-slate-700/70 object-cover"
          />
        </div>
      </section>

      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-all duration-500 hover:shadow-md dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Шаг 4. Настройка маршрутов</h3>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
          По умолчанию весь интернет-трафик идёт через VPN. Вы можете настроить маршрутизацию, чтобы только Instagram и YouTube использовали VPN.
        </p>
        <Link
          to="/vpn/vless/routes-guide"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 sm:w-auto"
        >
          <span aria-hidden="true">📘</span>
          Инструкция по маршрутам
        </Link>
      </section>

      <section className="rounded-3xl border border-emerald-200/60 bg-emerald-50/80 p-6 shadow-sm transition-all duration-500 hover:shadow-md dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">Шаг 5. Проверка соединения</h3>
        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-200 sm:text-base">
          Чтобы убедиться, что VPN работает, откройте{" "}
          <a
            href="https://ipinfo.io"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline decoration-dotted underline-offset-4 hover:text-emerald-800 dark:hover:text-emerald-100"
          >
            https://ipinfo.io
          </a>{" "}
          — IP должен совпадать с вашим сервером.
        </p>
      </section>
    </PageShell>
  );
}
