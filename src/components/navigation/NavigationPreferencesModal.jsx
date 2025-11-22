// encoding: utf-8
import React from "react";
import { DndContext, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";
import Modal from "../Modal.jsx";
import { useNavigationPreferences } from "../../context/NavigationPreferencesContext.jsx";

function cloneTree(items = []) {
  return items.map((item) => ({
    ...item,
    children: item.children ? cloneTree(item.children) : undefined,
  }));
}

export default function NavigationPreferencesModal({ open, onClose }) {
  const { navTree, savePreferences, resetToDefault, setNavTree, saving, loading } = useNavigationPreferences();
  const [draft, setDraft] = React.useState([]);
  const sensors = useSensors(
    useSensor(TouchSensor, { pressDelay: 180, activationConstraint: { distance: 6, tolerance: 12 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  );
  const [busy, setBusy] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState(null);

  React.useEffect(() => {
    if (open) {
      setDraft(cloneTree(navTree));
      setSelectedId((navTree && navTree[0]?.id) || null);
    }
  }, [open, navTree]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setShowHint(true);
    }
  }, [open, navTree]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const mainIds = draft.map((it) => it.id);
    const selected = draft.find((it) => it.id === selectedId);
    const childIds = selected?.children?.map((c) => c.id) || [];

    // Перестановка разделов
    if (mainIds.includes(active.id) && mainIds.includes(over.id)) {
      setDraft((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
      return;
    }

    // Перестановка подстраниц выбранного раздела
    if (childIds.includes(active.id) && childIds.includes(over.id)) {
      setDraft((items) =>
        items.map((item) => {
          if (item.id !== selectedId || !item.children) return item;
          const oldIndex = item.children.findIndex((child) => child.id === active.id);
          const newIndex = item.children.findIndex((child) => child.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return item;
          return { ...item, children: arrayMove(item.children, oldIndex, newIndex) };
        })
      );
    }
  };

  const toggleVisibility = (id) => {
    setDraft((items) =>
      items.map((item) => (item.id === id ? { ...item, hidden: !item.hidden } : item))
    );
  };

  const toggleChildVisibility = (parentId, childId) => {
    setDraft((items) =>
      items.map((item) => {
        if (item.id !== parentId) return item;
        return {
          ...item,
          children: item.children
            ? item.children.map((child) =>
                child.id === childId ? { ...child, hidden: !child.hidden } : child
              )
            : item.children,
        };
      })
    );
  };

  const handleSave = async () => {
    setBusy(true);
    const res = await savePreferences(draft);
    setBusy(false);
    if (res.ok) {
      toast.success("Меню сохранено");
      onClose?.();
    } else {
      toast.error("Не удалось сохранить меню");
    }
  };

  const handleReset = () => {
    const defaults = resetToDefault();
    setDraft(cloneTree(defaults));
    setNavTree(defaults);
  };

  const footer = (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleSave}
        disabled={busy || saving}
        className="rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {busy || saving ? "Сохраняем..." : "Сохранить порядок"}
      </button>
      <button
        type="button"
        onClick={handleReset}
        disabled={loading}
        className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-600 dark:text-slate-200 dark:hover:border-indigo-500"
      >
        Сбросить по умолчанию
      </button>
      <button
        type="button"
        onClick={onClose}
        className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
      >
        Отменить
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Настройка меню навигации"
      maxWidth="max-w-5xl"
      bodyClassName="flex h-full flex-col gap-4"
      footer={footer}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Перетаскивайте разделы, чтобы поменять порядок, и выключайте карточки, которые не нужны в боковом меню.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowHint((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/60"
          aria-expanded={showHint}
          aria-label="Показать подсказку"
        >
          ?
        </button>
      </div>
      {showHint && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          Подсказка: порядок сохраняется только для вашего аккаунта. Подстраницы остаются доступны по прямой ссылке, даже если скрыты в меню.
        </div>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Разделы</div>
            <SortableContext items={draft.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              {draft.map((item) => (
                <div key={item.id} className="space-y-2">
                  <SortableNavItem
                    item={item}
                    isSelected={item.id === selectedId}
                    onSelect={() => setSelectedId(item.id === selectedId ? null : item.id)}
                    onToggle={() => toggleVisibility(item.id)}
                  />
                  {item.id === selectedId ? (
                    <ChildEditor item={item} onToggleChild={toggleChildVisibility} />
                  ) : null}
                </div>
              ))}
            </SortableContext>
          </div>
        </DndContext>
      </div>
    </Modal>
  );
}

function SortableNavItem({ item, onToggle, onSelect, isSelected }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: isDragging ? "transform 0.15s ease" : transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm ring-1 ring-transparent transition dark:border-slate-700 dark:bg-slate-900/70 ${
        isDragging ? "z-10 ring-indigo-400" : isSelected ? "ring-1 ring-indigo-200 dark:ring-indigo-500/50" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 transition hover:text-indigo-600 dark:border-slate-600"
          title="Перетащите, чтобы поменять порядок"
          {...attributes}
          {...listeners}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="9" cy="7" r="1" />
            <circle cx="15" cy="7" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="9" cy="17" r="1" />
            <circle cx="15" cy="17" r="1" />
          </svg>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {item.icon}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-800 dark:text-white">{item.label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{item.path}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onSelect}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  isSelected
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm dark:border-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200"
                    : "border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500/60"
                }`}
                aria-pressed={isSelected}
                title="Показать подстраницы"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="12" cy="6" r="2.5" />
                  <circle cx="7" cy="18" r="2.5" />
                  <circle cx="17" cy="18" r="2.5" />
                  <path d="M12 8.5V12" />
                  <path d="m9 14 3-2 3 2" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onToggle}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  item.hidden
                    ? "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500 dark:border-slate-700 dark:text-slate-500 dark:hover:border-slate-500"
                    : "border-emerald-200 text-emerald-600 shadow-sm hover:border-emerald-300 dark:border-emerald-500/60 dark:text-emerald-300"
                }`}
                title={item.hidden ? "Скрыт в меню" : "Показывается в меню"}
                aria-pressed={!item.hidden}
                data-dnd-ignore="true"
              >
                {item.hidden ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChildEditor({ item, onToggleChild }) {
  if (!item) {
    return null;
  }
  const children = item.children || [];
  return (
    <SortableContext items={children.map((child) => child.id)} strategy={rectSortingStrategy}>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-3 shadow-sm ring-1 ring-slate-100 transition dark:border-slate-700 dark:bg-slate-900/70 dark:ring-slate-700/60">
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          <span>Подстраницы</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.label}</span>
        </div>
        {children.length === 0 ? (
          <div className="text-xs text-slate-500 dark:text-slate-400">Нет подстраниц</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <SortableChildBadge key={child.id} child={child} onToggle={() => onToggleChild(item.id, child.id)} />
            ))}
          </div>
        )}
      </div>
    </SortableContext>
  );
}

function SortableChildBadge({ child, onToggle }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: child.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: isDragging ? "transform 0.15s ease" : transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-full border px-2 py-1 transition ${
        child.hidden
          ? "border-dashed border-slate-300 text-slate-400 hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-500"
          : "border-indigo-200 bg-white text-slate-700 shadow-sm hover:border-indigo-300 dark:border-indigo-500/50 dark:bg-slate-900 dark:text-white"
      } ${isDragging ? "z-10 ring-1 ring-indigo-300" : ""}`}
    >
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-slate-600"
        title="Перетащить"
        {...attributes}
        {...listeners}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="9" cy="7" r="1" />
          <circle cx="15" cy="7" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="9" cy="17" r="1" />
          <circle cx="15" cy="17" r="1" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2"
        aria-pressed={!child.hidden}
      >
        {child.hidden ? <EyeClosedIcon className="h-3.5 w-3.5" /> : <EyeOpenIcon className="h-3.5 w-3.5 text-emerald-500" />}
        <span className="text-xs">{child.label}</span>
      </button>
    </div>
  );
}

function EyeOpenIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
      <path d="M3 3l18 18" />
      <path d="M10.7 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
      <path d="M9.5 5.5A9.5 9.5 0 0 1 12 5c6 0 10 7 10 7a16.3 16.3 0 0 1-2.24 3.18" />
      <path d="M6.18 6.18C3.29 8.06 2 12 2 12a16.1 16.1 0 0 0 4.2 5.11" />
    </svg>
  );
}
