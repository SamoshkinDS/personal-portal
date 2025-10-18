// encoding: utf-8
import React from "react";
import PageShell from "../../components/PageShell.jsx";
import Modal from "../../components/Modal.jsx";
import toast from "react-hot-toast";
import { apiFetch } from "../../utils/api.js";

const ROLES = [
  { value: "ALL", label: "Администратор (ALL)" },
  { value: "NON_ADMIN", label: "Пользователь" },
  { value: "ANALYTICS", label: "Аналитика" },
  { value: "NEURAL", label: "AI" },
  { value: "VPN", label: "VPN" },
];

function formatDate(dateValue) {
  if (!dateValue) return "ещё не входил";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU");
}

export default function AdminUsers() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [allPerms, setAllPerms] = React.useState([]);
  const [userPerms, setUserPerms] = React.useState({});
  const [modalState, setModalState] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Ошибка загрузки пользователей");
      const list = data.users || [];
      setUsers(list);

      const [permRes, userPermsMap] = await Promise.all([
        apiFetch("/api/admin/permissions", { headers: { Authorization: `Bearer ${token}` } }),
        (async () => {
          const map = {};
          await Promise.all(
            list.map(async (u) => {
              try {
                const pr = await apiFetch(`/api/admin/users/${u.id}/permissions`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const pd = await pr.json();
                map[u.id] = new Set(pd.permissions || []);
              } catch {
                map[u.id] = new Set();
              }
            })
          );
          return map;
        })(),
      ]);

      if (permRes.ok) {
        const permData = await permRes.json();
        setAllPerms(permData.permissions || []);
      }
      setUserPerms(userPermsMap);
    } catch (e) {
      console.error(e);
      toast.error("Не удалось загрузить список пользователей");
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openModal = (user) => {
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
        perms.size !== original.perms.size ||
        Array.from(perms).some((perm) => !original.perms.has(perm));
      if (permsChanged) {
        promises.push(savePermissions(user.id, perms));
      }
      await Promise.all(promises);
      toast.success("Профиль обновлён");
      closeModal();
      load();
    } catch (e) {
      console.error(e);
      toast.error("Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageShell title="Пользователи" contentClassName="flex flex-col gap-6 bg-transparent p-0">
        <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Список пользователей</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Здесь отражены все аккаунты. Чтобы изменить роль, статус или права — нажмите на иконку «Открыть».
          </p>
        </section>

        <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Загружаем пользователей…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Пользователей пока нет.</p>
          ) : (
            <ul className="space-y-3">
              {users.map((userItem) => (
                <li
                  key={userItem.id}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-gray-700 dark:bg-slate-900"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {userItem.username}
                      </span>
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
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Последний вход: {formatDate(userItem.last_login)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal(userItem)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-400/50 dark:hover:text-blue-200"
                    aria-label="Открыть карточку пользователя"
                  >
                    🔍
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageShell>

      <Modal
        open={!!modalState}
        onClose={saving ? () => {} : closeModal}
        title={modalState ? `Профиль пользователя: ${modalState.user.username}` : ""}
        maxWidth="max-w-3xl"
      >
        {modalState && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-100 bg-white/70 p-4 dark:border-gray-700 dark:bg-slate-900/70">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Информация</h3>
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
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Email</dt>
                  <dd>{modalState.user.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">Телефон</dt>
                  <dd>{modalState.user.phone || "—"}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-white/70 p-4 dark:border-gray-700 dark:bg-slate-900/70">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Статус и роль</h3>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={!modalState.blocked}
                    onChange={(event) =>
                      setModalState((prev) => ({ ...prev, blocked: !event.target.checked }))
                    }
                  />
                  Активен
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={modalState.vpn}
                    onChange={(event) =>
                      setModalState((prev) => ({ ...prev, vpn: event.target.checked }))
                    }
                  />
                  Может создавать VPN-ключи
                </label>
                <select
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
                  value={modalState.role}
                  onChange={(event) =>
                    setModalState((prev) => ({ ...prev, role: event.target.value }))
                  }
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
                    <input
                      type="checkbox"
                      checked={modalState.perms.has(perm.key)}
                      onChange={() => togglePermission(perm.key)}
                    />
                    <span className="font-medium">{perm.key}</span>
                    <span className="hidden text-gray-400 dark:text-gray-500 sm:inline">• {perm.description}</span>
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
                {saving ? "Сохраняем…" : "Сохранить изменения"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

