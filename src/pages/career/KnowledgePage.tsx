import React from "react";
import toast from "react-hot-toast";
import PageShell from "../../components/PageShell.jsx";
import { careerApi } from "../../api/career.js";
import KnowledgeFilters from "./components/KnowledgeFilters.tsx";
import KnowledgeTable from "./components/KnowledgeTable.tsx";
import KnowledgeModal from "./components/KnowledgeModal.tsx";

const DEFAULT_FILTERS = {
  search: "",
  category: "",
};

export default function KnowledgePage() {
  const [items, setItems] = React.useState([]);
  const [filters, setFilters] = React.useState({ ...DEFAULT_FILTERS });
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [templates, setTemplates] = React.useState([]);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const itemsData = await careerApi.listKnowledge(filters);
      setItems(itemsData);
    } catch (error) {
      toast.error(error?.message || "Не удалось загрузить знания");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    (async () => {
      try {
        const templatesData = await careerApi.getKnowledgeTemplates();
        setTemplates(templatesData);
      } catch (error) {
        console.warn("Templates unavailable", error);
      }
    })();
  }, []);

  const openModal = (item = null) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (payload) => {
    try {
      setSaving(true);
      if (editingItem) {
        await careerApi.updateKnowledge(editingItem.id, payload);
        toast.success("Запись обновлена");
      } else {
        await careerApi.createKnowledge(payload);
        toast.success("Запись добавлена");
      }
      closeModal();
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Не удалось сохранить запись");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Удалить ${item.technology}?`)) return;
    try {
      setSaving(true);
      await careerApi.deleteKnowledge(item.id);
      toast.success("Удалено");
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Не удалось удалить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="База знаний">
      <div className="space-y-6">
        <KnowledgeFilters filters={filters} onChange={setFilters} loading={loading} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-200">Найдено {items.length} технологий</p>
          <button
            type="button"
            onClick={() => openModal(null)}
            className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200"
          >
            + Добавить
          </button>
        </div>
        <KnowledgeTable items={items} loading={loading} onView={(item) => window.location.assign(`/career/knowledge/${item.id}`)} onEdit={openModal} onDelete={handleDelete} />
      </div>

      <KnowledgeModal open={modalOpen} item={editingItem} templates={templates} onClose={closeModal} onSave={handleSave} saving={saving} />
    </PageShell>
  );
}
