// encoding: utf-8
import React from "react";
import PageShell from "../components/PageShell.jsx";
import Modal from "../components/Modal.jsx";

const docModules = import.meta.glob("../../docs/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

function getFileName(path) {
  const parts = path.split("/");
  return parts[parts.length - 1] || "";
}

function slugifyBaseName(baseName) {
  return baseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function extractMetadata(rawContent) {
  const metadata = {};
  const lines = rawContent.split(/\r?\n/);
  let bodyStartIndex = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      if (Object.keys(metadata).length > 0) {
        bodyStartIndex = index + 1;
        continue;
      }
      bodyStartIndex = index + 1;
      continue;
    }

    const match = trimmedLine.match(/^(name|description)\s*:\s*(.*)$/i);
    if (match) {
      const [, key, value] = match;
      metadata[key.toLowerCase()] = value.trim();
      bodyStartIndex = index + 1;
      continue;
    }

    bodyStartIndex = index;
    break;
  }

  const body = lines.slice(bodyStartIndex).join("\n").trim();

  return {
    metadata,
    body,
  };
}

function getResponsiveLimit() {
  if (typeof window === "undefined") {
    return 6;
  }

  if (window.matchMedia("(min-width: 768px)").matches) {
    return 6;
  }

  return 4;
}

const internalDocs = Object.entries(docModules)
  .map(([path, rawContent]) => {
    const fileName = getFileName(path);
    const baseName = fileName.replace(/\.md$/i, "");
    const { metadata, body } = extractMetadata(rawContent);
    const title = metadata.name || baseName;
    const description = metadata.description || "";

    return {
      id: slugifyBaseName(baseName) || baseName,
      title,
      description,
      content: body,
      sourceName: fileName,
      searchText: [title, description, baseName, body].filter(Boolean).join(" ").toLowerCase(),
    };
  })
  .sort((left, right) => left.title.localeCompare(right.title, "ru", { sensitivity: "base" }));

const docsSections = [
  {
    title: "Продукт и аналитика",
    items: [
      { name: "Product Analytics 101", url: "https://productanalytics.example.com" },
      { name: "JTBD: как понимать задачи пользователей", url: "https://jtbdframework.example.com" },
    ],
  },
  {
    title: "Фронтенд и экосистема",
    items: [
      { name: "MDN Web Docs", url: "https://developer.mozilla.org" },
      { name: "React Docs", url: "https://react.dev" },
    ],
  },
  {
    title: "Командные пространства",
    items: [
      { name: "Рабочий хаб в Notion", url: "https://notion.so/workspace" },
      { name: "Разделы проекта в Confluence", url: "https://confluence.example.com" },
    ],
  },
];

function DocCard({ doc, onRead }) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-3xl border border-gray-200 bg-white/80 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-gray-700 dark:bg-slate-900/70">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {doc.sourceName}
        </span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{doc.title}</h3>
      </header>
      {doc.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{doc.description}</p>
      )}
      <div className="mt-auto">
        <button
          type="button"
          onClick={() => onRead(doc)}
          className="inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-400/40 dark:text-blue-200 dark:hover:border-blue-300/60 dark:hover:bg-blue-500/10"
        >
          Читать документ
        </button>
      </div>
    </article>
  );
}

export default function Docs() {
  const [selectedDoc, setSelectedDoc] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [visibleLimit, setVisibleLimit] = React.useState(getResponsiveLimit);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const normalizedQuery = search.trim().toLowerCase();
  const filteredInternalDocs = React.useMemo(() => {
    if (!normalizedQuery) {
      return internalDocs;
    }

    return internalDocs.filter((doc) => doc.searchText.includes(normalizedQuery));
  }, [normalizedQuery]);

  React.useEffect(() => {
    const handleResize = () => {
      setVisibleLimit(getResponsiveLimit());
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    setIsExpanded(false);
  }, [normalizedQuery]);

  const shouldLimit = !isExpanded && !normalizedQuery;
  const docsToRender = shouldLimit
    ? filteredInternalDocs.slice(0, visibleLimit)
    : filteredInternalDocs;
  const hasMoreDocs = !normalizedQuery && filteredInternalDocs.length > visibleLimit;
  const enableScroll = docsToRender.length > visibleLimit || isExpanded;

  return (
    <>
      <PageShell
        title="Документация"
        contentClassName="docs docs--catalog flex flex-col gap-6 bg-transparent p-0"
      >
        <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Внутренняя база знаний проекта
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Здесь собраны технические заметки и карты внедрений. Добавляйте новые файлы в папку
            <code className="mx-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-slate-800 dark:text-gray-300">
              docs/
            </code>
            , а внутри документа задавайте поля
            <code className="mx-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-slate-800 dark:text-gray-300">
              name
            </code>
            и
            <code className="mx-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-slate-800 dark:text-gray-300">
              description
            </code>
            , чтобы карточка выглядела аккуратно.
          </p>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-sm dark:border-blue-500/20 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Локальные документы (папка docs/)
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Используйте поиск по названию, описанию и содержимому. Без метаданных карточка
                автоматически покажет имя файла и скроет описание.
              </p>
            </div>
            <div className="relative w-full max-w-xs">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск по документации"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Найдено документов: {filteredInternalDocs.length}
            {filteredInternalDocs.length !== docsToRender.length && (
              <>
                {" "}
                · Показано: {docsToRender.length}
              </>
            )}
          </div>

          {filteredInternalDocs.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-slate-900/60 dark:text-gray-400">
              Документы не найдены. Уточните запрос или добавьте новый файл в каталог
              <code className="mx-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-slate-800 dark:text-gray-300">
                docs/
              </code>
              .
            </div>
          ) : (
            <>
              <div
                className={`mt-5 ${
                  enableScroll ? "max-h-[60vh] overflow-y-auto pr-1" : ""
                }`}
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {docsToRender.map((doc) => (
                    <DocCard key={doc.id} doc={doc} onRead={setSelectedDoc} />
                  ))}
                </div>
              </div>
              {hasMoreDocs && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-400/40 dark:text-blue-200 dark:hover:border-blue-300/60 dark:hover:bg-blue-500/10"
                  >
                    {isExpanded ? "Свернуть список" : "Показать остальные"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docsSections.map((section) => (
            <section
              key={section.title}
              className="flex flex-col gap-3 rounded-3xl bg-white/80 p-5 shadow-sm transition hover:shadow-md dark:bg-slate-900/70"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {section.title}
              </h3>
              <ul className="space-y-2 text-sm">
                {section.items.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                    >
                      {item.name}
                      <span aria-hidden="true">→</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </PageShell>

      <Modal
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        title={selectedDoc?.title || ""}
        maxWidth="max-w-3xl"
      >
        {selectedDoc && (
          <article className="space-y-4 leading-relaxed text-gray-800 dark:text-gray-200">
            <header className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {selectedDoc.sourceName}
              </span>
              {selectedDoc.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedDoc.description}
                </p>
              )}
            </header>
            <div className="whitespace-pre-wrap">{selectedDoc.content}</div>
          </article>
        )}
      </Modal>
    </>
  );
}
