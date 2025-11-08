// encoding: utf-8
import React from "react";
import PageShell from "../components/PageShell.jsx";
import Modal from "../components/Modal.jsx";
import NotesBlock from "../components/notes/NotesBlock.jsx";

const docModules = import.meta.glob("../../docs/*.md", { eager: true, query: "?raw", import: "default" });

function getFileName(path) {
  const parts = path.split("/");
  return parts[parts.length - 1] || "";
}

function slugifyBaseName(baseName) {
  return baseName.trim().toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
}

function extractMetadata(rawContent) {
  const metadata = {};
  const lines = rawContent.split(/\r?\n/);
  let bodyStartIndex = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      bodyStartIndex = i + 1;
      continue;
    }
    const m = trimmed.match(/^(name|description)\s*:\s*(.*)$/i);
    if (m) {
      metadata[m[1].toLowerCase()] = m[2].trim();
      bodyStartIndex = i + 1;
      continue;
    }
    bodyStartIndex = i;
    break;
  }
  return { metadata, body: lines.slice(bodyStartIndex).join("\n").trim() };
}

function getResponsiveLimit() {
  if (typeof window === "undefined") return 6;
  return window.matchMedia("(min-width: 768px)").matches ? 6 : 4;
}

const internalDocs = Object.entries(docModules)
  .map(([path, raw]) => {
    const fileName = getFileName(path);
    const baseName = fileName.replace(/\.md$/i, "");
    const { metadata, body } = extractMetadata(raw);
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
  .sort((a, b) => a.title.localeCompare(b.title, "ru", { sensitivity: "base" }));

function DocCard({ doc, onRead }) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-3xl border border-gray-200 bg-white/80 p-5 shadow-sm transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-gray-700 dark:bg-slate-900/70">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{doc.sourceName}</span>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{doc.title}</h3>
      </header>
      {doc.description && <p className="text-sm text-gray-600 dark:text-gray-400">{doc.description}</p>}
      <div className="mt-auto">
        <button
          type="button"
          onClick={() => onRead(doc)}
          className="inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-blue-400/40 dark:text-blue-200 dark:hover:border-blue-300/60 dark:hover:bg-blue-500/10"
        >
          Читать
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
    if (!normalizedQuery) return internalDocs;
    return internalDocs.filter((doc) => doc.searchText.includes(normalizedQuery));
  }, [normalizedQuery]);

  React.useEffect(() => {
    const handleResize = () => setVisibleLimit(getResponsiveLimit());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    setIsExpanded(false);
  }, [normalizedQuery]);

  const shouldLimit = !isExpanded && !normalizedQuery;
  const docsToRender = shouldLimit ? filteredInternalDocs.slice(0, visibleLimit) : filteredInternalDocs;
  const hasMoreDocs = !normalizedQuery && filteredInternalDocs.length > visibleLimit;
  const enableScroll = docsToRender.length > visibleLimit || isExpanded;

  return (
    <>
      <PageShell title="Документация" contentClassName="docs docs--catalog flex flex-col gap-6 bg-transparent p-0">
        {/* Внутренняя база знаний — всегда сверху */}
        <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Внутренняя база знаний проекта</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Здесь собраны технические заметки и материалы. Локальные документы из папки
            <code className="mx-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-slate-800 dark:text-gray-300">docs/</code>
            попадают сюда автоматически. Для своих статей используйте блок
            <span className="mx-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">Заметки / Настройки</span>
            с поддержкой форматирования, таблиц и вложений (MinIO/S3).
          </p>
        </section>

        {/* Блок заметок/настроек */}
        <NotesBlock />

        {/* Локальные документы внизу */}
        <section className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-sm dark:border-blue-500/20 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Локальные документы (папка docs/)</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Используйте поиск по названию и содержимому. Без метаданных карточка покажет имя файла.
              </p>
            </div>
            <div className="relative w-full max-w-xs">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по документации..."
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  Очистить
                </button>
              )}
            </div>
          </div>

          {filteredInternalDocs.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-slate-900/60 dark:text-gray-400">
              Нет локальных документов. Добавьте файлы в
              <code className="mx-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-slate-800 dark:text-gray-300">docs/</code>.
            </div>
          ) : (
            <>
              <div className={`mt-5 ${enableScroll ? "max-h-[60vh] overflow-y-auto pr-1" : ""}`}>
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
                    {isExpanded ? "Свернуть" : "Показать больше"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </PageShell>

      <Modal open={!!selectedDoc} onClose={() => setSelectedDoc(null)} title={selectedDoc?.title || ""} maxWidth="max-w-3xl">
        {selectedDoc && (
          <article className="space-y-4 leading-relaxed text-gray-800 dark:text-gray-200">
            <header className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{selectedDoc.sourceName}</span>
              {selectedDoc.description && <p className="text-sm text-gray-500 dark:text-gray-400">{selectedDoc.description}</p>}
            </header>
            <div className="whitespace-pre-wrap">{selectedDoc.content}</div>
          </article>
        )}
      </Modal>
    </>
  );
}

