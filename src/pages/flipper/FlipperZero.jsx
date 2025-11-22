// encoding: utf-8
import React from "react";
import PageShell from "../../components/PageShell.jsx";

const quickLinks = [
  { title: "Базовые функции", href: "#basics" },
  { title: "Кастомные прошивки", href: "#firmware" },
  { title: "Модули и плагины", href: "#modules" },
  { title: "Гайды и сценарии", href: "#guides" },
  { title: "База уязвимостей", href: "#vulns" },
  { title: "Очередь статей", href: "#queue" },
];

const basicCategories = [
  { id: "rfid", title: "RFID / NFC", items: ["Чтение", "Запись", "Эмуляция", "Ограничения", "Форматы"] },
  { id: "subghz", title: "Sub-GHz", items: ["Сканирование", "Захват сигналов", "Фиксированный код", "Протоколы"] },
  { id: "ir", title: "Infrared (IR)", items: ["Обучение", "Эмуляция пультов"] },
  { id: "ibutton", title: "iButton", items: ["Чтение", "Эмуляция", "Таблицы ключей"] },
  { id: "ble", title: "Bluetooth / BLE", items: ["Сканирование", "Отображение сервисов"] },
  { id: "badusb", title: "BadUSB", items: ["Payloads", "Скрипты"] },
  { id: "gpio", title: "GPIO / UART / Hardware", items: ["Подключение датчиков", "Low-level тестирование"] },
  { id: "fs", title: "Файловая система", items: ["Типы файлов", "Дерево каталогов Flipper"] },
];

const firmwareSections = [
  {
    id: "unleashed",
    title: "Unleashed",
    items: ["Отличия от официальной", "Новые возможности", "Снятие ограничений", "Новые протоколы", "Список приложений"],
  },
  {
    id: "marauder",
    title: "Marauder (Wi‑Fi Devboard)",
    items: ["Sniffing", "Deauth", "Handshake Capture", "BLE Tools", "Список команд"],
  },
  {
    id: "momentum",
    title: "Momentum",
    items: ["Отличия", "Поддерживаемые модули", "Изменённые настройки безопасности"],
  },
  {
    id: "bunny",
    title: "BunnyLoader / BadUSB",
    items: ["Payload-хранилище", "Готовые шаблоны атак", "Макросы", "Сценарии для Windows / Linux / macOS"],
  },
];

const moduleCategories = [
  { id: "radio", title: "Радиотулзы", description: "Sub-GHz анализаторы, декодеры, частотные сканеры." },
  { id: "nfc", title: "NFC тулзы", description: "Работа с метками, дампы, эмуляция, проверки ограничений." },
  { id: "ble-tools", title: "BLE инструменты", description: "Сканеры, просмотр сервисов, эксплойты BLE." },
  { id: "fs-tools", title: "Файловая система", description: "Проводники, редакторы, бэкапы и менеджеры payloads." },
  { id: "payloads", title: "Payload менеджеры", description: "Коллекции BadUSB, готовые сценарии и конструкторы." },
];

const guideScenarios = [
  { id: "nfc-office", title: "Тестирование офисных NFC-пропусков" },
  { id: "subghz-alarms", title: "Проверка сигнализаций 433MHz" },
  { id: "ble-locks", title: "Тестирование BLE-замков" },
  { id: "domofon", title: "Проверка домофонов (RFID / iButton)" },
  { id: "ir-devices", title: "Проверка ИК-устройств" },
];

const vulnTypes = [
  { id: "subghz", title: "Фиксированный код Sub-GHz", details: "Примеры пультов/сигнализаций с предсказуемым кодом." },
  { id: "nfc-tags", title: "Уязвимые NFC-метки", details: "Слабая аутентификация, отсутствующие ограничения записи." },
  { id: "ble", title: "Некорректная реализация BLE сервисов", details: "Нулевые пин-коды, открытые сервисы, небезопасные GATT." },
  { id: "ir", title: "ИК устройства без проверок", details: "Простая эмуляция кодов без защиты." },
  { id: "ibutton", title: "Некачественная реализация iButton", details: "Дубли ключей без проверки, статичные таблицы." },
];

const articleTypes = [
  { id: "feature_basic", title: "feature_basic", description: "Базовые функции штатной прошивки." },
  { id: "feature_custom_fw", title: "feature_custom_fw", description: "Отличия и возможности кастомных прошивок." },
  { id: "module_custom", title: "module_custom", description: "Отдельные модули/плагины, привязка к прошивкам." },
  { id: "guide_scenario", title: "guide_scenario", description: "Гайды и безопасные сценарии использования." },
  { id: "vuln_check", title: "vuln_check", description: "Записи базы уязвимостей и методики проверки." },
];

const statusList = ["draft", "processing", "ready", "published", "error"];

const navigationTree = [
  { title: "Базовые функции", children: ["RFID/NFC", "Sub-GHz", "IR", "iButton", "BLE", "BadUSB", "GPIO/Hardware"] },
  { title: "Кастомные прошивки", children: ["Unleashed", "Marauder", "Momentum", "BunnyLoader / BadUSB"] },
  { title: "Модули (Apps/Plugins)" },
  { title: "Гайды и сценарии" },
  { title: "База уязвимостей" },
];

