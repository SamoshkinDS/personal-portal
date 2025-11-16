import React from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { cheatApi } from "../../api/cheat.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";

const DEFAULT_FORM = {
  title: "",
  description: "",
  content: "",
};

export default function CheatSheetsPage() {
  const [cheats, setCheats] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedCheat, setSelectedCheat] = React.useState(null);
  const [formMode, setFormMode] = React.useState("create");
  const [formData, setFormData] = React.useState(DEFAULT_FORM);
  const [formOpen, setFormOpen] = React.useState(false);
  const [formLoading, setFormLoading] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importPayload, setImportPayload] = React.useState(null);
  const [importError, setImportError] = React.useState("");
  const [importFileName, setImportFileName] = React.useState("");
  const [importLoading, setImportLoading] = React.useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const loadCheats = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await cheatApi.list({ search: debouncedSearch });
      setCheats(response.items || []);
    } catch (err) {
      toast.error(err.message || "Не удалось загрузить шпаргалки");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  React.useEffect(() => {
    loadCheats();
  }, [loadCheats]);

  const openCreate = () => {
    setFormMode("create");
    setFormData(DEFAULT_FORM);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setFormMode("edit");
    setFormData({
      title: item.title || "",
      description: item.description || "",
      content: item.content || "",
    });
    setSelectedCheat(item);
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Заголовок обязателен");
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description ? formData.description.trim() : "",
        content: formData.content ? formData.content.trim() : "",
      };
      if (formMode === "edit" && selectedCheat) {
        await cheatApi.update(selectedCheat.id, payload);
        toast.success("Шпаргалка обновлена");
      } else {
        await cheatApi.create(payload);
        toast.success("Шпаргалка создана");
      }
      setFormOpen(false);
      setSelectedCheat(null);
      loadCheats();
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Удалить шпаргалку?")) return;
    try {
      await cheatApi.delete(item.id);
      toast.success("Удалено");
      setSelectedCheat(null);
      loadCheats();
    } catch (err) {
      toast.error(err.message || "Не удалось удалить");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImportPayload(null);
      setImportFileName("");
      return;
    }
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) {
          throw new Error("JSON должен быть массивом");
        }
        setImportPayload(parsed);
        setImportError("");
      } catch (error) {
        setImportPayload(null);
        setImportError("Некорректный JSON");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importPayload?.length) {
      setImportError("Добавьте хотя бы одну запись");
      return;
    }
    setImportLoading(true);
    try {
      await cheatApi.import(importPayload);
      toast.success("Импорт завершён");
      setImportOpen(false);
      setImportPayload(null);
      setImportFileName("");
      setImportError("");
      loadCheats();
    } catch (err) {
      toast.error(err.message || "Не удалось импортировать");
    } finally {
      setImportLoading(false);
    }
  };

  const truncated = (text) => {
    if (!text) return "";
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
  };

  return (
    <PageShell title="Шпаргалки аналитика">
      <div className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Быстрые справки
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Готовые заметки по аналитике с markdown-контентом и быстрым поиском.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Создать шпаргалку
            </button>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
            >
              Импорт JSON
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="search"
            placeholder="Поиск по названию или содержанию"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 dark:focus:border-blue-400"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`placeholder-${idx}`}
                  className="h-32 animate-pulse rounded-3xl border border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
                />
              ))
            : cheats.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{item.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{truncated(item.description)}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Обновлён {new Date(item.updatedAt).toLocaleDateString()}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCheat(item)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                    >
                      Открыть
                    </button>
                  </div>
                </article>
              ))}
        </div>
      </div>

      <Modal
        open={Boolean(selectedCheat)}
        onClose={() => setSelectedCheat(null)}
        title={selectedCheat?.title || "Шпаргалка"}
        maxWidth="max-w-3xl"
      >
        {selectedCheat ? (
          <div className="space-y-4">
            <div className="space-y-4 text-sm text-gray-800 dark:text-gray-200">
              <ReactMarkdown>{selectedCheat.content || "Описание отсутствует"}</ReactMarkdown>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  openEdit(selectedCheat);
                  setSelectedCheat(null);
                }}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
              >
                Редактировать
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedCheat)}
                className="inline-flex items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Удалить
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Загрузка...</p>
        )}
      </Modal>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedCheat(null);
        }}
        title={formMode === "edit" ? "Редактировать шпаргалку" : "Создать шпаргалку"}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Заголовок
              <input
                type="text"
                value={formData.title}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, title: event.target.value }))
                }
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Краткое описание
              <input
                type="text"
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, description: event.target.value }))
                }
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Контент (Markdown)
              <textarea
                rows={8}
                value={formData.content}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, content: event.target.value }))
                }
                className="min-h-[240px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
              />
            </label>
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Предпросмотр
              </span>
              <div className="flex-1 overflow-auto rounded-xl border border-dashed border-slate-300 bg-white/80 p-3 text-sm text-gray-800 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100">
                {formData.content ? (
                <div className="space-y-3">
                  <ReactMarkdown>{formData.content}</ReactMarkdown>
                </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Пока пусто</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={formLoading}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setSelectedCheat(null);
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Отмена
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportError("");
          setImportPayload(null);
          setImportFileName("");
        }}
        title="Импорт JSON"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Выберите файл .json
            <input type="file" accept=".json,application/json" onChange={handleFileChange} />
          </label>
          {importFileName && (
            <p className="text-sm text-gray-500">
              Файл: {importFileName} · объектов для импорта: {importPayload?.length ?? 0}
            </p>
          )}
          {importError && <p className="text-sm text-red-600">{importError}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={importLoading}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Импортировать
            </button>
            <button
              type="button"
              onClick={() => {
                setImportPayload(null);
                setImportFileName("");
                setImportError("");
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Сбросить
            </button>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Формат JSON
            </p>
            <pre className="mt-2 text-xs text-slate-700 dark:text-slate-200">
{`[
  {
    "title": "User Story",
    "description": "Структура user story",
    "content": "# User Story..."
  }
]`}
            </pre>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
