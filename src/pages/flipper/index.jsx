// encoding: utf-8
import React from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell.jsx';
import { FlipperCategoryCard, FlipperFirmwareCard, FlipperModuleCard, FlipperArticleCard } from '../../components/flipper/Cards.jsx';

const blocks = [
  { id: 'basic', title: 'Базовые функции', href: '/flipper/basic' },
  { id: 'firmware', title: 'Кастомные прошивки', href: '/flipper/firmware' },
  { id: 'modules', title: 'Модули', href: '/flipper/modules' },
  { id: 'guides', title: 'Гайды', href: '/flipper/guides' },
  { id: 'vulns', title: 'Уязвимости', href: '/flipper/vulns' },
  { id: 'articles', title: 'Все статьи', href: '/flipper/articles' },
  { id: 'help', title: 'Справка', href: '/flipper/help' },
];

export default function FlipperIndex() {
  return (
    <PageShell title="Flipper Zero" contentClassName="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-500 p-8 text-white shadow-lg">
            <div className="absolute inset-0 opacity-20" aria-hidden="true">
              <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-white/30 blur-3xl" />
              <div className="absolute right-10 top-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
            </div>
            <div className="relative flex flex-col gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/80">Новый раздел</p>
              <h1 className="text-3xl font-bold leading-tight">Flipper Zero</h1>
              <p className="max-w-2xl text-sm text-white/90">
                Полный каталог базовых функций, кастомных прошивок, модулей, гайдов и уязвимостей. Переходите в нужный раздел через быстрые ссылки справа или блоки ниже.
              </p>
              <div className="flex flex-wrap gap-3">
                {blocks.map((link) => (
                  <Link key={link.id} to={link.href} className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/25">
                    {link.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="h-full rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-50">Быстрые ссылки</h2>
            <ul className="space-y-2">
              {blocks.map((link) => (
                <li key={link.id}>
                  <Link to={link.href} className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-slate-800/80">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700">
              Подстраницы уже готовы: списки и детали базовых функций, прошивок, модулей, гайдов, уязвимостей и всех статей.
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((b) => (
          <Link key={b.id} to={b.href} className="rounded-2xl border border-slate-100 bg-white/80 p-4 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50">{b.title}</div>
              <span className="text-xs text-indigo-600 dark:text-indigo-200">Открыть →</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Перейти к списку и карточкам</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
