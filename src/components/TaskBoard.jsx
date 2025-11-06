// encoding: utf-8
import React from "react";
import toast from "react-hot-toast";
import { apiAuthFetch } from "../utils/api.js";
import Modal from "./Modal.jsx";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeStyle: "short",
});

const IconGrip = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">{
    [3, 8, 13].map((y) => <circle key={`left-${y}`} cx="5" cy={y} r="0.9" />)
  }{
    [3, 8, 13].map((y) => <circle key={`right-${y}`} cx="11" cy={y} r="0.9" />)
  }</svg>
);

const IconCheck = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M3.5 8.5 6.5 11l6-6" />
  </svg>
);

const IconCircle = () => <span className="block h-2.5 w-2.5 rounded-full bg-slate-400" aria-hidden />;

const IconEdit = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5V13h2.5l6.3-6.3a1.5 1.5 0 0 0-2.1-2.1L3 10.5Z" />
    <path d="m9.5 4.5 2 2" />
  </svg>
);

const IconTrash = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3.5 4.5h9" />
    <path d="M6 4.5V3.5A1 1 0 0 1 7 2.5h2a1 1 0 0 1 1 1v1" />
    <path d="M5.5 4.5 6 13a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1l.5-8.5" />
  </svg>
);

const IconRename = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="m3 12 10-8" />
    <path d="M11 4h2v2" />
    <path d="m5 12-2-2" />
  </svg>
);

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function computeReorder(prevTasks, lists, taskId, targetListId, targetIndex) {
  const task = prevTasks.find((t) => t.id === taskId);
  if (!task) return null;
  if (!lists.some((list) => list.id === targetListId)) return null;

  const tasksByList = new Map();
  lists.forEach((list) => tasksByList.set(list.id, []));
  prevTasks.forEach((t) => {
    if (!tasksByList.has(t.list_id)) tasksByList.set(t.list_id, []);
    tasksByList.get(t.list_id).push(t);
  });

  const sorter = (a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  };
  tasksByList.forEach((arr) => arr.sort(sorter));

  const sourceListId = task.list_id;
  const sourceArr = tasksByList.get(sourceListId) || [];
  const originalIndex = sourceArr.findIndex((t) => t.id === taskId);
  if (originalIndex === -1) return null;

  if (sourceListId === targetListId) {
    let insertIndex = Math.max(0, Math.min(targetIndex, sourceArr.length));
    if (insertIndex > originalIndex) insertIndex -= 1;
    if (insertIndex === originalIndex) return null;
    const reordered = sourceArr.filter((t) => t.id !== taskId);
    reordered.splice(insertIndex, 0, task);
    tasksByList.set(sourceListId, reordered);
  } else {
    const targetArr = tasksByList.get(targetListId) || [];
    const clamped = Math.max(0, Math.min(targetIndex, targetArr.length));
    const nextSource = sourceArr.filter((t) => t.id !== taskId);
    const nextTarget = [...targetArr];
    nextTarget.splice(clamped, 0, { ...task, list_id: targetListId });
    tasksByList.set(sourceListId, nextSource);
    tasksByList.set(targetListId, nextTarget);
  }

  const updatedTasks = [];
  const changedLists = new Set([sourceListId, targetListId]);

  lists.forEach((list) => {
    const arr = tasksByList.get(list.id) || [];
    arr.forEach((item, idx) => {
      updatedTasks.push({ ...item, list_id: list.id, position: idx });
    });
  });

  prevTasks.forEach((item) => {
    if (!lists.some((list) => list.id === item.list_id)) {
      if (!updatedTasks.some((t) => t.id === item.id)) {
        updatedTasks.push(item);
      }
    }
  });

  return { updatedTasks, changedLists: Array.from(changedLists) };
}

function DropMarker({ listId, index, dragState, setDragState, onDrop }) {
  const isActive = dragState.taskId && dragState.listId === listId && dragState.index === index;

  const allow = (event) => {
    if (!dragState.taskId) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    if (!isActive) {
      setDragState((prev) => ({ ...prev, listId, index }));
    }
  };

  const handleDrop = (event) => {
    if (!dragState.taskId) return;
    event.preventDefault();
    onDrop(listId, index);
    setDragState({ taskId: null, listId: null, index: null });
  };

  return (
    <div
      onDragOver={allow}
      onDragEnter={allow}
      onDrop={handleDrop}
      className={`h-2 w-full rounded-full transition-colors ${isActive ? "bg-blue-400/70" : "bg-transparent"}`}
    />
  );
}

