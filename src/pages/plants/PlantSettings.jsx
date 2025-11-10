import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { plantsApi } from "../../api/plants.js";
import { useAuth } from "../../context/AuthContext.jsx";
import NotFound from "../NotFound.jsx";

const DICT_SECTIONS = [
  { key: "light", title: "Свет" },
  { key: "watering", title: "Полив" },
  { key: "soil", title: "Почва" },
  { key: "humidity", title: "Влажность" },
  { key: "temperature", title: "Температура" },
  { key: "locations", title: "Локации" },
  { key: "categories", title: "Категории" },
];

export default function PlantSettings() {
  const { user } = useAuth();
  const canManage = user?.role === "ALL" || (user?.permissions || []).includes("plants_admin");

  const [dicts, setDicts] = React.useState({});
  const [tags, setTags] = React.useState([]);
  const [inputs, setInputs] = React.useState({});
  const [tagInput, setTagInput] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [settings, setSettings] = React.useState({ n8n_generate_description_url: "" });
  const [settingsSaving, setSettingsSaving] = React.useState(false);
  const [sectionsOpen, setSectionsOpen] = React.useState(() =>
    Object.fromEntries(DICT_SECTIONS.map((section) => [section.key, true]))
  );

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [meta, settingsRes] = await Promise.all([plantsApi.meta(), plantsApi.getSettings()]);
        if (!mounted) return;
        setDicts(meta.dicts || {});
        setTags(meta.tags || []);
        setSettings(settingsRes.settings || {});
      } catch (err) {
        toast.error(err.message || "Не удалось загрузить данные");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!canManage) {
    return <NotFound />;
  }

  const handleSettingsSave = async () => {
    try {
      setSettingsSaving(true);
      const res = await plantsApi.saveSettings(settings);
      setSettings(res.settings || {});
      toast.success("Настройки сохранены");
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить настройки");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleAddDict = async (key) => {
    const value = (inputs[key] || "").trim();
    if (!value) return;
    try {
      const res = await plantsApi.createDict(key, value);
      setDicts((prev) => ({ ...prev, [key]: [...(prev[key] || []), res.item] }));
      setInputs((prev) => ({ ...prev, [key]: "" }));
      toast.success("Добавлено");
    } catch (err) {
      toast.error(err.message || "Не удалось сохранить значение");
    }
  };

  const handleDeleteDict = async (key, id) => {
    try {
      await plantsApi.deleteDict(key, id);
      setDicts((prev) => ({ ...prev, [key]: (prev[key] || []).filter((item) => item.id !== id) }));
    } catch (err) {
      toast.error(err.message || "Не удалось удалить значение");
    }
  };

  const handleAddTag = async () => {
    const value = tagInput.trim();
    if (!value) return;
    try {
      const res = await plantsApi.createTag(value);
      setTags((prev) => [...prev, res.tag]);
      setTagInput("");
    } catch (err) {
      toast.error(err.message || "Не удалось создать тег");
    }
  };

  const handleDeleteTag = async (id) => {
    try {
      await plantsApi.deleteTag(id);
      setTags((prev) => prev.filter((tag) => tag.id !== id));
    } catch (err) {
      toast.error(err.message || "Не удалось удалить тег");
    }
  };

  return (
    <PageShell title="Настройки растений" contentClassName="space-y-6">
      {loading ? (
        <div className="h-40 animate-pulse rounded-3xl border border-slate-100 bg-white/80 dark:border-white/10 dark:bg-slate-900/40" />
      ) : (
        <>
          <WebhookCard
            value={settings.n8n_generate_description_url || ""}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, n8n_generate_description_url: value }))
            }
            onSave={handleSettingsSave}
            saving={settingsSaving}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {DICT_SECTIONS.map((section) => (
              <DictCard
                key={section.key}
                title={section.title}
                items={dicts[section.key] || []}
                value={inputs[section.key] || ""}
                open={sectionsOpen[section.key]}
                onToggle={() =>
                  setSectionsOpen((prev) => ({ ...prev, [section.key]: !prev[section.key] }))
                }
                onInput={(value) => setInputs((prev) => ({ ...prev, [section.key]: value }))}
                onAdd={() => handleAddDict(section.key)}
                onDelete={(id) => handleDeleteDict(section.key, id)}
              />
            ))}
          </div>
          <TagsCard
            tags={tags}
            value={tagInput}
            onInput={setTagInput}
            onAdd={handleAddTag}
            onDelete={handleDeleteTag}
          />
        </>
      )}
    </PageShell>
  );
}

function WebhookCard({ value, onChange, onSave, saving }) {
  return (
    <section className="space-y-3 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">n8n webhook URL</h3>
          <p className="text-sm text-slate-500 dark:text-slate-300">Используется для генерации описаний</p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://n8n.example/webhook/..."
        className="w-full rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10"
      />
    </section>
  );
}

function DictCard({ title, items, value, onInput, onAdd, onDelete, open = true, onToggle }) {
  return (
    <section className="space-y-3 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-slate-200 p-1 text-slate-500 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-200"
          >
            {open ? "−" : "+"}
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => onInput(e.target.value)}
            placeholder="Новое значение"
            className="rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10"
          />
          <button
            type="button"
            onClick={onAdd}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Добавить
          </button>
        </div>
      </div>
      {open &&
        (items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Пока нет значений.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-800/40"
              >
                <span>{item.name}</span>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="text-xs font-semibold text-rose-600 hover:underline dark:text-rose-300"
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}

function TagsCard({ tags, value, onInput, onAdd, onDelete }) {
  return (
    <section className="space-y-3 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white">Теги</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onInput(e.target.value)}
            placeholder="#зелень"
            className="rounded-2xl border border-slate-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/10"
          />
          <button
            type="button"
            onClick={onAdd}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Добавить
          </button>
        </div>
      </div>
      {tags.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Ещё нет тегов.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-800/40 dark:text-slate-200"
            >
              #{tag.name}
              <button type="button" onClick={() => onDelete(tag.id)} className="text-rose-500">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
