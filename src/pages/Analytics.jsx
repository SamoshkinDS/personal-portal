// encoding: utf-8
import React from "react";
import PageShell from "../components/PageShell.jsx";
import ArticleModal from "../components/ArticleModal.jsx";

const analyticsCards = [
  {
    title: "API Gateway (KrakenD)",
    description:
      "Как системному аналитику подготовить маршруты и конфигурации для API-шлюза KrakenD.",
    summary: [
      "KrakenD — лёгкий API Gateway, который объединяет несколько микросервисов в единую точку входа. Он берёт на себя маршрутизацию, агрегацию ответов и политику безопасности."
    ],
    fullText: [
      "KrakenD — лёгкий и модульный API Gateway, который объединяет несколько микросервисов в единый входной слой. Он берёт на себя маршрутизацию, агрегацию ответов, кеш и политику безопасности, оставляя бэкендам исключительно бизнес-логику.",
      "Для аналитика это удобный способ описать интеграцию в виде конфигурации: какие конечные точки доступны клиентам, какие upstream‑сервисы за ними стоят, какие поля нужно обрезать или обогащать. В спецификацию требований удобно включать таблицу маршрутов (endpoint → backend) с параметрами кеширования, лимитами и схемами авторизации.",
      "Хорошая практика — выделять отдельные блоки для описания трансформаций (filter, group, merge) и сценариев отказоустойчивости. Так DevOps-команда сможет буквально перенести документ в JSON-конфигурацию KrakenD без дополнительных уточнений."
    ],
    keywords: ["API Gateway", "KrakenD", "Интеграции", "DevOps"]
  },
  {
    title: "GraphQL",
    description:
      "Чем GraphQL отличается от REST и как выглядит типовой запрос.",
    summary: [
      "GraphQL — спецификация, в которой клиент описывает структуру ответа. Вместо множества REST-эндпоинтов есть один endpoint и декларативная схема типов."
    ],
    fullText: [
      "GraphQL — спецификация, в которой клиент сам описывает структуру ответа. Вместо множества REST-эндпоинтов есть одна точка входа и схема типов. Клиент формулирует нужные поля, а сервер возвращает ровно то, что запросили.",
      "Такой подход избавляет от жёстко заданных DTO и упрощает согласование требований: аналитик описывает сущности, связи и доступные поля в схеме, а фронтенд гибко собирает нужный набор данных. Это снижает вероятность «overfetching» и «underfetching».",
      "Пример запроса, который удобно включать в документацию:\n```graphql\nquery ProductCard($id: ID!) {\n  product(id: $id) {\n    name\n    price\n    availability\n    reviews(limit: 3) {\n      author\n      rating\n    }\n  }\n}\n```\nТакой пример сразу демонстрирует формат переменных и минимальный набор данных, который должен поддерживать резолвер."
    ],
    keywords: ["GraphQL", "API", "Схемы", "Запросы"]
  },
  {
    title: "OData",
    description:
      "Стандарт, который помогает аналитикам и разработчикам говорить на одном языке.",
    summary: [
      "OData — открытый протокол поверх HTTP, стандартизирующий фильтрацию, сортировку и пагинацию через унифицированные параметры запроса."
    ],
    fullText: [
      "OData — открытый протокол поверх HTTP, стандартизирующий работу с выборками: фильтрацию, сортировку, пагинацию, проекции и раскрытие связей. Всё задаётся единообразными параметрами ($filter, $select, $expand).",
      "Для аналитика OData — возможность описывать требования к отчётности и выгрузкам на одном языке. Вместо кастомных параметров можно заранее указать, что клиент должен уметь делать запрос вида `/Orders?$filter=Status eq 'Closed'&$select=Id,Total&$top=20`. Разработчику достаточно поддержать стандартные операторы — будь то ASP.NET, Java или SAP.",
      "Стандарт особенно полезен, если планируются интеграции с BI-инструментами, Excel или Power BI: большинство из них умеет работать с OData «из коробки», а значит, аналитик может сразу проверить жизнеспособность требований в реальном инструменте."
    ],
    keywords: ["OData", "BI", "Фильтрация", "Стандарты"]
  },
  {
    title: "Postman — мини-инструкция",
    description:
      "Краткий гайд по использованию Postman для тестирования API.",
    summary: [
      "Postman позволяет отправлять запросы к API, хранить сценарии в коллекциях и делиться ими с командой — отличный инструмент для быстрой валидации требований."
    ],
    fullText: [
      "Postman — настольное приложение, которое позволяет отправлять HTTP-запросы, собирать их в коллекции и делиться с командой. Это отличный способ подтвердить требования к API, не дожидаясь полноценного UI или автотестов.",
      "Шаги для быстрого старта: создайте коллекцию, добавьте запрос, укажите URL, метод и заголовки, а в Body передайте нужный JSON. После отправки запроса сохраните ответ и примеры. В разделе Tests можно написать короткие проверки на JavaScript:\n```javascript\npm.test(\"Статус 200\", function () {\n  pm.response.to.have.status(200);\n});\npm.test(\"В ответе есть id\", function () {\n  const json = pm.response.json();\n  pm.expect(json.id).to.be.a(\"number\");\n});\n```",
      "Коллекции Postman удобно хранить в репозитории или привязать к пользовательским историям: это подтверждение того, что API работает так, как описано в спецификации."
    ],
    keywords: ["Postman", "Тестирование", "API", "Инструменты"]
  }
];

