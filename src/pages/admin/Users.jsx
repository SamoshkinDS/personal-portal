// encoding: utf-8
import React from "react";
import { motion } from "framer-motion";
import PageShell from "../../components/PageShell.jsx";
import toast from "react-hot-toast";

const ROLES = [
  { value: "ALL", label: "Доступ ко всему" },
  { value: "NON_ADMIN", label: "Всё, кроме Админ-панели" },
  { value: "ANALYTICS", label: "Только Аналитика" },
  { value: "NEURAL", label: "Только Нейросервисы" },
  { value: "VPN", label: "Только VPN" },
];

export default function AdminUsers() {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:4000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Ошибка загрузки");
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
      toast.error("Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const setBlocked = async (id, isBlocked) => {
    const res = await fetch(`http://localhost:4000/api/admin/users/${id}/block`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isBlocked }),
    });
    if (!res.ok) {
      toast.error("Не удалось обновить статус");
    } else {
      toast.success(isBlocked ? "Пользователь заблокирован" : "Пользователь разблокирован");
      load();
    }
  };

  const setRole = async (id, role, vpnCanCreate) => {
    const res = await fetch(`http://localhost:4000/api/admin/users/${id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role, vpnCanCreate }),
    });
    if (!res.ok) {
      toast.error("Не удалось изменить роль");
    } else {
      toast.success("Роль обновлена");
      load();
    }
  };

  return (
    <PageShell title="Пользователи" contentClassName="p-6">
      {loading ? (
        <p className="text-sm text-gray-500">Загрузка...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-slate-900">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Логин</th>
                <th className="px-4 py-3 font-semibold">Имя</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Телефон</th>
                <th className="px-4 py-3 font-semibold">Регистрация</th>
                <th className="px-4 py-3 font-semibold">Роль</th>
                <th className="px-4 py-3 font-semibold">VPN create</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
                <th className="px-4 py-3 font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3">{u.name || "—"}</td>
                  <td className="px-4 py-3">{u.email || "—"}</td>
                  <td className="px-4 py-3">{u.phone || "—"}</td>
                  <td className="px-4 py-3">{new Date(u.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-slate-800"
                      value={u.role}
                      onChange={(e) => setRole(u.id, e.target.value, u.vpn_can_create)}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={!!u.vpn_can_create}
                        onChange={(e) => setRole(u.id, u.role, e.target.checked)}
                      />
                      может создавать ключ
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_blocked ? (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">заблокирован</span>
                    ) : (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">активен</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_blocked ? (
                      <button className="rounded bg-emerald-600 px-3 py-1 text-white" onClick={() => setBlocked(u.id, false)}>Разблокировать</button>
                    ) : (
                      <button className="rounded bg-red-600 px-3 py-1 text-white" onClick={() => setBlocked(u.id, true)}>Заблокировать</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}

