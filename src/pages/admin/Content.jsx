// encoding: utf-8
import React from "react";
import PageShell from "../../components/PageShell.jsx";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { apiFetch } from "../../utils/api.js";

const TABS = [
  { key: 'articles', label: 'Статьи', api: 'article' },
  { key: 'posts', label: 'Посты', api: 'post' },
  { key: 'links', label: 'Ссылки', api: 'link' },
];

export default function AdminContent() {
  const [active, setActive] = React.useState('articles');
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', url: '', description: '' });
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const load = async () => {
    try {
      setLoading(true);
      const cur = TABS.find(t => t.key === active);
      const res = await apiFetch(`/api/admin/content?type=${cur.api}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Ошибка загрузки');
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось загрузить контент');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [active]);

  const create = async (e) => {
    e.preventDefault();
    try {
      const cur = TABS.find(t => t.key === active);
      const res = await apiFetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: cur.api, ...form })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Ошибка создания');
      setForm({ title: '', url: '', description: '' });
      toast.success('Создано');
      load();
    } catch (e) {
      console.error(e);
      toast.error('Не удалось создать запись');
    }
  };

  const remove = async (id) => {
    try {
      const res = await apiFetch(`/api/admin/content/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      toast.success('Удалено');
      setItems((l) => l.filter((i) => i.id !== id));
    } catch {
      toast.error('Не удалось удалить');
    }
  };

  return (
    <PageShell title="Контент портала" contentClassName="p-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActive(t.key)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${active === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={create} className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          Заголовок
          <input className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="text-sm">
          URL
          <input className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </label>
        <label className="text-sm md:col-span-2">
          Описание
          <textarea rows={3} className="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Добавить</button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-slate-900">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Заголовок</th>
              <th className="px-4 py-3 font-semibold">URL</th>
              <th className="px-4 py-3 font-semibold">Дата</th>
              <th className="px-4 py-3 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {loading ? (
                <tr><td className="px-4 py-3 text-gray-500" colSpan={5}>Загрузка…</td></tr>
              ) : (
                items.map((i) => (
                  <motion.tr key={i.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                    <td className="px-4 py-3">{i.id}</td>
                    <td className="px-4 py-3">{i.title}</td>
                    <td className="px-4 py-3 text-blue-600"><a href={i.url} target="_blank" rel="noreferrer">{i.url || '—'}</a></td>
                    <td className="px-4 py-3">{new Date(i.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => remove(i.id)} className="rounded bg-red-600 px-3 py-1 text-white">Удалить</button>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
