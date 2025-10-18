// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageShell from "../components/PageShell.jsx";
import Modal from "../components/Modal.jsx";
import { apiAuthFetch } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const quickLinks = [
  { to: "/analytics", label: "Аналитика", gradient: "from-sky-400 to-blue-600" },
  { to: "/ai", label: "AI и ML", gradient: "from-violet-400 to-indigo-600" },
  { to: "/docs", label: "Документация", gradient: "from-emerald-400 to-teal-600" },
  { to: "/vpn", label: "VPN", gradient: "from-amber-400 to-orange-600" },
];

function cloneNode(node) {
  return {
    ...node,
    children: node.children.map(cloneNode),
  };
}

function assignPositions(nodes) {
  nodes.forEach((node, index) => {
    node.position = index;
    if (node.children.length > 0) assignPositions(node.children);
  });
}

function buildTree(rows) {
  const map = new Map();
  rows.forEach((row) => {
    map.set(row.id, {
      id: row.id,
      text: row.text,
      done: row.done,
      parentId: row.parent_id ?? null,
      position: row.position ?? 0,
      createdAt: row.created_at,
      children: [],
    });
  });

  const roots = [];
  map.forEach((node) => {
    if (node.parentId !== null && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortChildren = (nodes) => {
    nodes.sort((a, b) => {
      const posDiff = (a.position ?? 0) - (b.position ?? 0);
      if (posDiff !== 0) return posDiff;
      return a.id - b.id;
    });
    nodes.forEach((child) => sortChildren(child.children));
  };

  sortChildren(roots);
  assignPositions(roots);
  return roots;
}

function findNodeMeta(nodes, id, parentId = null) {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.id === id) return { node, index, parentId };
    const childResult = findNodeMeta(node.children, id, node.id);
    if (childResult) return childResult;
  }
  return null;
}

function detachNode(nodes, id, parentId = null) {
  let removed = null;
  let removedParent = null;
  const result = [];

  nodes.forEach((node) => {
    if (removed) {
      result.push(node);
      return;
    }
    if (node.id === id) {
      removed = cloneNode(node);
      removedParent = parentId;
      return;
    }
    const child = detachNode(node.children, id, node.id);
    if (child.removed) {
      result.push({ ...node, children: child.tree });
      removed = child.removed;
      removedParent = child.parentId;
    } else {
      result.push(node);
    }
  });

  return { tree: removed ? result : nodes, removed, parentId: removedParent };
}

function insertNode(nodes, parentId, index, node) {
  if (parentId === null) {
    const list = [...nodes];
    const safeIndex = Math.max(0, Math.min(index, list.length));
    list.splice(safeIndex, 0, { ...node, parentId: null });
    return { tree: list, inserted: true };
  }

  let inserted = false;
  const next = nodes.map((current) => {
    if (inserted) return current;
    if (current.id === parentId) {
      const children = [...current.children];
      const safeIndex = Math.max(0, Math.min(index, children.length));
      children.splice(safeIndex, 0, { ...node, parentId });
      inserted = true;
      return { ...current, children };
    }
    const child = insertNode(current.children, parentId, index, node);
    if (child.inserted) {
      inserted = true;
      return { ...current, children: child.tree };
    }
    return current;
  });

  return { tree: inserted ? next : nodes, inserted };
}

function updateNodeById(nodes, id, updater) {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.id === id) {
      changed = true;
      return updater(cloneNode(node));
    }
    const updatedChildren = updateNodeById(node.children, id, updater);
    if (updatedChildren.changed) {
      changed = true;
      return { ...node, children: updatedChildren.nodes };
    }
    return node;
  });
  return { nodes: changed ? next : nodes, changed };
}

function nodeContains(target, id) {
  if (!target) return false;
  if (target.id === id) return true;
  return target.children.some((child) => nodeContains(child, id));
}

