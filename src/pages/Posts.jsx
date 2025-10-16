// encoding: utf-8
import React from "react";
import PageShell from "../components/PageShell.jsx";

const STORAGE_KEY = "posts";

export default function Posts() {
  const [text, setText] = React.useState("");
  const [posts, setPosts] = React.useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn("Не удалось прочитать сохранённые посты", error);
      return [];
    }
  });

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    setPosts((prev) => [
      {
        text: text.trim(),
        date: new Date().toLocaleString("ru-RU"),
        id: crypto.randomUUID ? crypto.randomUUID() : `post-${Date.now()}`,
      },
      ...prev,
    ]);
    setText("");
  };

  return (
    <PageShell
      title="Посты"
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
          placeholder="Запишите идею, вопрос для команды или напоминание..."
          rows={4}
          className="posts__textarea rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
        />
        <div className="posts__actions flex justify-end">
          <button
            type="submit"
            className="posts__submit inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Сохранить
          </button>
        </div>
      </form>

      <section className="posts__list space-y-3">
        {posts.length === 0 ? (
          <p className="posts__empty rounded-3xl border border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-slate-900/40 dark:text-gray-400">
            Пока записей нет. Добавьте заметку, чтобы зафиксировать мысль.
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
