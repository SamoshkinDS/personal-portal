// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import Modal from "../Modal.jsx";
import { apiAuthFetch } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import NotesEditorModal from "./NotesEditorModal.jsx";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const FILE_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "zip", "rar", "ppt", "pptx"];

const normalizeNote = (raw) => {
  if (!raw) return null;
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description || "",
    content: raw.content || "",
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
};

const toTimestamp = (value) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

const sortByUpdated = (list) =>
  [...list].sort((a, b) => toTimestamp(b?.updatedAt || b?.updated_at) - toTimestamp(a?.updatedAt || a?.updated_at));

const formatDateTime = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const detectLinkKind = (href) => {
  if (!href) return null;
  const lower = href.toLowerCase();
  const clean = lower.split("?")[0].split("#")[0];
  if (IMAGE_EXTENSIONS.some((ext) => clean.endsWith(`.${ext}`))) return "image";
  if (FILE_EXTENSIONS.some((ext) => clean.endsWith(`.${ext}`))) return "file";
  return null;
};

// Преобразуем ссылки из редактора: S3-изображения показываем как <img>, остальные файлы — кнопками загрузки.
const transformNoteContent = (html) => {
  if (typeof window === "undefined" || !html) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href");
    const kind = detectLinkKind(href);
    if (kind === "image") {
      const img = doc.createElement("img");
      img.setAttribute("src", href);
      img.setAttribute("alt", anchor.textContent || anchor.getAttribute("title") || "Вложенное изображение");
      img.className = "note-inline-image";
      img.loading = "lazy";
      anchor.replaceWith(img);
      return;
    }
    if (kind === "file") {
      anchor.classList.add("note-download-link");
      if (!anchor.textContent.trim()) {
        const filename = href.split("/").pop() || "Файл из заметки";
        anchor.textContent = filename;
      }
    }
  });
  return doc.body.innerHTML;
};

function NoteCard({ note, onSelect, onEdit, onDelete, isAdmin }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white/85 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-gray-700 dark:bg-slate-900/70">
      <button type="button" onClick={() => onSelect(note)} className="text-left">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{note.title}</h3>
        {note.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {note.description.length > 200 ? `${note.description.slice(0, 197)}…` : note.description}
          </p>
        )}
        <p className="mt-3 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Обновлено: {formatDateTime(note.updatedAt)}
        </p>
      </button>
      {isAdmin && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-500/50 dark:hover:text-blue-200"
          >
            Редактировать
          </button>
          <button
            type="button"
            onClick={() => onDelete(note)}
            className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-500 transition hover:border-red-300 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:border-red-400/70 dark:hover:bg-red-500/10"
          >
            Удалить
          </button>
        </div>
      )}
    </article>
  );
}

