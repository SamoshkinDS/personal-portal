// encoding: utf-8
import React from "react";
import PageShell from "../components/PageShell.jsx";
import { apiAuthFetch } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Posts() {
  const { user } = useAuth();
  const [text, setText] = React.useState("");
  const [posts, setPosts] = React.useState([]);

  // Load posts when authenticated
  React.useEffect(() => {
    let ignore = false;
    async function load() {
      if (!user) return;
      try {
        const res = await apiAuthFetch("/api/posts");
        if (!res.ok) throw new Error("Failed to load posts");
        const data = await res.json();
        const mapped = (data.posts || []).map(p => ({ id: p.id, text: p.text, date: new Date(p.created_at).toLocaleString("ru-RU") }));
        if (!ignore) setPosts(mapped);
      } catch (e) {
        console.error(e);
        if (!ignore) setPosts([]);
      }
    }
    load();
    return () => { ignore = true; };
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || !user) return;
    const tempId = crypto.randomUUID ? crypto.randomUUID() : `post-${Date.now()}`;
    const optimistic = { id: tempId, text: value, date: new Date().toLocaleString("ru-RU") };
    setPosts(prev => [optimistic, ...prev]);
    setText("");
    try {
      const res = await apiAuthFetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value })
      });
      if (!res.ok) throw new Error("Create failed");
      const data = await res.json();
      const created = data.post;
      const mapped = { id: created.id, text: created.text, date: new Date(created.created_at).toLocaleString("ru-RU") };
      setPosts(prev => prev.map(p => p.id === tempId ? mapped : p));
    } catch (e) {
      console.error(e);
      // rollback
      setPosts(prev => prev.filter(p => p.id !== tempId));
      setText(value);
    }
  };

  return (
    <PageShell
      title="Заметки"
      contentClassName="posts posts--notes flex flex-col gap-6 bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/70"
    >
      <form
        onSubmit={handleSubmit}
        className="posts__editor flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-500 dark:border-gray-700 dark:bg-slate-900"
      >
        <label className="posts__label text-sm font-semibold text-gray-700 dark:text-gray-200">
          Быстрая заметка
        </label>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Запишите мысль, идею, факт..."
          rows={4}
          className="posts__textarea rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
        />
        <div className="posts__actions flex justify-end">
          <button
            type="submit"
            className="posts__submit inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Добавить
          </button>
        </div>
      </form>

      <section className="posts__list space-y-3">
        {posts.length === 0 ? (
          <p className="posts__empty rounded-3xl border border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-slate-900/40 dark:text-gray-400">
            Пока нет заметок. Добавьте первую, чтобы начать.
          </p>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className="posts__item rounded-3xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 dark:border-gray-700 dark:bg-slate-900"
            >
              <p className="posts__text text-sm text-gray-800 dark:text-gray-100">
                {post.text}
              </p>
              <time
                dateTime={post.date}
                className="posts__date mt-3 block text-xs text-gray-400 dark:text-gray-500"
              >
                {post.date}
              </time>
            </article>
          ))
        )}
      </section>
    </PageShell>
  );
}

