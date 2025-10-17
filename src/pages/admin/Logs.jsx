// encoding: utf-8
import React from "react";
import PageShell from "../../components/PageShell.jsx";
import toast from "react-hot-toast";
import { apiFetch } from "../../utils/api.js";

export default function AdminLogs() {
  const [logs, setLogs] = React.useState([]);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Ошибка загрузки');
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось загрузить журнал');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await apiFetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text.trim() })
      });
      if (!res.ok) throw new Error();
      setText("");
      load();
    } catch {
      toast.error('Не удалось записать в журнал');
    }
  };

  return (
    <PageShell title="Журнал действий" contentClassName="p-6">
      <form onSubmit={add} className="mb-4 flex gap-2">
        <input className="flex-1 rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100" value={text} onChange={(e) => setText(e.target.value)} placeholder="Сообщение" />
        <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Добавить</button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold">Дата/время</th>
              <th className="px-4 py-3 font-semibold">Сообщение</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-3 text-gray-500" colSpan={2}>Загрузка…</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{l.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
