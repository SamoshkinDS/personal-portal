// encoding: utf-8
import React from "react";
import PageShell from "../components/PageShell.jsx";
import ArticleModal from "../components/ArticleModal.jsx";

const aiTools = [
  {
    name: "ChatGPT",
    description:
      "Диалоговая модель для быстрых ответов, проверки гипотез и генерации черновиков.",
    status: "Готово",
    summary: [
      "Подходит для брейншторминга, уточнения требований, поиска ошибок в текстах и подготовки писем. Особенно полезен, если нужно объяснить сложный процесс простыми словами."
    ],
    fullText: [
      "ChatGPT помогает аналитикам и разработчикам быстро формулировать идеи, уточнять постановки задач, просматривать текстовые документы и находить в них противоречия. Он хорошо справляется с преобразованием формулировок и созданием базовых шаблонов документов.",
      "Чтобы получить точный ответ, формулируйте запрос в виде задачи с контекстом: укажите роль модели («Вы — системный аналитик»), цель («сформируйте перечень проверок») и формат результата («список из 5 пунктов»). Такой подход существенно повышает релевантность ответа."
    ],
    actionLabel: "Открыть веб-версию"
  },
  {
    name: "Midjourney",
    description:
      "Сервис для генерации визуальных концепций и иллюстраций для презентаций.",
    status: "Требуется VPN",
    summary: [
      "Работает через Discord-бота. Промты лучше формулировать на английском, указывая стиль, освещение и дальнейшее использование арта."
    ],
    fullText: [
      "Midjourney помогает команде быстро получить визуальные референсы: от обложек презентаций до эскизов будущих интерфейсов. Это особенно полезно на этапе идеи, когда ещё нет дизайнера или макетов, но нужно показать настроение решения.",
      "При составлении промта указывайте жанр (например, \"flat illustration\"), цветовую палитру и формат вывода (например, \"wide 16:9\"), чтобы результат был ближе к ожиданиям. Итоговые изображения можно использовать как основу для дизайна или маркетинговых материалов."
    ],
    actionLabel: "Открыть инструкции"
  },
  {
    name: "Perplexity",
    description:
      "Поисковый ассистент, который возвращает ответы с ссылками и цитатами.",
    status: "Подписка PRO",
    summary: [
      "Подходит для быстрых ресёрчей и проверки фактов. Удобно уточнять спорные моменты в документации или искать альтернативные подходы."
    ],
    fullText: [
      "Perplexity работает как гибрид поисковой системы и диалоговой модели: отвечает на вопросы и сразу показывает источники, на которые ссылается. Это помогает быстро удостовериться в корректности информации и перейти к первоисточнику.",
      "Уточняющие вопросы можно задавать без пересборки контекста — сервис запоминает предыдущий запрос. Это экономит время при исследовании темы и позволяет строить связный диалог."
    ],
    actionLabel: "Перейти к сайту"
  },
  {
    name: "Как писать промты для Codex и ChatGPT",
    description:
      "Памятка по структуре хорошего запроса к моделям, чтобы получить ожидаемый результат.",
    status: "Гайд",
    summary: [
      "Промт — это мини-ТЗ для модели. Чем точнее цель, контекст и формат результата, тем меньше неожиданностей в ответе."
    ],
    fullText: [
      "Промт — это инструкция для модели. Чем яснее цель, контекст и ожидаемый результат, тем точнее ответ. Старайтесь описывать задачу так, будто делаете техническое задание для нового исполнителя.",
      "Codex — специализированная модель для кода, лежащая в основе GitHub Copilot. Она обучена на открытых репозиториях и отлично дополняет сценарии в VS Code: подсказывает функции, предлагает варианты рефакторинга, помогает быстро вспомнить синтаксис API.",
      "Три совета по структуре промта:\n1. Цель — что нужно получить (например, «написать SQL-запрос» или «описать пользовательский сценарий»).\n2. Контекст — роль исполнителя, исходные данные, технологические ограничения.\n3. Ожидаемый результат — формат, уровень детализации, язык ответа.",
      "Пример плохого промта: «Сделай отчёт». Неясно, что считать, какую структуру ожидать и для кого предназначен документ.\nПример хорошего промта: «Выступай как аналитик. Нужен краткий список метрик для дашборда продаж SaaS-сервиса: какие KPI показать в обзоре, какие фильтры добавить. Ответ — маркированный список из 5 пунктов».",
      "Хорошо написанный промт — это как техническое задание: чем яснее, тем лучше результат."
    ],
    actionLabel: "Сохранить памятку"
  }
];

export default function AI() {
  const [selectedArticle, setSelectedArticle] = React.useState(null);

  const handleOpenModal = (tool) => {
    setSelectedArticle({
      title: tool.name,
      fullText: tool.fullText
    });
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
  };

  return (
    <>
      <PageShell
        title="Нейросервисы"
        contentClassName="ai ai--tools flex flex-col gap-6 bg-transparent p-0"
      >
        <section className="ai__intro rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
          <h2 className="ai__subtitle text-xl font-semibold">Инструменты и методики</h2>
          <p className="ai__description mt-2 text-sm text-gray-600 dark:text-gray-400">
            Подборка сервисов и памяток, которые помогают ускорить работу с текстами, кодом и визуалами. Сохраняйте, чтобы быстро возвращаться к проверенным практикам.
          </p>
        </section>

        <section className="ai__list grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {aiTools.map((tool) => (
            <article
              key={tool.name}
              className="ai__card flex flex-col gap-4 rounded-3xl bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 dark:bg-slate-900/70"
            >
              <header className="ai__card-header flex items-center justify-between">
                <h3 className="ai__card-title text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {tool.name}
                </h3>
                {tool.status && (
                  <span className="ai__card-status rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200">
                    {tool.status}
                  </span>
                )}
              </header>
              {tool.description && (
                <p className="ai__card-description text-sm text-gray-600 dark:text-gray-400">
                  {tool.description}
                </p>
              )}
              {tool.summary?.map((paragraph, index) => (
                <p
                  key={`${tool.name}-summary-${index}`}
                  className="ai__card-detail text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                >
                  {paragraph}
                </p>
              ))}
              <button
                type="button"
                onClick={() => handleOpenModal(tool)}
                className="mt-auto inline-flex items-center justify-center rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:border-indigo-500/30 dark:text-indigo-200 dark:hover:border-indigo-400/60 dark:hover:bg-indigo-500/10"
              >
                Читать полностью
              </button>
              <button
                type="button"
                className="ai__card-action inline-flex w-full justify-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
              >
                {tool.actionLabel || "Открыть"}
              </button>
            </article>
          ))}
        </section>
      </PageShell>

      <ArticleModal article={selectedArticle} onClose={handleCloseModal} />
    </>
  );
}