export default function Analytics() {
  const [selectedArticle, setSelectedArticle] = React.useState(null);

  const handleOpenModal = (card) => {
    setSelectedArticle({
      title: card.title,
      fullText: card.fullText
    });
  };

  const handleCloseModal = () => {
    setSelectedArticle(null);
  };

  return (
    <>
      <PageShell
        title="Аналитика"
        contentClassName="analytics analytics--overview flex flex-col gap-6 bg-transparent p-0"
      >
        <section className="analytics__controls flex flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="analytics__subtitle text-xl font-semibold">Материалы для старта</h2>
            <p className="analytics__hint mt-1 text-sm text-gray-500 dark:text-gray-400">
              Короткие статьи напомнят ключевые стандарты интеграций и инструменты, с которыми сталкивается системный аналитик.
            </p>
          </div>
          <div className="analytics__filter-group flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              placeholder="Быстрый поиск по статьям"
              className="analytics__search rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
            />
            <select
              className="analytics__range rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
            >
              <option>Все темы</option>
              <option>API-шлюзы</option>
              <option>Гибкие запросы</option>
              <option>Инструменты тестирования</option>
            </select>
          </div>
        </section>

        <section className="analytics__cards grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analyticsCards.map((card) => (
            <article
              key={card.title}
              className="analytics__card flex flex-col gap-4 rounded-3xl bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 focus-within:shadow-xl focus-within:shadow-blue-500/10 dark:bg-slate-900/70"
            >
              <h3 className="analytics__card-title text-lg font-semibold text-gray-900 dark:text-gray-100">
                {card.title}
              </h3>
              {card.description && (
                <p className="analytics__card-description text-sm text-gray-600 dark:text-gray-400">
                  {card.description}
                </p>
              )}
              {card.summary?.map((paragraph, index) => (
                <p
                  key={`${card.title}-summary-${index}`}
                  className="analytics__card-text text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                >
                  {paragraph}
                </p>
              ))}
              {card.keywords && (
                <div className="analytics__card-tags mt-2 flex flex-wrap gap-2">
                  {card.keywords.map((keyword) => (
                    <span
                      key={`${card.title}-tag-${keyword}`}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-200"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleOpenModal(card)}
                className="mt-auto inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-400/40 dark:text-blue-200 dark:hover:border-blue-300/60 dark:hover:bg-blue-500/10"
              >
                Читать полностью
              </button>
            </article>
          ))}
        </section>

        <footer className="analytics__footer rounded-3xl bg-white/60 px-6 py-4 text-xs text-gray-500 shadow-sm transition-colors duration-500 dark:bg-slate-900/60 dark:text-gray-400">
          Версия панели: 1.1.0 · Данные обновлены автоматически 5 минут назад.
        </footer>
      </PageShell>

      <ArticleModal article={selectedArticle} onClose={handleCloseModal} />
    </>
  );
}
