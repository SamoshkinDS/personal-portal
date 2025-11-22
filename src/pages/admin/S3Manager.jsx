import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { s3Api } from "../../api/s3.js";

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} ГБ`;
}

export default function S3Manager() {
  const [buckets, setBuckets] = React.useState([]);
  const [selectedBucket, setSelectedBucket] = React.useState(null);
  const [objects, setObjects] = React.useState({ folders: [], files: [], prefix: "" });
  const [loadingBuckets, setLoadingBuckets] = React.useState(true);
  const [loadingObjects, setLoadingObjects] = React.useState(false);
  const [selection, setSelection] = React.useState(null); // { type: 'folder'|'file', name }
  const [modals, setModals] = React.useState({
    createBucket: false,
    createFolder: false,
    upload: false,
    confirmDelete: false,
  });
  const [formValues, setFormValues] = React.useState({
    bucketName: "",
    folderName: "",
    uploadFile: null,
  });

  React.useEffect(() => {
    loadBuckets();
  }, []);

  const loadBuckets = async () => {
    try {
      setLoadingBuckets(true);
      const list = await s3Api.listBuckets();
      setBuckets(list);
      if (list.length && !selectedBucket) {
        setSelectedBucket(list[0].name);
        loadObjects(list[0].name, "");
      }
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить бакеты");
    } finally {
      setLoadingBuckets(false);
    }
  };

  const loadObjects = async (bucket, prefix = "") => {
    if (!bucket) return;
    try {
      setLoadingObjects(true);
      setSelection(null);
      const data = await s3Api.listObjects(bucket, prefix);
      setObjects({
        folders: data.folders || [],
        files: data.files || [],
        prefix: data.prefix || "",
        publicBase: data.publicBase || "",
      });
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить содержимое");
    } finally {
      setLoadingObjects(false);
    }
  };

  const currentPathParts = React.useMemo(() => {
    if (!objects.prefix) return [];
    return objects.prefix.replace(/\/$/, "").split("/").filter(Boolean);
  }, [objects.prefix]);

  const selectedKey = React.useMemo(() => {
    if (!selection) return null;
    if (selection.type === "folder") return `${objects.prefix}${selection.name}`;
    if (selection.type === "file") return selection.name;
    return null;
  }, [selection, objects.prefix]);

  const handleCreateBucket = async () => {
    const name = formValues.bucketName.trim();
    if (!name) {
      toast.error("Укажите имя бакета");
      return;
    }
    try {
      await s3Api.createBucket(name);
      toast.success("Бакет создан");
      setModals((p) => ({ ...p, createBucket: false }));
      setFormValues((p) => ({ ...p, bucketName: "" }));
      await loadBuckets();
    } catch (error) {
      toast.error(error.message || "Не удалось создать бакет");
    }
  };

  const handleDeleteBucket = async () => {
    if (!selectedBucket) return;
    if (!window.confirm(`Удалить бакет ${selectedBucket}?`)) return;
    try {
      await s3Api.deleteBucket(selectedBucket);
      toast.success("Бакет удалён");
      setSelectedBucket(null);
      setObjects({ folders: [], files: [], prefix: "" });
      await loadBuckets();
    } catch (error) {
      toast.error(error.message || "Не удалось удалить бакет");
    }
  };

  const handleCreateFolder = async () => {
    if (!selectedBucket) return;
    const name = formValues.folderName.trim();
    if (!name) {
      toast.error("Введите имя папки");
      return;
    }
    const path = `${objects.prefix}${name}/`;
    try {
      await s3Api.createFolder(selectedBucket, path);
      toast.success("Папка создана");
      setModals((p) => ({ ...p, createFolder: false }));
      setFormValues((p) => ({ ...p, folderName: "" }));
      await loadObjects(selectedBucket, objects.prefix);
    } catch (error) {
      toast.error(error.message || "Не удалось создать папку");
    }
  };

  const handleUpload = async () => {
    if (!selectedBucket) return;
    const file = formValues.uploadFile;
    if (!file) {
      toast.error("Выберите файл");
      return;
    }
    try {
      await s3Api.uploadFile(selectedBucket, file, objects.prefix);
      toast.success("Файл загружен");
      setModals((p) => ({ ...p, upload: false }));
      setFormValues((p) => ({ ...p, uploadFile: null }));
      await loadObjects(selectedBucket, objects.prefix);
    } catch (error) {
      toast.error(error.message || "Не удалось загрузить файл");
    }
  };

  const handleDeleteSelection = async () => {
    if (!selection || !selectedBucket) return;
    try {
      if (selection.type === "file") {
        await s3Api.deleteFile(selectedBucket, selection.name);
      } else if (selection.type === "folder") {
        await s3Api.deleteFolder(selectedBucket, `${objects.prefix}${selection.name}`);
      }
      toast.success("Удалено");
      setModals((p) => ({ ...p, confirmDelete: false }));
      setSelection(null);
      await loadObjects(selectedBucket, objects.prefix);
    } catch (error) {
      toast.error(error.message || "Не удалось удалить");
    }
  };

  const handleMakePublic = async () => {
    if (!selectedBucket) return;
    try {
      await s3Api.makePublic(selectedBucket);
      toast.success("Бакет сделан публичным");
    } catch (error) {
      toast.error(error.message || "Не удалось применить политику");
    }
  };

  const handleMakePrivate = async () => {
    if (!selectedBucket) return;
    try {
      await s3Api.makePrivate(selectedBucket);
      toast.success("Бакет сделан приватным");
    } catch (error) {
      toast.error(error.message || "Не удалось удалить политику");
    }
  };

  const handleNavigatePrefix = (partIndex) => {
    if (!selectedBucket) return;
    const next = partIndex < 0 ? "" : `${currentPathParts.slice(0, partIndex + 1).join("/")}/`;
    setObjects((prev) => ({ ...prev, prefix: next }));
    setSelection(null);
    loadObjects(selectedBucket, next);
  };

  const copyLink = () => {
    if (!selection || selection.type !== "file") return;
    const base = objects.publicBase || "";
    if (!base) {
      toast.error("Публичный base URL не настроен");
      return;
    }
    const url = `${base.replace(/\/$/, "")}/${selection.name}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Ссылка скопирована"))
      .catch(() => toast.error("Не удалось скопировать ссылку"));
  };

  return (
    <PageShell title="S3 Storage Manager" contentClassName="flex flex-col gap-3 bg-transparent p-0">
      <div className="flex flex-col gap-3 md:flex-row">
        <aside className="w-full md:w-64 shrink-0 rounded-3xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Buckets</h3>
            <button
              type="button"
              onClick={() => setModals((p) => ({ ...p, createBucket: true }))}
              className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-500"
            >
              Add
            </button>
          </div>
          <div className="mt-3 space-y-1">
            {loadingBuckets ? (
              <div className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ) : buckets.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Нет бакетов.</p>
            ) : (
              buckets.map((b) => {
                const active = b.name === selectedBucket;
                return (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => {
                      setSelectedBucket(b.name);
                      loadObjects(b.name, "");
                    }}
                    className={`flex w-full flex-col rounded-2xl px-3 py-2 text-left text-sm shadow-sm transition ${
                      active
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-100 dark:ring-blue-400/40"
                        : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span className="font-semibold">{b.name}</span>
                    {b.created && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(b.created).toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

      <section className="flex min-w-0 flex-1 flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
          <button
            type="button"
            onClick={() => handleNavigatePrefix(-1)}
            className="rounded-full border border-slate-200 px-2 py-1 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700"
          >
            Buckets
          </button>
          {currentPathParts.map((part, idx) => (
            <React.Fragment key={part + idx}>
              <span>/</span>
              <button
                type="button"
                onClick={() => handleNavigatePrefix(idx)}
                className="rounded-full border border-slate-200 px-2 py-1 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700"
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {selectedBucket && (
            <>
              <button
                type="button"
                onClick={() => setModals((p) => ({ ...p, createFolder: true }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200"
              >
                Create Folder
              </button>
              <button
                type="button"
                onClick={() => setModals((p) => ({ ...p, upload: true }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200"
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={handleMakePublic}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-300 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100"
              >
                Make Public
              </button>
              <button
                type="button"
                onClick={handleMakePrivate}
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:border-amber-300 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100"
              >
                Make Private
              </button>
              <button
                type="button"
                onClick={handleDeleteBucket}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:border-rose-300 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100"
              >
                Delete Bucket
              </button>
            </>
          )}
          {selection?.type === "folder" && (
            <>
              <button
                type="button"
                onClick={() => setModals((p) => ({ ...p, upload: true }))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200"
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setModals((p) => ({ ...p, confirmDelete: true }))}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:border-rose-300 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100"
              >
                Delete Folder
              </button>
            </>
          )}
          {selection?.type === "file" && (
            <>
              <a
                href={
                  objects.publicBase
                    ? `${objects.publicBase.replace(/\/$/, "")}/${selection.name}`
                    : "#"
                }
                download
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200"
              >
                Download
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200"
              >
                Copy Public Link
              </button>
              <button
                type="button"
                onClick={() => setModals((p) => ({ ...p, confirmDelete: true }))}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:border-rose-300 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100"
              >
                Delete
              </button>
            </>
          )}
        </div>

        <div className="min-h-[320px] flex-1 rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-inner dark:border-slate-800/70 dark:bg-slate-900/60">
          {loadingObjects ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">
              Загрузка...
            </div>
          ) : !selectedBucket ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              Выберите бакет
            </div>
          ) : objects.folders.length === 0 && objects.files.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              Пусто. Создайте папку или загрузите файл.
            </div>
          ) : (
            <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
              {objects.folders.map((folder) => (
                <button
                  key={folder}
                  type="button"
                  onClick={() => {
                    const nextPrefix = folder;
                    loadObjects(selectedBucket, nextPrefix);
                  }}
                  onFocus={() =>
                    setSelection({
                      type: "folder",
                      name: folder.replace(objects.prefix, "").replace(/\/$/, ""),
                    })
                  }
                  onMouseOver={() =>
                    setSelection({
                      type: "folder",
                      name: folder.replace(objects.prefix, "").replace(/\/$/, ""),
                    })
                  }
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-800/70 dark:bg-slate-800/60 dark:text-slate-200"
                >
                  <span className="text-xl">📁</span>
                  <span className="truncate">{folder.replace(objects.prefix, "")}</span>
                </button>
              ))}
              {objects.files.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => setSelection({ type: "file", name: file.name })}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selection?.type === "file" && selection.name === file.name
                      ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-100"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-600 dark:border-slate-800/70 dark:bg-slate-800/60 dark:text-slate-200"
                  }`}
                >
                  <span className="text-xl">📄</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{file.name.replace(objects.prefix, "")}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatSize(file.size)} •{" "}
                      {file.modified ? new Date(file.modified).toLocaleString() : "-"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      </div>

      <Modal
        open={modals.createBucket}
        onClose={() => setModals((p) => ({ ...p, createBucket: false }))}
        title="Create Bucket"
      >
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100">
            Название
            <input
              type="text"
              value={formValues.bucketName}
              onChange={(e) => setFormValues((p) => ({ ...p, bucketName: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModals((p) => ({ ...p, createBucket: false }))}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleCreateBucket}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Создать
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modals.createFolder}
        onClose={() => setModals((p) => ({ ...p, createFolder: false }))}
        title="Create Folder"
      >
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-100">
            Имя папки
            <input
              type="text"
              value={formValues.folderName}
              onChange={(e) => setFormValues((p) => ({ ...p, folderName: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 dark:border-slate-700 dark:text-white"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModals((p) => ({ ...p, createFolder: false }))}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleCreateFolder}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Создать
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modals.upload}
        onClose={() => setModals((p) => ({ ...p, upload: false }))}
        title="Upload File"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
            <input
              type="file"
              onChange={(e) =>
                setFormValues((p) => ({ ...p, uploadFile: e.target.files?.[0] || null }))
              }
            />
            {formValues.uploadFile && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                {formValues.uploadFile.name} ({formatSize(formValues.uploadFile.size)})
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModals((p) => ({ ...p, upload: false }))}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleUpload}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Загрузить
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modals.confirmDelete}
        onClose={() => setModals((p) => ({ ...p, confirmDelete: false }))}
        title="Подтверждение удаления"
      >
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
          <p>
            Удалить {selection?.type === "file" ? "файл" : "папку"}{" "}
            <strong>{selectedKey}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModals((p) => ({ ...p, confirmDelete: false }))}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleDeleteSelection}
              className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
            >
              Удалить
            </button>
          </div>
        </div>
      </Modal>
    </PageShell>
    );
  }