function SectionCard({ title, children, id }) {
  return (
    <section id={id} className="rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-slate-100 backdrop-blur dark:bg-slate-900/60 dark:ring-slate-800">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      </header>
      <div className="text-sm text-slate-700 dark:text-slate-200">{children}</div>
    </section>
  );
}

export default function FlipperZero() {
  return (
    <PageShell title="Flipper Zero">
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500 p-8 text-white shadow-lg">
              <div className="absolute inset-0 opacity-20" aria-hidden="true">
                <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-white/30 blur-3xl" />
                <div className="absolute right-10 top-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
              </div>
              <div className="relative flex flex-col gap-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">Новый раздел</p>
                <h1 className="text-3xl font-bold leading-tight">Flipper Zero</h1>
                <p className="max-w-2xl text-sm text-white/90">
                  Обзор возможностей устройства: официальные функции, кастомные прошивки, модули и безопасные гайды. Здесь же будет база
                  уязвимостей и очередь статей, интегрированная с n8n.
                </p>
                <div className="flex flex-wrap gap-3">
                  {quickLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/25"
                    >
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="h-full rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
              <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-50">Быстрые ссылки</h2>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-slate-800/80"
                    >
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                      <span>{link.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700">
                Навигация разбита по блокам из ТЗ: сначала базовые функции официальной прошивки, затем кастомные прошивки, модули, гайды,
                уязвимости и очередь статей.
              </div>
            </div>
          </div>
        </div>

        <SectionCard id="basics" title="Базовые функции (официальная прошивка)">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {basicCategories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{category.title}</div>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {category.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard id="firmware" title="Кастомные прошивки">
          <div className="grid gap-4 md:grid-cols-2">
            {firmwareSections.map((fw) => (
              <div key={fw.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{fw.title}</div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-100 dark:ring-indigo-500/40">
                    Подраздел
                  </span>
                </div>
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {fw.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard id="modules" title="Модули (Apps & Plugins)">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {moduleCategories.map((mod) => (
              <div key={mod.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{mod.title}</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{mod.description}</p>
                <div className="mt-3 rounded-xl bg-indigo-50 px-3 py-2 text-[11px] text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-100 dark:ring-indigo-500/30">
                  Каждый модуль: название, привязка к прошивке (если есть), назначение, пример использования.
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard id="guides" title="Гайды и сценарии">
          <div className="grid gap-4 md:grid-cols-2">
            {guideScenarios.map((guide) => (
              <div key={guide.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{guide.title}</div>
                <ul className="mt-3 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                    <span>Краткое описание и пошаговые действия.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                    <span>Что считается уязвимостью для сценария.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                    <span>Правила безопасного использования.</span>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard id="vulns" title="База уязвимостей">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {vulnTypes.map((vuln) => (
              <div key={vuln.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{vuln.title}</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{vuln.details}</p>
                <ul className="mt-3 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                    <span>Тип и краткое описание.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                    <span>Пример уязвимого устройства (обезличенно).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                    <span>Как протестировать.</span>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard id="queue" title="Очередь статей (интеграция с n8n)">
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">Типы статей</div>
              <div className="grid gap-3 md:grid-cols-2">
                {articleTypes.map((type) => (
                  <div key={type.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700">
                    <div className="font-semibold text-slate-900 dark:text-slate-50">{type.title}</div>
                    <p className="mt-1 leading-relaxed">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Поля очереди</div>
              <ul className="mt-2 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-700">
                  <span>title</span>
                  <span className="text-slate-500 dark:text-slate-400">Заголовок</span>
                </li>
                <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-700">
                  <span>type</span>
                  <span className="text-slate-500 dark:text-slate-400">См. типы</span>
                </li>
                <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-700">
                  <span>payload</span>
                  <span className="text-slate-500 dark:text-slate-400">Сырые данные</span>
                </li>
                <li className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-700">
                  <div className="flex items-center justify-between">
                    <span>status</span>
                    <span className="text-slate-500 dark:text-slate-400">Статусы</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statusList.map((status) => (
                      <span key={status} className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-100 dark:ring-indigo-500/30">
                        {status}
                      </span>
                    ))}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </SectionCard>

        <SectionCard id="nav" title="Навигация раздела">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:ring-slate-700">
            <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-slate-800 dark:text-slate-100">{`Flipper Zero
├─ Базовые функции
│  ├─ RFID/NFC
│  ├─ Sub-GHz
│  ├─ IR
│  ├─ iButton
│  ├─ BLE
│  ├─ BadUSB
│  └─ GPIO/Hardware
│
├─ Кастомные прошивки
│  ├─ Unleashed
│  ├─ Marauder
│  ├─ Momentum
│  └─ BunnyLoader / BadUSB
│
├─ Модули (Apps/Plugins)
│
├─ Гайды и сценарии
│
└─ База уязвимостей`}</pre>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {navigationTree.map((node) => (
              <div key={node.title} className="rounded-xl bg-white/80 p-3 text-sm text-slate-800 ring-1 ring-slate-100 shadow-sm dark:bg-slate-900/60 dark:text-slate-100 dark:ring-slate-800">
                <div className="font-semibold">{node.title}</div>
                {node.children && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {node.children.map((child) => (
                      <li key={child} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                        <span>{child}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