function collectTreeOrder(nodes) {
  const result = [];
  const walk = (list, parentId) => {
    list.forEach((node, index) => {
      result.push({ id: node.id, parentId, position: index });
      walk(node.children, node.id);
    });
  };
  walk(nodes, null);
  return result;
}

function computeDescendantStats(node) {
  let total = 0;
  let completed = 0;
  node.children.forEach((child) => {
    total += 1;
    if (child.done) completed += 1;
    const childStats = computeDescendantStats(child);
    total += childStats.total;
    completed += childStats.completed;
  });
  return { total, completed };
}

function countAllTasks(nodes) {
  return nodes.reduce(
    (acc, node) => {
      const stats = computeDescendantStats(node);
      acc.total += 1 + stats.total;
      acc.done += (node.done ? 1 : 0) + stats.completed;
      return acc;
    },
    { total: 0, done: 0 }
  );
}

export default function Home() {
  const { user } = useAuth();
  const [todos, setTodos] = React.useState([]);
  const [text, setText] = React.useState("");
  const [collapsed, setCollapsed] = React.useState(() => new Set());
  const [draggingId, setDraggingId] = React.useState(null);
  const [dragOver, setDragOver] = React.useState(null);
  const [modal, setModal] = React.useState(null);
  const [modalInput, setModalInput] = React.useState("");

  const loadTodos = React.useCallback(async () => {
    if (!user) {
      setTodos([]);
      return;
    }
    try {
      const res = await apiAuthFetch("/api/todos");
      if (!res.ok) throw new Error("Не удалось загрузить задачи");
      const data = await res.json();
      setTodos(buildTree(data.todos || []));
    } catch (e) {
      console.error(e);
      setTodos([]);
    }
  }, [user]);

  React.useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  React.useEffect(() => {
    if (!modal) return;
    if (modal.type === "add") setModalInput("");
    if (modal.type === "edit") setModalInput(modal.node?.text || "");
  }, [modal]);

  const syncTreeOrder = React.useCallback(async (tree) => {
    const updates = collectTreeOrder(tree);
    try {
      await Promise.all(
        updates.map((item) =>
          apiAuthFetch(`/api/todos/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parentId: item.parentId, position: item.position }),
          })
        )
      );
    } catch (e) {
      console.error("Не удалось сохранить порядок задач", e);
      loadTodos();
    }
  }, [loadTodos]);

  const handleCreateRoot = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    try {
      await apiAuthFetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      setText("");
      loadTodos();
    } catch (e) {
      console.error(e);
    }
  };

  const openAddModal = (parentId) => setModal({ type: "add", parentId });
  const openEditModal = (node) => setModal({ type: "edit", node });
  const openDeleteModal = (node) => setModal({ type: "delete", node });
  const closeModal = () => {
    setModal(null);
    setModalInput("");
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    const value = modalInput.trim();
    if (!value || !modal) return;
    try {
      await apiAuthFetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, parentId: modal.parentId ?? null }),
      });
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (modal.parentId !== null && modal.parentId !== undefined) next.delete(modal.parentId);
        return next;
      });
      closeModal();
      loadTodos();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    const value = modalInput.trim();
    if (!value || !modal?.node) return;
    try {
      await apiAuthFetch(`/api/todos/${modal.node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      closeModal();
      loadTodos();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!modal?.node) return;
    try {
      await apiAuthFetch(`/api/todos/${modal.node.id}`, { method: "DELETE" });
      closeModal();
      loadTodos();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (id, nextDone) => {
    setTodos((prev) => updateNodeById(prev, id, (node) => ({ ...node, done: nextDone })).nodes);
    try {
      await apiAuthFetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: nextDone }),
      });
    } catch (e) {
      console.error(e);
      loadTodos();
    }
  };

  const handleMove = (dragId, targetId, placement) => {
    const draggedId = Number(dragId);
    if (!Number.isFinite(draggedId)) return;
    setTodos((prev) => {
      const { tree, removed } = detachNode(prev, draggedId);
      if (!removed) return prev;

      let working = tree;
      let newParentId = null;

      if (!targetId || targetId === "root") {
        const insert = insertNode(working, null, working.length, removed);
        if (!insert.inserted) return prev;
        working = insert.tree;
      } else {
        const targetMeta = findNodeMeta(working, Number(targetId));
        if (!targetMeta) return prev;
        if (nodeContains(removed, Number(targetId))) return prev;

        if (placement === "child") {
          newParentId = targetMeta.node.id;
          const insert = insertNode(working, newParentId, targetMeta.node.children.length, removed);
          if (!insert.inserted) return prev;
          working = insert.tree;
        } else {
          newParentId = targetMeta.parentId ?? null;
          const index = placement === "before" ? targetMeta.index : targetMeta.index + 1;
          const insert = insertNode(working, newParentId, index, removed);
          if (!insert.inserted) return prev;
          working = insert.tree;
        }
      }

      assignPositions(working);
      syncTreeOrder(working);
      if (newParentId !== null && newParentId !== undefined) {
        setCollapsed((prevCollapsed) => {
          const next = new Set(prevCollapsed);
          next.delete(newParentId);
          return next;
        });
      }
      return working;
    });
    setDraggingId(null);
    setDragOver(null);
  };

  const DropZone = ({ targetId, placement, depth }) => {
    const active = dragOver && dragOver.targetId === targetId && dragOver.placement === placement;
    return (
      <div
        onDragEnter={(event) => {
          if (draggingId === null) return;
          event.preventDefault();
          setDragOver({ targetId, placement });
        }}
        onDragOver={(event) => {
          if (draggingId === null) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        onDragLeave={() => {
          if (dragOver && dragOver.targetId === targetId && dragOver.placement === placement) {
            setDragOver(null);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          const raw = event.dataTransfer?.getData("text/plain");
          const dragged = draggingId ?? Number(raw);
          handleMove(dragged, targetId === "root" ? null : targetId, placement);
        }}
        className={`h-2 rounded-full transition ${active ? "bg-blue-400/50" : "bg-transparent"}`}
        style={{ marginLeft: depth * 20 + (placement === "child" ? 20 : 0) }}
      />
    );
  };

  const TodoNode = ({ node, depth }) => {
    const stats = computeDescendantStats(node);
    const isCollapsed = collapsed.has(node.id);

    return (
      <div className="group">
        <DropZone targetId={node.id} placement="before" depth={depth} />
        <div
          draggable
          onDragStart={(event) => {
            setDraggingId(node.id);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(node.id));
          }}
          onDragEnd={() => {
            setDraggingId(null);
            setDragOver(null);
          }}
          className={`flex items-start gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm transition hover:border-blue-200 hover:shadow dark:border-gray-700 dark:bg-slate-800 ${draggingId === node.id ? "opacity-60" : ""}`}
          style={{ marginLeft: depth * 20 }}
        >
          <div className="flex items-center gap-2">
            {node.children.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setCollapsed((prev) => {
                    const next = new Set(prev);
                    if (next.has(node.id)) next.delete(node.id);
                    else next.add(node.id);
                    return next;
                  })
                }
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-xs text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                {isCollapsed ? "+" : "-"}
              </button>
            )}
            <input
              type="checkbox"
              checked={node.done}
              onChange={(event) => handleToggle(node.id, event.target.checked)}
            />
          </div>
          <div className="flex-1">
            <div
              className={`font-medium text-gray-800 transition-colors dark:text-gray-100 ${
                node.done ? "line-through text-gray-400 dark:text-gray-500" : ""
              }`}
            >
              {node.text}
            </div>
            {stats.total > 0 && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Подзадачи: {stats.completed}/{stats.total}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openAddModal(node.id)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-400/40 dark:hover:text-blue-200"
            >
              + Подзадача
            </button>
            <button
              type="button"
              onClick={() => openEditModal(node)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition hover:border-blue-200 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-blue-400/40 dark:hover:text-blue-200"
            >
              ✏️ Изменить
            </button>
            <button
              type="button"
              onClick={() => openDeleteModal(node)}
              className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-500 transition hover:border-red-300 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              🗑️ Удалить
            </button>
          </div>
        </div>
        <DropZone targetId={node.id} placement="child" depth={depth + 1} />
        {!isCollapsed && node.children.length > 0 && (
          <div className="mt-2 space-y-2">
            {node.children.map((child) => (
              <TodoNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
        <DropZone targetId={node.id} placement="after" depth={depth} />
      </div>
    );
  };

  const summary = React.useMemo(() => countAllTasks(todos), [todos]);

  const fetchGitHubCommits = async () => {
    return [];
  };

  const requestNotificationsPermission = async () => {
    if ("Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <PageShell title="Главная" contentClassName="home flex flex-col gap-6 bg-transparent p-0">
      <section className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/80">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Добро пожаловать в Personal Portal</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Используйте плитки для навигации и древовидные задачи, чтобы вести проекты и подзадачи.
        </p>
      </section>

      <section className="mt-2">
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:pt-0 xl:grid-cols-4">
          {quickLinks.map((item) => (
            <motion.div key={item.to} whileHover={{ y: -6 }} className="w-[220px] h-[120px] flex-shrink-0 snap-start md:w-auto md:h-auto">
              <Link to={item.to} className="block h-full">
                <div className="relative flex h-full items-center overflow-hidden rounded-3xl">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-60 blur-sm`} />
                  <div className="absolute inset-[2px] rounded-[calc(1.5rem-2px)] bg-white/95 shadow-[0_20px_40px_-26px_rgba(30,64,175,0.4)] transition duration-300 hover:shadow-[0_28px_60px_-24px_rgba(30,64,175,0.45)] dark:bg-slate-900/90" />
                  <div className="relative z-10 px-5 text-gray-900 dark:text-gray-100">
                    <div className="text-lg font-semibold">{item.label}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">Перейти к разделу</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Задачи</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">Выполнено: {summary.done}/{summary.total}</span>
          </div>
          <form onSubmit={handleCreateRoot} className="mt-3 flex gap-2">
            <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Добавить задачу" className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100" />
            <button type="submit" className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Добавить</button>
          </form>
          <div className="mt-4 space-y-2">
            {todos.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Пока задач нет. Добавьте первую или перетащите существующую.</p>
            ) : (
              <div className="space-y-2">
                {todos.map((node) => (
                  <TodoNode key={node.id} node={node} depth={0} />
                ))}
                <DropZone targetId="root" placement="after" depth={0} />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/80">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Быстрые действия</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Здесь появятся быстрые сценарии. Пока можно выдать разрешение на push-уведомления.</p>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={fetchGitHubCommits} className="rounded-2xl border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800">Последние коммиты (скоро)</button>
            <button onClick={requestNotificationsPermission} className="rounded-2xl border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800">Разрешить push-уведомления</button>
          </div>
        </div>
      </section>

      <Modal open={modal?.type === "add"} onClose={closeModal} title="Новая подзадача" maxWidth="max-w-md">
        <form className="space-y-4" onSubmit={handleAddSubmit}>
          <input
            value={modalInput}
            onChange={(event) => setModalInput(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
            placeholder="Описание подзадачи"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Создать
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal?.type === "edit"} onClose={closeModal} title="Переименовать задачу" maxWidth="max-w-md">
        <form className="space-y-4" onSubmit={handleEditSubmit}>
          <input
            value={modalInput}
            onChange={(event) => setModalInput(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-100"
            placeholder="Новое название"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover-bg-slate-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Сохранить
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal?.type === "delete"} onClose={closeModal} title="Удалить задачу" maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Удалить задачу «{modal?.node?.text}» вместе со всеми подзадачами?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover-bg-slate-800"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Удалить
            </button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