function IconButton({ onClick, title, variant = "ghost", children }) {
  const base = "flex h-8 w-8 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";
  const styles = {
    ghost: "border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-400/40 dark:hover:text-blue-200",
    success: "border-emerald-400 bg-emerald-500/15 text-emerald-600 hover:border-emerald-400 hover:bg-emerald-500/25 dark:border-emerald-400/60 dark:bg-emerald-400/10 dark:text-emerald-200",
    danger: "border-red-300 text-red-500 hover:border-red-400 hover:bg-red-500/10 dark:border-red-500/40 dark:text-red-300 dark:hover:border-red-400/50",
  };
  return (
    <button type="button" onClick={onClick} title={title} className={`${base} ${styles[variant]}`} data-dnd-ignore="true">
      {children}
    </button>
  );
}

function TaskCard({ task, onDragStart, onDragEnd, onToggleDone, onEdit, onDelete }) {
  const dueSoon = task.due_at ? new Date(task.due_at).getTime() < Date.now() : false;
  return (
    <article
      className={`group relative flex cursor-grab flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-400/40 dark:hover:bg-slate-800/90 ${task.done ? "opacity-80" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-none text-slate-400" data-dnd-ignore="true">
          <IconGrip />
        </div>
        <div className="flex-1 space-y-1">
          <div className={`text-sm font-semibold text-slate-900 dark:text-slate-100 ${task.done ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
            {task.text}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400 dark:text-slate-500">
            <span>Создано: {formatDate(task.created_at)}</span>
            <span>
              Дедлайн: {task.due_at ? (
                <span className={dueSoon && !task.done ? "text-red-500" : ""}>{formatDate(task.due_at)}</span>
              ) : (
                "не указан"
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <IconButton
            onClick={onToggleDone}
            title={task.done ? "Снять выполнение" : "Отметить выполненной"}
            variant={task.done ? "success" : "ghost"}
          >
            {task.done ? <IconCheck /> : <IconCircle />}
          </IconButton>
          <IconButton onClick={onEdit} title="Редактировать">
            <IconEdit />
          </IconButton>
          <IconButton onClick={onDelete} title="Удалить" variant="danger">
            <IconTrash />
          </IconButton>
        </div>
      </div>
    </article>
  );
}

export default function TaskBoard() {
  const [lists, setLists] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [showCompleted, setShowCompleted] = React.useState(false);
  const [hiddenCompleted, setHiddenCompleted] = React.useState(() => new Set());
  const hideTimersRef = React.useRef(new Map());
  const [newListTitle, setNewListTitle] = React.useState("");
  const [addingList, setAddingList] = React.useState(false);
  const [taskDrafts, setTaskDrafts] = React.useState({});
  const [editingListId, setEditingListId] = React.useState(null);
  const [editingListTitle, setEditingListTitle] = React.useState("");
  const [editingTask, setEditingTask] = React.useState(null);
  const [dragState, setDragState] = React.useState({ taskId: null, listId: null, index: null });

  const clearHideTimer = React.useCallback((taskId) => {
    const timer = hideTimersRef.current.get(taskId);
    if (timer) {
      clearTimeout(timer);
      hideTimersRef.current.delete(taskId);
    }
  }, []);

  const scheduleHide = React.useCallback((taskId) => {
    clearHideTimer(taskId);
    const timeoutId = setTimeout(() => {
      setHiddenCompleted((prev) => {
        const next = new Set(prev);
        next.add(taskId);
        return next;
      });
      hideTimersRef.current.delete(taskId);
    }, 5000);
    hideTimersRef.current.set(taskId, timeoutId);
  }, [clearHideTimer]);

  const loadBoard = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiAuthFetch("/api/todos");
      if (!res.ok) throw new Error("Bad response");
      const data = await res.json();
      const listsData = Array.isArray(data?.lists) ? data.lists : [];
      const tasksData = Array.isArray(data?.tasks) ? data.tasks : [];
      tasksData.sort((a, b) => {
        if (a.list_id !== b.list_id) return a.list_id - b.list_id;
        if (a.position !== b.position) return a.position - b.position;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      setLists(listsData);
      setTasks(tasksData);
      setTaskDrafts((prev) => {
        const next = {};
        listsData.forEach((list) => {
          next[list.id] = prev[list.id] || "";
        });
        return next;
      });
      hideTimersRef.current.forEach((timer, taskId) => {
        if (!tasksData.some((task) => task.id === taskId && task.done)) {
          clearTimeout(timer);
          hideTimersRef.current.delete(taskId);
        }
      });
      setHiddenCompleted((prev) => {
        const activeDone = new Set(tasksData.filter((task) => task.done).map((task) => task.id));
        return new Set([...prev].filter((id) => activeDone.has(id)));
      });
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить задачи");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  React.useEffect(
    () => () => {
      hideTimersRef.current.forEach((timer) => clearTimeout(timer));
      hideTimersRef.current.clear();
    },
    []
  );

  const persistTaskOrder = React.useCallback(
    async (nextTasks, changedLists) => {
      try {
        for (const listId of changedLists) {
          const tasksForList = nextTasks.filter((task) => task.list_id === listId);
          for (const task of tasksForList) {
            await apiAuthFetch(`/api/todos/${task.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ listId: task.list_id, position: task.position }),
            });
          }
        }
      } catch (error) {
        console.error("persist order", error);
        toast.error("Не удалось сохранить порядок");
        loadBoard();
      }
    },
    [loadBoard]
  );

  const moveTask = React.useCallback(
    (taskId, targetListId, targetIndex) => {
      setTasks((prev) => {
        const result = computeReorder(prev, lists, taskId, targetListId, targetIndex);
        if (!result) return prev;
        persistTaskOrder(result.updatedTasks, result.changedLists).catch((error) => console.error(error));
        return result.updatedTasks;
      });
    },
    [lists, persistTaskOrder]
  );

  const handleCreateList = async (event) => {
    event.preventDefault();
    const title = newListTitle.trim();
    if (!title) return;
    setAddingList(true);
    try {
      const res = await apiAuthFetch("/api/todo-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed");
      setNewListTitle("");
      toast.success("Колонка добавлена");
      await loadBoard();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось создать колонку");
    } finally {
      setAddingList(false);
    }
  };

  const handleRenameList = async (listId) => {
    const title = editingListTitle.trim();
    if (!title) {
      toast.error("Название не может быть пустым");
      return;
    }
    try {
      const res = await apiAuthFetch(`/api/todo-lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Колонка обновлена");
      setEditingListId(null);
      setEditingListTitle("");
      await loadBoard();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось переименовать колонку");
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm("Удалить колонку и переместить задачи?")) return;
    try {
      const res = await apiAuthFetch(`/api/todo-lists/${listId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Колонка удалена");
      await loadBoard();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось удалить колонку");
    }
  };

  const handleCreateTask = async (event, listId) => {
    event.preventDefault();
    const text = (taskDrafts[listId] || "").trim();
    if (!text) return;
    setTaskDrafts((prev) => ({ ...prev, [listId]: "" }));
    try {
      const res = await apiAuthFetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, listId }),
      });
      if (!res.ok) throw new Error("Failed");
      await loadBoard();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось создать задачу");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Удалить задачу?")) return;
    try {
      const res = await apiAuthFetch(`/api/todos/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Задача удалена");
      await loadBoard();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось удалить задачу");
    }
  };

  const handleToggleDone = async (task) => {
    const nextDone = !task.done;
    setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, done: nextDone } : item)));
    if (nextDone) {
      scheduleHide(task.id);
    } else {
      clearHideTimer(task.id);
      setHiddenCompleted((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
    try {
      const res = await apiAuthFetch(`/api/todos/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: nextDone }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch (error) {
      console.error(error);
      toast.error("Не удалось обновить задачу");
      clearHideTimer(task.id);
      setHiddenCompleted((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      await loadBoard();
    }
  };

  const handleSubmitTaskEdit = async (event) => {
    event.preventDefault();
    if (!editingTask) return;
    const { task, text, dueAt } = editingTask;
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Текст не может быть пустым");
      return;
    }
    let payloadDue = null;
    if (dueAt) {
      const date = new Date(dueAt);
      if (Number.isNaN(date.getTime())) {
        toast.error("Некорректный дедлайн");
        return;
      }
      payloadDue = date.toISOString();
    }
    try {
      const res = await apiAuthFetch(`/api/todos/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, dueAt: dueAt ? payloadDue : null }),
      });
      if (!res.ok) throw new Error("Failed");
      setEditingTask(null);
      await loadBoard();
    } catch (error) {
      console.error(error);
      toast.error("Не удалось обновить задачу");
    }
  };

  const groupedTasks = React.useMemo(() => {
    const map = new Map();
    lists.forEach((list) => map.set(list.id, []));
    tasks.forEach((task) => {
      if (!map.has(task.list_id)) map.set(task.list_id, []);
      map.get(task.list_id).push(task);
    });
    map.forEach((arr) => arr.sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }));
    return map;
  }, [lists, tasks]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Доска задач</h2>
          <button
            type="button"
            onClick={() => setShowCompleted((prev) => !prev)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
              showCompleted
                ? "border-blue-400 bg-blue-500/10 text-blue-600 dark:border-blue-400/50 dark:text-blue-200"
                : "border-slate-300 text-slate-500 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:text-blue-200"
            }`}
          >
            {showCompleted ? "Скрыть выполненные" : "Показать выполненные"}
          </button>
        </div>
        <form onSubmit={handleCreateList} className="flex items-center gap-2">
          <input
            type="text"
            value={newListTitle}
            onChange={(event) => setNewListTitle(event.target.value)}
            placeholder="Название колонки"
            className="h-9 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
          <button
            type="submit"
            disabled={addingList}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            Добавить колонку
          </button>
        </form>
      </div>
      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="custom-scrollbar -mx-2 overflow-x-auto px-2 pb-2">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-slate-400 dark:text-slate-500">Загрузка…</div>
        ) : (
          <div className="flex min-h-[300px] gap-5 pb-2">
            {lists.map((list) => {
              const listTasks = groupedTasks.get(list.id) || [];
              return (
                <div
                  key={list.id}
                  className="flex w-[340px] flex-shrink-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    {editingListId === list.id ? (
                      <form
                        className="flex w-full items-center gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleRenameList(list.id);
                        }}
                      >
                        <input
                          value={editingListTitle}
                          onChange={(event) => setEditingListTitle(event.target.value)}
                          className="h-8 flex-1 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                          autoFocus
                        />
                        <button type="submit" className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Сохранить</button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingListId(null);
                            setEditingListTitle("");
                          }}
                          className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                        >
                          Отмена
                        </button>
                      </form>
                    ) : (
                      <>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{list.title}</h3>
                        <div className="flex items-center gap-1">
                          <IconButton
                            onClick={() => {
                              setEditingListId(list.id);
                              setEditingListTitle(list.title);
                            }}
                            title="Переименовать"
                          >
                            <IconRename />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteList(list.id)} title="Удалить колонку" variant="danger">
                            <IconTrash />
                          </IconButton>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex max-h-[520px] flex-1 flex-col gap-2 overflow-y-auto pr-1">
                    <DropMarker
                      listId={list.id}
                      index={0}
                      dragState={dragState}
                      setDragState={setDragState}
                      onDrop={(targetListId, idx) => moveTask(dragState.taskId, targetListId, idx)}
                    />
                    {listTasks.map((task, index) => {
                      const shouldHide = task.done && !showCompleted && hiddenCompleted.has(task.id);
                      const markerIndex = index + 1;
                      return (
                        <React.Fragment key={task.id}>
                          {!shouldHide && (
                            <TaskCard
                              task={task}
                              onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData("text/plain", String(task.id));
                                try {
                                  event.dataTransfer.setDragImage(event.currentTarget, event.currentTarget.offsetWidth / 2, 14);
                                } catch {}
                                setDragState({ taskId: task.id, listId: list.id, index });
                              }}
                              onDragEnd={() => setDragState({ taskId: null, listId: null, index: null })}
                              onToggleDone={() => handleToggleDone(task)}
                              onEdit={() => setEditingTask({ task, text: task.text, dueAt: toInputDateTime(task.due_at) })}
                              onDelete={() => handleDeleteTask(task.id)}
                            />
                          )}
                          <DropMarker
                            listId={list.id}
                            index={markerIndex}
                            dragState={dragState}
                            setDragState={setDragState}
                            onDrop={(targetListId, idx) => moveTask(dragState.taskId, targetListId, idx)}
                          />
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <form onSubmit={(event) => handleCreateTask(event, list.id)} className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <textarea
                      value={taskDrafts[list.id] || ""}
                      onChange={(event) => setTaskDrafts((prev) => ({ ...prev, [list.id]: event.target.value }))}
                      placeholder="Добавить задачу"
                      className="min-h-[54px] resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="submit"
                      className="self-start rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Добавить
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title="Редактировать задачу"
        maxWidth="max-w-lg"
      >
        {editingTask && (
          <form className="flex flex-col gap-4" onSubmit={handleSubmitTaskEdit}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Текст задачи</label>
              <textarea
                value={editingTask.text}
                onChange={(event) => setEditingTask((prev) => ({ ...prev, text: event.target.value }))}
                className="min-h-[100px] rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Дедлайн</label>
              <input
                type="datetime-local"
                value={editingTask.dueAt || ""}
                onChange={(event) => setEditingTask((prev) => ({ ...prev, dueAt: event.target.value }))}
                className="h-10 rounded-full border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={() => setEditingTask((prev) => ({ ...prev, dueAt: "" }))}
                className="self-start text-xs text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                Очистить дедлайн
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Сохранить
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
