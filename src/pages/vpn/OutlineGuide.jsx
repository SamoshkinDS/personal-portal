// encoding: utf-8
import React from "react";
import PageShell from "../../components/PageShell.jsx";
import { Link } from "react-router-dom";

export default function OutlineGuide() {
  return (
    <PageShell title="Outline: инструкция" contentClassName="p-0 bg-transparent">
      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Как создать ключ и подключиться</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm text-gray-700 dark:text-gray-300">
          <li>
            Откройте раздел <Link to="/vpn/outline" className="text-blue-600 underline">VPN → Outline</Link> и нажмите «Создать ключ». При желании задайте имя, чтобы потом было проще ориентироваться.
          </li>
          <li>
            Скопируйте ссылку доступа (Access URL) — кнопка «Копировать» напротив созданного ключа. Ссылка начинается с <code>ss://</code> и уже содержит все параметры.
          </li>
          <li>
            Установите приложение Outline на телефон:
            <div className="mt-2">
              iOS — App Store: Outline VPN (официальный клиент)
              <br />
              Android — Google Play: Outline VPN (официальный клиент)
            </div>
          </li>
          <li>
            Откройте приложение Outline и выберите вариант «Добавить сервер». Вставьте скопированную ссылку (<code>ss://…</code>) и подтвердите добавление.
          </li>
          <li>
            Подключитесь к серверу: тапните по добавленному серверу и нажмите «Подключить».
          </li>
        </ol>
      </section>
      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Советы</h3>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-gray-700 dark:text-gray-300">
          <li>Вы можете создать несколько ключей для разных устройств и удалить любой из них в панели управления портала.</li>
          <li>Храните ссылки доступа в защищённом месте. Любой, у кого есть ссылка, сможет подключиться.</li>
          <li>При возникновении проблем проверьте, что на сервере открыт порт Outline и доступен по сети.</li>
        </ul>
      </section>
    </PageShell>
  );
}

