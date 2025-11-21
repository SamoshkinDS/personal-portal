// encoding: utf-8
import React from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import { apiFetch } from "../../utils/api.js";

const ROLES = [
  { value: "ALL", label: "Администратор (ALL)" },
  { value: "NON_ADMIN", label: "Пользователь" },
  { value: "ANALYTICS", label: "Аналитика" },
  { value: "NEURAL", label: "AI" },
  { value: "VPN", label: "VPN" },
];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU");
}

export default function AdminUsers() {
  const [users, setUsers] = React.useState([]);
  const [requests, setRequests] = React.useState([]);
  const [loadingUsers, setLoadingUsers] = React.useState(true);
  const [loadingReqs, setLoadingReqs] = React.useState(false);
  const [allPerms, setAllPerms] = React.useState([]);
  const [userPerms, setUserPerms] = React.useState({});
  const [modalState, setModalState] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [rejectTarget, setRejectTarget] = React.useState(null);
  const [approveLoading, setApproveLoading] = React.useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = React.useState(tabParam === "requests" ? "requests" : "users");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const setTabAndQuery = (next) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    if (next === "users") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params);
  };

  const loadUsers = React.useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await apiFetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Не удалось загрузить пользователей");
      const list = data.users || [];
      setUsers(list);

      const permRes = await apiFetch("/api/admin/permissions", { headers: { Authorization: `Bearer ${token}` } });
      if (permRes.ok) {
        const permData = await permRes.json();
        setAllPerms(permData.permissions || []);
      }
      const permsMap = {};
      await Promise.all(
        list.map(async (u) => {
          try {
            const pr = await apiFetch(`/api/admin/users/${u.id}/permissions`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const pd = await pr.json();
            permsMap[u.id] = new Set(pd.permissions || []);
          } catch {
            permsMap[u.id] = new Set();
          }
        })
      );
      setUserPerms(permsMap);
      return list;
    } catch (e) {
      console.error(e);
      toast.error("Не удалось загрузить пользователей");
      return [];
    } finally {
      setLoadingUsers(false);
    }
  }, [token]);

  const loadRequests = React.useCallback(async () => {
    setLoadingReqs(true);
    try {
      const res = await apiFetch("/api/admin/registration-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Не удалось загрузить заявки");
      setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
      toast.error("Не удалось загрузить заявки");
    } finally {
      setLoadingReqs(false);
    }
  }, [token]);

  React.useEffect(() => {
    loadUsers();
    loadRequests();
  }, [loadUsers, loadRequests]);

  const openModal = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const permsSet = new Set(userPerms[user.id] ? Array.from(userPerms[user.id]) : []);
    setModalState({
      user,
      role: user.role,
      vpn: !!user.vpn_can_create,
      blocked: !!user.is_blocked,
      perms: permsSet,
      original: {
        role: user.role,
        vpn: !!user.vpn_can_create,
        blocked: !!user.is_blocked,
        perms: new Set(permsSet),
      },
    });
  };

  const closeModal = () => setModalState(null);

  const togglePermission = (permKey) => {
    setModalState((prev) => {
      if (!prev) return prev;
      const nextPerms = new Set(prev.perms);
      if (nextPerms.has(permKey)) nextPerms.delete(permKey);
      else nextPerms.add(permKey);
      return { ...prev, perms: nextPerms };
    });
  };

  const setRole = async (userId, role, vpnCanCreate) => {
    const res = await apiFetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role, vpnCanCreate }),
    });
    if (!res.ok) throw new Error(await res.text());
  };

  const setBlocked = async (userId, isBlocked) => {
    const res = await apiFetch(`/api/admin/users/${userId}/block`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isBlocked }),
    });
    if (!res.ok) throw new Error(await res.text());
  };

  const savePermissions = async (userId, perms) => {
    const res = await apiFetch(`/api/admin/users/${userId}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ permissions: Array.from(perms) }),
    });
    if (!res.ok) throw new Error(await res.text());
  };

  const handleSave = async () => {
    if (!modalState) return;
    setSaving(true);
    try {
      const { user, role, vpn, blocked, perms, original } = modalState;
      const promises = [];
      if (role !== original.role || vpn !== original.vpn) {
        promises.push(setRole(user.id, role, vpn));
      }
      if (blocked !== original.blocked) {
        promises.push(setBlocked(user.id, blocked));
      }
      const permsChanged =
        perms.size !== original.perms.size || Array.from(perms).some((perm) => !original.perms.has(perm));
      if (permsChanged) {
        promises.push(savePermissions(user.id, perms));
      }
      await Promise.all(promises);
      toast.success("Права обновлены");
      closeModal();
      loadUsers();
    } catch (e) {
      console.error(e);
      toast.error("Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const approveRequest = async (reqId) => {
    setApproveLoading(true);
    try {
      const res = await apiFetch(`/api/admin/registration-requests/${reqId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Не удалось одобрить");
      toast.success("Заявка одобрена");
      await loadRequests();
      const list = await loadUsers();
      if (data?.userId) {
        const user = list.find((u) => u.id === data.userId);
        if (user) openModal(user.id);
      }
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Ошибка при одобрении");
    } finally {
      setApproveLoading(false);
    }
  };

  const rejectRequest = async () => {
    if (!rejectTarget) return;
    try {
      const res = await apiFetch(`/api/admin/registration-requests/${rejectTarget.id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Не удалось отклонить");
      toast.success("Заявка отклонена");
      setRejectTarget(null);
      loadRequests();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Ошибка при отклонении");
    }
  };

  const renderTabs = (
    <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm font-semibold text-slate-500">
      <button
        type="button"
        onClick={() => setTabAndQuery("users")}
        className={`rounded-full px-4 py-2 transition ${tab === "users" ? "bg-white text-indigo-600 shadow ring-1 ring-indigo-100" : "hover:text-indigo-500"}`}
      >
        Пользователи
      </button>
      <button
        type="button"
        onClick={() => setTabAndQuery("requests")}
        className={`rounded-full px-4 py-2 transition ${tab === "requests" ? "bg-white text-indigo-600 shadow ring-1 ring-indigo-100" : "hover:text-indigo-500"}`}
      >
        Заявки
      </button>
    </div>
  );

  const requestsTable = (
    <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Заявки на регистрацию</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Одобрите или отклоните заявки на вход.</p>
        </div>
      </div>

      {loadingReqs ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Загрузка заявок...</p>
      ) : requests.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Заявок пока нет.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Логин</th>
                <th className="px-3 py-2">Дата заявки</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-3 font-semibold text-slate-800 dark:text-slate-100">{r.login}</td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{formatDate(r.created_at)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        r.status === "pending"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200"
                          : r.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {r.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => approveRequest(r.id)}
                          disabled={approveLoading}
                          className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-60"
                        >
                          ✔ Подтвердить
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectTarget(r)}
                          className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-rose-600"
                        >
                          ✖ Отклонить
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Нет действий</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const usersList = (
    <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Пользователи</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Управляйте ролями, блокировкой и правами.</p>
        </div>
      </div>

      {loadingUsers ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Загрузка пользователей...</p>
      ) : users.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Пользователей пока нет.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {users.map((userItem) => (
            <li
              key={userItem.id}
              className="flex items-center justify-between gap-4 rounded-3xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-gray-700 dark:bg-slate-900"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userItem.username}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      userItem.is_blocked
                        ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
                        : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                    }`}
                  >
                    {userItem.is_blocked ? "Заблокирован" : "Активен"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Последний вход: {formatDate(userItem.last_login)}</p>
              </div>
              <button
                type="button"
                onClick={() => openModal(userItem.id)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-400/50 dark:hover:text-blue-200"
                aria-label="Открыть настройки пользователя"
              >
                ⚙
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <>
      <PageShell title="Пользователи" contentClassName="flex flex-col gap-6 bg-transparent p-0">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Управление пользователями</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Пользователи и заявки на доступ.</p>
          </div>
          {renderTabs}
        </section>

        {tab === "requests" ? requestsTable : usersList}
      </PageShell>

      <Modal open={!!modalState} onClose={saving ? () => {} : closeModal} title={modalState ? `Настройки: ${modalState.user.username}` : ""} maxWidth="max-w-3xl">
        {modalState && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-100 bg-white/70 p-4 dark:border-gray-700 dark:bg-slate-900/70">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Профиль</h3>
              <dl className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Логин</dt>
                  <dd>{modalState.user.username}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Создан</dt>
                  <dd>{formatDate(modalState.user.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Последний вход</dt>
                  <dd>{formatDate(modalState.user.last_login)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white/70 p-4 dark:border-gray-700 dark:bg-slate-900/70">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Роли и доступы</h3>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={!modalState.blocked}
                    onChange={(event) => setModalState((prev) => ({ ...prev, blocked: !event.target.checked }))}
                  />
                  Активен
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={modalState.vpn}
                    onChange={(event) => setModalState((prev) => ({ ...prev, vpn: event.target.checked }))}
                  />
                  Может создавать VPN-ключи
                </label>
                <select
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
                  value={modalState.role}
                  onChange={(event) => setModalState((prev) => ({ ...prev, role: event.target.value }))}
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white/70 p-4 dark:border-gray-700 dark:bg-slate-900/70">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Права доступа</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {modalState.perms.size} / {allPerms.length}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {allPerms.map((perm) => (
                  <label
                    key={perm.key}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs transition ${
                      modalState.perms.has(perm.key)
                        ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/50 dark:bg-blue-500/10 dark:text-blue-200"
                        : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300"
                    }`}
                  >
                    <input type="checkbox" checked={modalState.perms.has(perm.key)} onChange={() => togglePermission(perm.key)} />
                    <span className="font-medium">{perm.key}</span>
                    <span className="hidden text-gray-400 dark:text-gray-500 sm:inline">· {perm.description}</span>
                  </label>
                ))}
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-800 disabled:opacity-60"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Сохранение..." : "Сохранить изменения"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title={rejectTarget ? `Отклонить заявку ${rejectTarget.login}?` : ""}
        maxWidth="max-w-md"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">Заявка останется в истории со статусом «rejected».</p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setRejectTarget(null)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={rejectRequest}
            className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Отклонить
          </button>
        </div>
      </Modal>
    </>
  );
}
