// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { sharedLinksApi } from "../../api/sharedLinks.js";
import { apiAuthFetch } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const durationOptions = [
  { id: "1h", label: "1 час" },
  { id: "1d", label: "1 день" },
  { id: "1w", label: "1 неделя" },
  { id: "1m", label: "1 месяц" },
  { id: "forever", label: "Бессрочно" },
];

function formatDate(value, withTime = false) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return withTime ? d.toLocaleString("ru-RU") : d.toLocaleDateString("ru-RU");
}

function statusLabel(link) {
  if (!link) return "unknown";
  if (link.revoked || link.status === "revoked") return "revoked";
  const expired = link.status === "expired" || (link.expiresAt && new Date(link.expiresAt) <= new Date());
  if (expired) return "expired";
  return "active";
}

function statusTitle(status) {
  if (status === "revoked") return "Отозвана";
  if (status === "expired") return "Истекла";
  return "Активна";
}

function expiresInDays(link) {
  if (!link?.expiresAt) return "Бессрочно";
  const diff = new Date(link.expiresAt) - new Date();
  if (diff <= 0) return "Истекла";
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} дн.`;
}

function deriveDurationFromLink(link) {
  if (!link?.expiresAt) return "forever";
  const diffMs = new Date(link.expiresAt) - new Date();
  if (diffMs <= 60 * 60 * 1000) return "1h";
  if (diffMs <= 24 * 60 * 60 * 1000) return "1d";
  if (diffMs <= 7 * 24 * 60 * 60 * 1000) return "1w";
  if (diffMs <= 30 * 24 * 60 * 60 * 1000) return "1m";
  return "forever";
}

export default function SharedLinksAdmin() {
  const { user } = useAuth();
  const [links, setLinks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [users, setUsers] = React.useState([]);
  const [modal, setModal] = React.useState(null); // { mode, link, duration, ownerId }
  const [saving, setSaving] = React.useState(false);

  const loadLinks = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await sharedLinksApi.list();
      setLinks(data.links || data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Не удалось загрузить ссылки");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = React.useCallback(async () => {
    try {
      const res = await apiAuthFetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Не удалось получить пользователей");
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Не удалось загрузить пользователей");
    }
  }, []);

  React.useEffect(() => {
    loadLinks();
    loadUsers();
  }, [loadLinks, loadUsers]);

  const openCreate = () => {
    setModal({
      mode: "create",
      duration: "1d",
      ownerId: user?.id || null,
      link: null,
    });
  };

  const openManage = (link) => {
    if (!link) return;
    setModal({
      mode: "manage",
      duration: deriveDurationFromLink(link),
      ownerId: link.ownerId,
      link,
    });
  };

  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.mode === "create") {
        const payload = {
          pageType: "wish-list",
          duration: modal.duration,
          ownerId: modal.ownerId || undefined,
        };
        const data = await sharedLinksApi.create(payload);
        const newLink = data.link || data;
        setModal((prev) => ({ ...prev, link: newLink, mode: "manage" }));
        toast.success("Ссылка создана");
        loadLinks();
      } else if (modal.link) {
        const payload = { duration: modal.duration };
        const data = await sharedLinksApi.update(modal.link.id, payload);
        const updated = data.link || data;
        setModal((prev) => ({ ...prev, link: updated }));
        toast.success("Ссылка обновлена");
        loadLinks();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!modal?.link) return;
    setSaving(true);
    try {
      await sharedLinksApi.revoke(modal.link.id);
      toast.success("Ссылка отозвана");
      loadLinks();
      setModal((prev) => (prev ? { ...prev, link: { ...prev.link, revoked: true, status: "revoked" } } : prev));
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Не удалось отозвать ссылку");
    } finally {
      setSaving(false);
    }
  };

  const renderRow = (link) => {
    const status = statusLabel(link);
    const statusText = statusTitle(status);
    return (
      <tr key={link.id} className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/80">
        <td className="px-3 py-2 text-xs font-mono text-slate-500 dark:text-slate-400">{link.id}</td>
        <td className="px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{link.ownerUsername || "-"}</td>
        <td className="px-3 py-2 text-sm">Wish List</td>
        <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
          {["view", "edit", "create", "delete"]
            .map((p) => `${p}: ${link.permissions?.[p] ? "✓" : "-"}`)
            .join(" / ")}
        </td>
        <td className="px-3 py-2 text-sm">{formatDate(link.createdAt, true)}</td>
        <td className="px-3 py-2 text-sm">{expiresInDays(link)}</td>
        <td className="px-3 py-2 text-sm">{link.openedAt ? formatDate(link.openedAt, true) : "-"}</td>
        <td className="px-3 py-2 text-sm text-center">{link.viewsCount ?? 0}</td>
        <td className="px-3 py-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              status === "active"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100"
                : status === "expired"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-50"
                : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-50"
            }`}
          >
            {statusText}
          </span>
        </td>
        <td className="px-3 py-2 text-right">
          <button
            type="button"
            onClick={() => openManage(link)}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-indigo-700"
          >
            Управлять
          </button>
        </td>
      </tr>
    );
  };

  const modalLink = modal?.link;
  const shareUrl = modalLink?.token ? `${window.location.origin}/shared/${modalLink.token}` : null;

  return (
    <PageShell title="Публичные ссылки" contentClassName="bg-transparent">
      <div className="rounded-3xl bg-white/90 p-4 shadow ring-1 ring-slate-100 dark:bg-slate-900/80 dark:ring-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Управление шэрингом</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Создание и контроль публичных ссылок на Wish List</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={loadLinks}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-100 transition hover:bg-indigo-50 dark:bg-slate-800 dark:text-indigo-200 dark:ring-slate-700"
            >
              Обновить
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              + Создать
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-slate-100 dark:ring-slate-800">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Владелец</th>
                <th className="px-3 py-3">Страница</th>
                <th className="px-3 py-3">Права</th>
                <th className="px-3 py-3">Создано</th>
                <th className="px-3 py-3">Истекает</th>
                <th className="px-3 py-3">Первое открытие</th>
                <th className="px-3 py-3 text-center">Просмотры</th>
                <th className="px-3 py-3">Статус</th>
                <th className="px-3 py-3 text-right">Управление</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {links.map((link) => renderRow(link))}
              {!links.length && (
                <tr>
                  <td colSpan={10} className="px-3 py-5 text-center text-slate-400 dark:text-slate-500">
                    Пока нет созданных ссылок
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700">
            Загружаю...
          </div>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => !saving && closeModal()}
        title={modal?.mode === "create" ? "Создание ссылки" : "Управление ссылкой"}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex flex-wrap items-center gap-3">
            {modal?.mode === "manage" && modalLink && !modalLink.revoked && (
              <button
                type="button"
                onClick={handleRevoke}
                className="text-sm font-semibold text-rose-500 hover:text-rose-600"
                disabled={saving}
              >
                Отозвать
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                disabled={saving}
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                disabled={saving}
              >
                {modal?.mode === "create" ? "Создать" : "Сохранить"}
              </button>
            </div>
          </div>
        }
      >
        {modal && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Владелец
                <select
                  value={modal.ownerId ?? ""}
                  onChange={(e) => setModal((prev) => ({ ...prev, ownerId: e.target.value ? Number(e.target.value) : null }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:border-indigo-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  disabled={modal.mode !== "create"}
                >
                  <option value="">От текущего пользователя</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Срок действия
                <select
                  value={modal.duration}
                  onChange={(e) => setModal((prev) => ({ ...prev, duration: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:border-indigo-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  disabled={modalLink?.revoked}
                >
                  {durationOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {modalLink && (
              <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Токен</div>
                <div className="font-mono text-xs break-all">{modalLink.token}</div>
                {shareUrl && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="truncate">{shareUrl}</span>
                    <button
                      type="button"
                      onClick={() => navigator?.clipboard?.writeText(shareUrl).catch(() => {})}
                      className="rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
                    >
                      Скопировать
                    </button>
                  </div>
                )}
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Создано: {formatDate(modalLink.createdAt, true)} • Статус: {statusTitle(statusLabel(modalLink))}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Просмотров: {modalLink.viewsCount ?? 0} • Первое открытие: {modalLink.openedAt ? formatDate(modalLink.openedAt, true) : "-"}
                </div>
                {modalLink.revoked && <div className="text-xs font-semibold text-rose-600">Ссылка отозвана</div>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageShell>
  );
}
