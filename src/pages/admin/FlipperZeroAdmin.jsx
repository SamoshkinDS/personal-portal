// encoding: utf-8
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import PageShell from '../../components/PageShell.jsx';
import {
  listCategories, createCategory, updateCategory, deleteCategory,
  listFirmwares, createFirmware, updateFirmware, deleteFirmware,
  listModules, createModule, updateModule, deleteModule,
  listArticles, createArticle, updateArticle, updateArticleStatus, deleteArticle,
  listQueue, createQueueTask, updateQueueTask, deleteQueueTask,
} from '../../api/flipper.js';

const ARTICLE_TYPES = ['feature_basic', 'feature_custom_fw', 'module_custom', 'guide_scenario', 'vuln_check'];
const CATEGORY_TYPES = ['basic', 'firmware', 'module', 'guide', 'vuln'];
const inputCls = 'rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900';
const btnCls = 'rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-indigo-700';
const btnMutedCls = 'rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800';
const btnSmallCls = 'rounded-lg border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800';

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1 text-sm text-slate-700 dark:text-slate-200">
    <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
    {children}
  </label>
);

const Card = ({ title, children, actions }) => (
  <div className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900/60 dark:ring-slate-800">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
      {actions}
    </div>
    {children}
  </div>
);

export default function FlipperZeroAdmin() {
  const [tab, setTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [firmwares, setFirmwares] = useState([]);
  const [modules, setModules] = useState([]);
  const [articles, setArticles] = useState([]);
  const [queue, setQueue] = useState([]);

  const [catFilter, setCatFilter] = useState('');
  const [catForm, setCatForm] = useState({ slug: '', title: '', description: '', type: 'basic', parent_id: '', position: 0 });
  const [catEdit, setCatEdit] = useState(null);

  const [fwForm, setFwForm] = useState({ slug: '', name: '', short_description: '', repo_url: '', homepage_url: '', is_custom: true, is_active: true });
  const [fwEdit, setFwEdit] = useState(null);

  const [modForm, setModForm] = useState({ slug: '', name: '', short_description: '', firmware_id: '', supported_firmwares: [], category_id: '', source_url: '', is_active: true });
  const [modEdit, setModEdit] = useState(null);
  const [modFilters, setModFilters] = useState({ firmware_id: '', category_id: '', search: '' });

  const [artForm, setArtForm] = useState({ title: '', slug: '', category_id: '', firmware_id: '', type: 'feature_basic', summary: '', content_raw: '', tags: '', status: 'draft' });
  const [artEdit, setArtEdit] = useState(null);
  const [artFilters, setArtFilters] = useState({ category_id: '', firmware_id: '', type: '', status: '' });

  const [queueFilters, setQueueFilters] = useState({ status: '', operation: '' });
  const [queueForm, setQueueForm] = useState({ operation: 'generate', payload: '{}', article_id: '', source: '' });

  const catOptions = useMemo(() => categories.map(c => ({ value: c.id, label: `${c.title} (${c.slug})` })), [categories]);
  const fwOptions = useMemo(() => firmwares.map(f => ({ value: f.id, label: `${f.name} (${f.slug})` })), [firmwares]);
  const filteredCats = useMemo(() => (catFilter ? categories.filter(c => c.type === catFilter) : categories), [categories, catFilter]);

  useEffect(() => { loadCats(); loadFw(); }, []);
  useEffect(() => { if (tab === 'modules') loadMods(); if (tab === 'articles') loadArts(); if (tab === 'queue') loadQueue(); }, [tab]);

  async function loadCats() { try { setCategories(await listCategories() || []); } catch { toast.error('Категории не загрузились'); } }
  async function loadFw() { try { setFirmwares(await listFirmwares() || []); } catch { toast.error('Прошивки не загрузились'); } }
  async function loadMods() { try { setModules(await listModules(modFilters) || []); } catch { toast.error('Модули не загрузились'); } }
  async function loadArts() { try { setArticles(await listArticles(artFilters) || []); } catch { toast.error('Статьи не загрузились'); } }
  async function loadQueue() { try { const data = await listQueue(queueFilters); setQueue(data?.items || []); } catch { toast.error('Очередь не загрузилась'); } }

  // --- Categories ---
  const saveCat = async (e) => {
    e.preventDefault();
    const payload = { ...catForm, parent_id: catForm.parent_id || null, position: Number(catForm.position) || 0 };
    try {
      if (catEdit) { await updateCategory(catEdit, payload); toast.success('Категория обновлена'); }
      else { await createCategory(payload); toast.success('Категория создана'); }
      setCatForm({ slug: '', title: '', description: '', type: 'basic', parent_id: '', position: 0 });
      setCatEdit(null);
      loadCats();
    } catch (err) { toast.error('Ошибка категории'); console.error(err); }
  };
  const editCat = (c) => { setCatEdit(c.id); setCatForm({ slug: c.slug, title: c.title, description: c.description || '', type: c.type, parent_id: c.parent_id || '', position: c.position || 0 }); };
  const delCat = async (id) => { if (!confirm('Удалить категорию?')) return; try { await deleteCategory(id); loadCats(); } catch (err) { toast.error('Удалить не удалось'); } };

  // --- Firmwares ---
  const saveFw = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...fwForm, short_description: fwForm.short_description || null };
      if (fwEdit) { await updateFirmware(fwEdit, payload); toast.success('Прошивка обновлена'); }
      else { await createFirmware(payload); toast.success('Прошивка создана'); }
      setFwForm({ slug: '', name: '', short_description: '', repo_url: '', homepage_url: '', is_custom: true, is_active: true });
      setFwEdit(null);
      loadFw();
    } catch (err) { toast.error('Ошибка прошивки'); console.error(err); }
  };
  const editFw = (f) => { setFwEdit(f.id); setFwForm({ slug: f.slug, name: f.name, short_description: f.short_description || '', repo_url: f.repo_url || '', homepage_url: f.homepage_url || '', is_custom: f.is_custom, is_active: f.is_active }); };
  const toggleFw = async (f) => { try { await updateFirmware(f.id, { is_active: !f.is_active }); loadFw(); } catch { toast.error('Не переключилось'); } };
  const delFw = async (id) => { if (!confirm('Удалить прошивку?')) return; try { await deleteFirmware(id); loadFw(); } catch { toast.error('Удалить не удалось'); } };

  // --- Modules ---
  const saveMod = async (e) => {
    e.preventDefault();
    const payload = { ...modForm, firmware_id: modForm.firmware_id || null, category_id: modForm.category_id || null, supported_firmwares: modForm.supported_firmwares.filter(Boolean), short_description: modForm.short_description || null, source_url: modForm.source_url || null };
    try {
      if (modEdit) { await updateModule(modEdit, payload); toast.success('Модуль обновлен'); }
      else { await createModule(payload); toast.success('Модуль создан'); }
      setModEdit(null);
      setModForm({ slug: '', name: '', short_description: '', firmware_id: '', supported_firmwares: [], category_id: '', source_url: '', is_active: true });
      loadMods();
    } catch (err) { toast.error('Ошибка модуля'); console.error(err); }
  };
  const editMod = (m) => { setModEdit(m.id); setModForm({ slug: m.slug, name: m.name, short_description: m.short_description || '', firmware_id: m.firmware_id || '', supported_firmwares: Array.isArray(m.supported_firmwares) ? m.supported_firmwares : [], category_id: m.category_id || '', source_url: m.source_url || '', is_active: m.is_active }); };
  const delMod = async (id) => { if (!confirm('Удалить модуль?')) return; try { await deleteModule(id); loadMods(); } catch { toast.error('Удалить не удалось'); } };

  // --- Articles ---
  const saveArt = async (e) => {
    e.preventDefault();
    const payload = { ...artForm, category_id: artForm.category_id || null, firmware_id: artForm.firmware_id || null, tags: artForm.tags ? artForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [] };
    try {
      if (artEdit) { await updateArticle(artEdit, payload); toast.success('Статья обновлена'); }
      else { await createArticle(payload); toast.success('Статья создана'); }
      setArtEdit(null);
      setArtForm({ title: '', slug: '', category_id: '', firmware_id: '', type: 'feature_basic', summary: '', content_raw: '', tags: '', status: 'draft' });
      loadArts();
    } catch (err) { toast.error('Ошибка статьи'); console.error(err); }
  };
  const editArt = (a) => { setArtEdit(a.id); setArtForm({ title: a.title, slug: a.slug, category_id: a.category_id || '', firmware_id: a.firmware_id || '', type: a.type, summary: a.summary || '', content_raw: a.content_raw || '', tags: Array.isArray(a.tags) ? a.tags.join(',') : '', status: a.status }); };
  const delArt = async (id) => { if (!confirm('Удалить статью?')) return; try { await deleteArticle(id); loadArts(); } catch { toast.error('Удалить не удалось'); } };
  const setArtStatus = async (a, status) => { try { await updateArticleStatus(a.id, status); loadArts(); } catch { toast.error('Статус не сменился'); } };

  // --- Queue ---
  const saveTask = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...queueForm, article_id: queueForm.article_id || null, payload: queueForm.payload ? JSON.parse(queueForm.payload) : {} };
      await createQueueTask(payload);
      toast.success('Задача создана');
      setQueueForm({ operation: 'generate', payload: '{}', article_id: '', source: '' });
      loadQueue();
    } catch (err) { toast.error('Ошибка задачи'); console.error(err); }
  };
  const restartTask = async (item) => { try { await updateQueueTask(item.id, { status: 'pending', locked_at: null, error_message: null }); loadQueue(); } catch { toast.error('Не удалось'); } };
  const delTask = async (id) => { if (!confirm('Удалить задачу?')) return; try { await deleteQueueTask(id); loadQueue(); } catch { toast.error('Удалить не удалось'); } };

  const tabs = [
    { id: 'categories', label: 'Категории' },
    { id: 'firmwares', label: 'Прошивки' },
    { id: 'modules', label: 'Модули' },
    { id: 'articles', label: 'Статьи' },
    { id: 'queue', label: 'Очередь' },
  ];

  return (
    <PageShell title="Flipper Zero — админка" hideBreadcrumbs>
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full px-4 py-2 text-sm ${tab === t.id ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      {tab === 'categories' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr,1fr]">
          <Card title="Категории" actions={
            <div className="flex items-center gap-2">
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className={inputCls}>
                <option value="">Все типы</option>
                {CATEGORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={loadCats} className={btnSmallCls}>Обновить</button>
            </div>
          }>
            <div className="space-y-2">
              {filteredCats.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-slate-50">{c.title}</span>
                    <span className="text-xs text-slate-500">{c.slug} · {c.type}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editCat(c)} className={btnSmallCls}>Изм.</button>
                    <button onClick={() => delCat(c.id)} className={`${btnSmallCls} text-red-600 border-red-200 dark:border-red-700`}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title={catEdit ? 'Редактировать категорию' : 'Создать категорию'}>
            <form className="grid gap-3" onSubmit={saveCat}>
              <Field label="Slug"><input required value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })} className={inputCls} /></Field>
              <Field label="Название"><input required value={catForm.title} onChange={e => setCatForm({ ...catForm, title: e.target.value })} className={inputCls} /></Field>
              <Field label="Тип"><select value={catForm.type} onChange={e => setCatForm({ ...catForm, type: e.target.value })} className={inputCls}>{CATEGORY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Родитель"><select value={catForm.parent_id} onChange={e => setCatForm({ ...catForm, parent_id: e.target.value })} className={inputCls}><option value="">—</option>{catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              <Field label="Позиция"><input type="number" value={catForm.position} onChange={e => setCatForm({ ...catForm, position: e.target.value })} className={inputCls} /></Field>
              <Field label="Описание"><textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} className={`${inputCls} min-h-[70px]`} /></Field>
              <div className="flex gap-2"><button type="submit" className={btnCls}>{catEdit ? 'Сохранить' : 'Создать'}</button>{catEdit && <button type="button" onClick={() => { setCatEdit(null); setCatForm({ slug: '', title: '', description: '', type: 'basic', parent_id: '', position: 0 }); }} className={btnMutedCls}>Отмена</button>}</div>
            </form>
          </Card>
        </div>
      )}

      {/* Firmwares */}
      {tab === 'firmwares' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
          <Card title="Прошивки">
            <div className="space-y-2">
              {firmwares.map(f => (
                <div key={f.id} className="flex items-start justify-between rounded-2xl border border-slate-100 bg-white/80 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex flex-col">
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold text-slate-900 dark:text-slate-50">{f.name}</span>
                      <span className="text-[11px] text-slate-600">{f.slug}</span>
                      {!f.is_active && <span className="text-[11px] text-amber-700">off</span>}
                    </div>
                    <span className="text-xs text-slate-500">{f.short_description || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleFw(f)} className={btnSmallCls}>{f.is_active ? 'Выключить' : 'Включить'}</button>
                    <button onClick={() => editFw(f)} className={btnSmallCls}>Изм.</button>
                    <button onClick={() => delFw(f.id)} className={`${btnSmallCls} text-red-600 border-red-200 dark:border-red-700`}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title={fwEdit ? 'Редактировать прошивку' : 'Создать прошивку'}>
            <form className="grid gap-3" onSubmit={saveFw}>
              <Field label="Slug"><input required value={fwForm.slug} onChange={e => setFwForm({ ...fwForm, slug: e.target.value })} className={inputCls} /></Field>
              <Field label="Название"><input required value={fwForm.name} onChange={e => setFwForm({ ...fwForm, name: e.target.value })} className={inputCls} /></Field>
              <Field label="Краткое описание"><textarea value={fwForm.short_description} onChange={e => setFwForm({ ...fwForm, short_description: e.target.value })} className={`${inputCls} min-h-[70px]`} /></Field>
              <Field label="Repo URL"><input value={fwForm.repo_url} onChange={e => setFwForm({ ...fwForm, repo_url: e.target.value })} className={inputCls} /></Field>
              <Field label="Homepage URL"><input value={fwForm.homepage_url} onChange={e => setFwForm({ ...fwForm, homepage_url: e.target.value })} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={fwForm.is_custom} onChange={e => setFwForm({ ...fwForm, is_custom: e.target.checked })} /> Кастомная</label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={fwForm.is_active} onChange={e => setFwForm({ ...fwForm, is_active: e.target.checked })} /> Активна</label>
              <div className="flex gap-2"><button type="submit" className={btnCls}>{fwEdit ? 'Сохранить' : 'Создать'}</button>{fwEdit && <button type="button" onClick={() => { setFwEdit(null); setFwForm({ slug: '', name: '', short_description: '', repo_url: '', homepage_url: '', is_custom: true, is_active: true }); }} className={btnMutedCls}>Отмена</button>}</div>
            </form>
          </Card>
        </div>
      )}

      {/* Modules */}
      {tab === 'modules' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
          <Card title="Модули" actions={
            <div className="flex flex-wrap gap-2">
              <input placeholder="Поиск" value={modFilters.search} onChange={e => setModFilters({ ...modFilters, search: e.target.value })} className={inputCls} />
              <select value={modFilters.firmware_id} onChange={e => setModFilters({ ...modFilters, firmware_id: e.target.value })} className={inputCls}><option value="">Все прошивки</option>{fwOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              <select value={modFilters.category_id} onChange={e => setModFilters({ ...modFilters, category_id: e.target.value })} className={inputCls}><option value="">Все категории</option>{catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              <button onClick={loadMods} className={btnSmallCls}>Обновить</button>
            </div>
          }>
            <div className="space-y-2">
              {modules.map(m => (
                <div key={m.id} className="flex items-start justify-between rounded-2xl border border-slate-100 bg-white/80 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex flex-col">
                    <div className="flex gap-2 items-center"><span className="font-semibold text-slate-900 dark:text-slate-50">{m.name}</span><span className="text-[11px] text-slate-600">{m.slug}</span>{!m.is_active && <span className="text-[11px] text-amber-700">off</span>}</div>
                    <span className="text-xs text-slate-500">{m.short_description || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editMod(m)} className={btnSmallCls}>Изм.</button>
                    <button onClick={() => delMod(m.id)} className={`${btnSmallCls} text-red-600 border-red-200 dark:border-red-700`}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title={modEdit ? 'Редактировать модуль' : 'Создать модуль'}>
            <form className="grid gap-3" onSubmit={saveMod}>
              <Field label="Slug"><input required value={modForm.slug} onChange={e => setModForm({ ...modForm, slug: e.target.value })} className={inputCls} /></Field>
              <Field label="Название"><input required value={modForm.name} onChange={e => setModForm({ ...modForm, name: e.target.value })} className={inputCls} /></Field>
              <Field label="Описание"><textarea value={modForm.short_description} onChange={e => setModForm({ ...modForm, short_description: e.target.value })} className={`${inputCls} min-h-[70px]`} /></Field>
              <Field label="Прошивка"><select value={modForm.firmware_id} onChange={e => setModForm({ ...modForm, firmware_id: e.target.value })} className={inputCls}><option value="">—</option>{fwOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              <Field label="Категория"><select value={modForm.category_id} onChange={e => setModForm({ ...modForm, category_id: e.target.value })} className={inputCls}><option value="">—</option>{catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              <Field label="Supported (через запятую)"><input value={modForm.supported_firmwares.join(',')} onChange={e => setModForm({ ...modForm, supported_firmwares: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} className={inputCls} /></Field>
              <Field label="Source URL"><input value={modForm.source_url} onChange={e => setModForm({ ...modForm, source_url: e.target.value })} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><input type="checkbox" checked={modForm.is_active} onChange={e => setModForm({ ...modForm, is_active: e.target.checked })} /> Активен</label>
              <div className="flex gap-2"><button type="submit" className={btnCls}>{modEdit ? 'Сохранить' : 'Создать'}</button>{modEdit && <button type="button" onClick={() => { setModEdit(null); setModForm({ slug: '', name: '', short_description: '', firmware_id: '', supported_firmwares: [], category_id: '', source_url: '', is_active: true }); }} className={btnMutedCls}>Отмена</button>}</div>
            </form>
          </Card>
        </div>
      )}

      {/* Articles */}
      {tab === 'articles' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
          <Card title="Статьи" actions={
            <div className="flex flex-wrap gap-2">
              <select value={artFilters.category_id} onChange={e => setArtFilters({ ...artFilters, category_id: e.target.value })} className={inputCls}><option value="">Все категории</option>{catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              <select value={artFilters.type} onChange={e => setArtFilters({ ...artFilters, type: e.target.value })} className={inputCls}><option value="">Все типы</option>{ARTICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <select value={artFilters.status} onChange={e => setArtFilters({ ...artFilters, status: e.target.value })} className={inputCls}><option value="">Статус</option><option value="draft">draft</option><option value="review">review</option><option value="published">published</option><option value="archived">archived</option></select>
              <button onClick={loadArts} className={btnSmallCls}>Обновить</button>
            </div>
          }>
            <div className="space-y-2">
              {articles.map(a => (
                <div key={a.id} className="flex items-start justify-between rounded-2xl border border-slate-100 bg-white/80 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-900 dark:text-slate-50">{a.title}</span><span className="text-[11px] text-slate-600">{a.slug}</span><span className="text-[11px] text-indigo-700 dark:text-indigo-200">{a.type}</span><span className="text-[11px] text-slate-600">{a.status}</span></div>
                    <span className="text-xs text-slate-500">Категория: {a.category_id || '—'} · Прошивка: {a.firmware_id || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <select value={a.status} onChange={e => setArtStatus(a, e.target.value)} className={`${inputCls} px-2 py-1 text-xs`}><option value="draft">draft</option><option value="review">review</option><option value="published">published</option><option value="archived">archived</option></select>
                    <button onClick={() => editArt(a)} className={btnSmallCls}>Изм.</button>
                    <button onClick={() => delArt(a.id)} className={`${btnSmallCls} text-red-600 border-red-200 dark:border-red-700`}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title={artEdit ? 'Редактировать статью' : 'Создать статью'}>
            <form className="grid gap-3" onSubmit={saveArt}>
              <Field label="Название"><input required value={artForm.title} onChange={e => setArtForm({ ...artForm, title: e.target.value })} className={inputCls} /></Field>
              <Field label="Slug"><input required value={artForm.slug} onChange={e => setArtForm({ ...artForm, slug: e.target.value })} className={inputCls} /></Field>
              <Field label="Категория"><select value={artForm.category_id} onChange={e => setArtForm({ ...artForm, category_id: e.target.value })} className={inputCls}><option value="">—</option>{catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              <Field label="Прошивка"><select value={artForm.firmware_id} onChange={e => setArtForm({ ...artForm, firmware_id: e.target.value })} className={inputCls}><option value="">—</option>{fwOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
              <Field label="Тип"><select value={artForm.type} onChange={e => setArtForm({ ...artForm, type: e.target.value })} className={inputCls}>{ARTICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Статус"><select value={artForm.status} onChange={e => setArtForm({ ...artForm, status: e.target.value })} className={inputCls}><option value="draft">draft</option><option value="review">review</option><option value="published">published</option><option value="archived">archived</option></select></Field>
              <Field label="Summary"><textarea value={artForm.summary} onChange={e => setArtForm({ ...artForm, summary: e.target.value })} className={`${inputCls} min-h-[60px]`} /></Field>
              <Field label="Контент (MD)"><textarea value={artForm.content_raw} onChange={e => setArtForm({ ...artForm, content_raw: e.target.value })} className={`${inputCls} min-h-[110px]`} /></Field>
              <Field label="Теги через запятую"><input value={artForm.tags} onChange={e => setArtForm({ ...artForm, tags: e.target.value })} className={inputCls} /></Field>
              <div className="flex gap-2"><button type="submit" className={btnCls}>{artEdit ? 'Сохранить' : 'Создать'}</button>{artEdit && <button type="button" onClick={() => { setArtEdit(null); setArtForm({ title: '', slug: '', category_id: '', firmware_id: '', type: 'feature_basic', summary: '', content_raw: '', tags: '', status: 'draft' }); }} className={btnMutedCls}>Отмена</button>}</div>
            </form>
          </Card>
        </div>
      )}

      {/* Queue */}
      {tab === 'queue' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
          <Card title="Очередь задач" actions={
            <div className="flex flex-wrap gap-2">
              <select value={queueFilters.status} onChange={e => setQueueFilters({ ...queueFilters, status: e.target.value })} className={inputCls}><option value="">Все</option><option value="pending">pending</option><option value="processing">processing</option><option value="done">done</option><option value="error">error</option></select>
              <select value={queueFilters.operation} onChange={e => setQueueFilters({ ...queueFilters, operation: e.target.value })} className={inputCls}><option value="">Оп</option><option value="generate">generate</option><option value="update">update</option><option value="regenerate">regenerate</option></select>
              <button onClick={loadQueue} className={btnSmallCls}>Обновить</button>
            </div>
          }>
            <div className="space-y-2">
              {queue.map(q => (
                <div key={q.id} className="rounded-2xl border border-slate-100 bg-white/80 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2 items-center"><span className="font-semibold text-slate-900 dark:text-slate-50">#{q.id} · {q.operation}</span><span className="text-[11px] text-slate-600">{q.status}</span></div>
                    <div className="flex gap-2"><button onClick={() => restartTask(q)} className={btnSmallCls}>Перезапустить</button><button onClick={() => delTask(q.id)} className={`${btnSmallCls} text-red-600 border-red-200 dark:border-red-700`}>Удалить</button></div>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">article_id: {q.article_id || '—'} · source: {q.source || '—'} · error: {q.error_message || '—'}</div>
                  <pre className="mt-1 max-h-40 overflow-auto rounded-xl bg-slate-50 p-2 text-[11px] ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-700">{JSON.stringify(q.payload, null, 2)}</pre>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Создать задачу">
            <form className="grid gap-3" onSubmit={saveTask}>
              <Field label="Operation"><select value={queueForm.operation} onChange={e => setQueueForm({ ...queueForm, operation: e.target.value })} className={inputCls}><option value="generate">generate</option><option value="update">update</option><option value="regenerate">regenerate</option></select></Field>
              <Field label="Article ID"><input value={queueForm.article_id} onChange={e => setQueueForm({ ...queueForm, article_id: e.target.value })} className={inputCls} /></Field>
              <Field label="Payload JSON"><textarea required value={queueForm.payload} onChange={e => setQueueForm({ ...queueForm, payload: e.target.value })} className={`${inputCls} min-h-[120px] font-mono`} /></Field>
              <Field label="Source"><input value={queueForm.source} onChange={e => setQueueForm({ ...queueForm, source: e.target.value })} className={inputCls} /></Field>
              <button type="submit" className={btnCls}>Создать</button>
            </form>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