function NoteViewerModal({ note, onClose }) {
  const html = React.useMemo(() => transformNoteContent(note?.content || ""), [note?.content]);

  return (
    <Modal open={!!note} onClose={onClose} title={note?.title || ""} maxWidth="max-w-4xl">
      {note && (
        <article className="space-y-4">
          <div className="rounded-2xl bg-slate-50/80 p-4 text-sm text-gray-600 dark:bg-slate-800/80 dark:text-gray-300">
            <p>
              Последнее изменение:{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{formatDateTime(note.updatedAt)}</span>
            </p>
            {note.description && <p className="mt-1">{note.description}</p>}
          </div>
          <div className="note-content" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      )}
    </Modal>
  );
}

function ConfirmDeleteModal({ note, loading, onClose, onConfirm }) {
  return (
    <Modal open={!!note} onClose={onClose} title="Удалить заметку?" maxWidth="max-w-lg">
      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-200">
        <p>Вы уверены, что хотите удалить заметку «{note?.title}»? Отменить действие будет невозможно.</p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200"
            disabled={loading}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn bg-red-600 text-white hover:bg-red-500 focus:ring-red-400"
            disabled={loading}
          >
            {loading ? "Удаление..." : "Удалить"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function NotesBlock() {
  const { user } = useAuth();
  const [notes, setNotes] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [editorContext, setEditorContext] = React.useState({ mode: "create", open: false, data: null });
  const [viewerNote, setViewerNote] = React.useState(null);
  const [deleteCandidate, setDeleteCandidate] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [noteCache, setNoteCache] = React.useState({});

  const isAdmin = React.useMemo(() => {
    if (!user) return false;
    if (user.role === "ALL") return true;
    return (user.permissions || []).includes("admin_access");
  }, [user]);

  const loadNotes = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiAuthFetch("/api/notes");
      if (!res.ok) throw new Error("Не удалось загрузить заметки");
      const payload = await res.json();
      const normalized = (payload.notes || []).map(normalizeNote).filter(Boolean);
      setNotes(sortByUpdated(normalized));
    } catch (err) {
      console.error(err);
      setError(err.message || "Ошибка загрузки заметок");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const fetchNote = React.useCallback(
    async (noteId) => {
      if (noteCache[noteId]) return noteCache[noteId];
      const res = await apiAuthFetch(`/api/notes/${noteId}`);
      if (!res.ok) throw new Error("Не удалось получить заметку");
      const payload = await res.json();
      const normalized = normalizeNote(payload.note);
      setNoteCache((prev) => ({ ...prev, [noteId]: normalized }));
      setNotes((prev) => {
        const exists = prev.some((n) => n.id === noteId);
        const next = exists ? prev.map((n) => (n.id === noteId ? { ...n, ...normalized } : n)) : [...prev, normalized];
        return sortByUpdated(next);
      });
      return normalized;
    },
    [noteCache]
  );

  const openViewer = async (note) => {
    try {
      const full = await fetchNote(note.id);
      setViewerNote(full);
    } catch (err) {
      toast.error(err.message || "Не удалось открыть заметку");
    }
  };

  const openEditor = async (note) => {
    if (!isAdmin) return;
    if (!note) {
      setEditorContext({ mode: "create", open: true, data: null });
      return;
    }
    try {
      const full = await fetchNote(note.id);
      setEditorContext({ mode: "edit", open: true, data: full });
    } catch (err) {
      toast.error(err.message || "Не удалось открыть заметку");
    }
  };

  const closeEditor = () => setEditorContext({ mode: "create", open: false, data: null });

  const handleSave = async (form) => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const isEdit = editorContext.mode === "edit" && editorContext.data?.id;
      const endpoint = isEdit ? `/api/notes/${editorContext.data.id}` : "/api/notes";
      const method = isEdit ? "PUT" : "POST";
      const res = await apiAuthFetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Не удалось сохранить заметку");
      const payload = await res.json();
      const normalized = normalizeNote(payload.note);
      setNotes((prev) => {
        if (isEdit) {
          return sortByUpdated(prev.map((note) => (note.id === normalized.id ? { ...note, ...normalized } : note)));
        }
        return sortByUpdated([normalized, ...prev]);
      });
      setNoteCache((prev) => ({ ...prev, [normalized.id]: normalized }));
      toast.success(isEdit ? "Заметка обновлена" : "Заметка создана");
      closeEditor();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      const res = await apiAuthFetch(`/api/notes/${deleteCandidate.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Не удалось удалить заметку");
      setNotes((prev) => prev.filter((note) => note.id !== deleteCandidate.id));
      setNoteCache((prev) => {
        const copy = { ...prev };
        delete copy[deleteCandidate.id];
        return copy;
      });
      toast.success("Заметка удалена");
      setDeleteCandidate(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Ошибка при удалении");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-indigo-100 bg-white/90 p-6 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/80">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Заметки / Настройки</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Авторские материалы и заметки с внутренними настройками инфраструктуры.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => openEditor(null)}
            className="btn btn-primary"
          >
            Добавить заметку
          </button>
        )}
      </div>

      {/* Toolbar row with optional search */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Всего заметок: {notes.length}
        </div>
        <div className="relative w-full max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск заметок..."
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

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[0, 1].map((key) => (
            <div key={key} className="h-36 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50/80 p-5 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      ) : notes.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Пока нет ни одной заметки. {isAdmin ? "Нажмите «Добавить заметку», чтобы создать первую запись." : "Обратитесь к администратору, чтобы получить доступ к материалам."}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(search
            ? notes.filter((n) => {
                const q = search.toLowerCase();
                return (
                  String(n.title || "").toLowerCase().includes(q) ||
                  String(n.description || "").toLowerCase().includes(q)
                );
              })
            : notes
          ).map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSelect={openViewer}
              onEdit={openEditor}
              onDelete={setDeleteCandidate}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      <NotesEditorModal
        open={editorContext.open}
        initialValue={editorContext.data}
        onClose={closeEditor}
        onSubmit={handleSave}
        loading={saving}
      />

      <NoteViewerModal note={viewerNote} onClose={() => setViewerNote(null)} />

      <ConfirmDeleteModal
        note={deleteCandidate}
        loading={deleting}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleDelete}
      />
    </section>
  );
}
