// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageShell from "../components/PageShell.jsx";
import Modal from "../components/Modal.jsx";
import { apiAuthFetch } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const quickLinks = [
  {
    to: "/analytics",
    title: "Аналитика",
    description: "Метрики инфраструктуры, графики производительности и контроль узких мест.",
    badge: "Дашборды",
    iconBg: "bg-sky-500/10 text-sky-500 dark:bg-sky-400/10 dark:text-sky-300",
    glow: "bg-sky-500/20",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M4 20V9" />
        <path d="M10 20V4" />
        <path d="M16 20v-6" />
        <path d="M22 20V11" />
      </svg>
    ),
  },
  {
    to: "/ai",
    title: "AI и ML",
    description: "Нейросервисы, сценарии генерации и подбор промтов для команды.",
    badge: "Инструменты",
    iconBg: "bg-violet-500/10 text-violet-500 dark:bg-violet-400/10 dark:text-violet-300",
    glow: "bg-violet-500/20",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M9.5 2.5a3 3 0 0 1 5 0l.3.6a3 3 0 0 0 1.2 1.2l.6.3a3 3 0 0 1 0 5l-.6.3a3 3 0 0 0-1.2 1.2l-.3.6a3 3 0 0 1-5 0l-.3-.6a3 3 0 0 0-1.2-1.2l-.6-.3a3 3 0 0 1 0-5l.6-.3a3 3 0 0 0 1.2-1.2l.3-.6Z" />
        <path d="M8 16v2a4 4 0 0 0 4 4" />
        <path d="M16 16v2a4 4 0 0 1-4 4" />
        <path d="M7 8h.01" />
        <path d="M12 4h.01" />
        <path d="M17 8h.01" />
      </svg>
    ),
  },
  {
    to: "/docs",
    title: "Документация",
    description: "Гайды по сервисам, чек-листы и процессы запуска обновлений.",
    badge: "Знания",
    iconBg: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-300",
    glow: "bg-emerald-500/20",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4h10l4 4v12a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M14 4v5a1 1 0 0 0 1 1h5" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    ),
  },
  {
    to: "/vpn",
    title: "VPN",
    description: "Рабочие профили VPN и управление Outline/VLESS ключами.",
    badge: "Доступы",
    iconBg: "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-300",
    glow: "bg-amber-500/20",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c4.97 0 9-4.03 9-9S16.97 4 12 4 3 8.03 3 13c0 2.04.66 3.94 1.77 5.48a2 2 0 0 1 .33 1.11v1.41a1 1 0 0 0 1.45.89l2.55-1.27a2 2 0 0 1 1.78 0l2.55 1.27a1 1 0 0 0 1.45-.89v-1.41a2 2 0 0 1 .33-1.11A8.96 8.96 0 0 0 21 13" />
        <path d="M9 13h.01" />
        <path d="M12 13h.01" />
        <path d="M15 13h.01" />
      </svg>
    ),
  },
];


const quickDeployActions = [
  {
    key: "git-pull",
    label: "Git pull",
    tooltip: "Затянуть изменения из origin/main",
    accent: "bg-amber-500/15 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v14" />
        <path d="m8 13 4 4 4-4" />
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="21" r="1.5" />
      </svg>
    ),
  },
  {
    key: "backend-update",
    label: "Backend",
    tooltip: "Обновить зависимости backend и перезапустить сервис",
    accent: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-200",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="8" rx="2" />
        <rect x="3" y="13" width="18" height="8" rx="2" />
        <path d="M7 17h0.01" />
        <path d="M11 17h0.01" />
        <path d="M15 17h0.01" />
      </svg>
    ),
  },
  {
    key: "frontend-build",
    label: "Frontend",
    tooltip: "Собрать фронтенд и перезагрузить Nginx",
    accent: "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h18" />
        <path d="M3 17h18" />
        <path d="M6 3v4" />
        <path d="M18 3v4" />
        <path d="M6 17v4" />
        <path d="M18 17v4" />
        <path d="m9 10 3 3 3-3" />
      </svg>
    ),
  },
  {
    key: "deploy-full",
    label: "Deploy",
    tooltip: "Полный деплой (deploy.sh)",
    accent: "bg-blue-500/15 text-blue-600 dark:bg-blue-400/15 dark:text-blue-200",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13a8 8 0 0 1 16 0c0 4-4 8-8 8s-8-4-8-8Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
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
  const [runningAction, setRunningAction] = React.useState(null);
  const [actionResult, setActionResult] = React.useState(null);
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

  const runQuickAction = async (action) => {
    if (!action) return;
    setRunningAction(action.key);
    setActionResult(null);
    try {
      const response = await apiAuthFetch(`/api/actions/${action.key}/run`, { method: "POST" });
      let payload = {};
      try {
        payload = await response.json();
      } catch (parseErr) {
        payload = {};
      }
      if (!response.ok || payload?.ok === false) {
        const message = payload?.error || `Не удалось выполнить «${action.label}»`;
        throw new Error(message);
      }
      const stdout = typeof payload?.stdout === "string" ? payload.stdout : payload?.stdout != null ? String(payload.stdout) : "";
      const stderr = typeof payload?.stderr === "string" ? payload.stderr : payload?.stderr != null ? String(payload.stderr) : "";
      setActionResult({
        type: "success",
        label: action.label,
        message: payload?.message || `Команда «${action.label}» выполнена`,
        stdout,
        stderr,
      });
    } catch (error) {
      const stdout = typeof (error?.stdout) === "string" ? error.stdout : error?.stdout != null ? String(error.stdout) : "";
      const stderr = typeof (error?.stderr) === "string" ? error.stderr : error?.stderr != null ? String(error.stderr) : "";
      setActionResult({
        type: "error",
        label: action.label,
        message: error?.message || `Ошибка при выполнении «${action.label}»`,
        stdout,
        stderr,
      });
    } finally {
      setRunningAction(null);
    }
  };

  const spinnerIcon = (
    <svg className="h-5 w-5 animate-spin text-blue-500 dark:text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle className="opacity-30" cx="12" cy="12" r="9" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );

  const DropZone = ({ targetId, placement, depth = 0, label }) => {
    const isRootZone = targetId === "root";
    const active = dragOver && dragOver.targetId === targetId && dragOver.placement === placement;
    const marginLeft = label || isRootZone ? 0 : Math.max(0, depth * 20);

    const hasPayload = (event) => {
      if (draggingId !== null) return true;
      const raw = event.dataTransfer?.getData("text/plain");
      return Number.isFinite(Number(raw));
    };

    const handleEnter = (event) => {
      if (!hasPayload(event)) return;
      event.preventDefault();
      event.stopPropagation();
      if (!active) setDragOver({ targetId, placement });
    };

    const handleOver = (event) => {
      if (!hasPayload(event)) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      if (!active) setDragOver({ targetId, placement });
    };

    const handleLeave = (event) => {
      if (event.currentTarget.contains(event.relatedTarget)) return;
      if (active) setDragOver(null);
    };

    const handleDropEvent = (event) => {
      if (!hasPayload(event)) return;
      event.preventDefault();
      event.stopPropagation();
      const raw = draggingId ?? Number(event.dataTransfer?.getData("text/plain"));
      if (!Number.isFinite(raw)) {
        setDragOver(null);
        setDraggingId(null);
        return;
      }
      const dropTarget = isRootZone ? null : Number(targetId);
      handleMove(raw, dropTarget, placement);
    };

    if (label) {
      return (
        <div
          onDragEnter={handleEnter}
          onDragOver={handleOver}
          onDragLeave={handleLeave}
          onDrop={handleDropEvent}
          className={`mt-4 flex min-h-[56px] items-center justify-center rounded-2xl border border-dashed px-4 text-sm transition-colors ${
            active
              ? "border-blue-400/70 bg-blue-50/70 text-blue-600 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-200"
              : "border-gray-300/70 text-gray-500 dark:border-gray-600/60 dark:text-gray-400"
          }`}
        >
          <span className="pointer-events-none text-center leading-snug">{label}</span>
        </div>
      );
    }

    return (
      <div
        onDragEnter={handleEnter}
        onDragOver={handleOver}
        onDragLeave={handleLeave}
        onDrop={handleDropEvent}
        style={{ marginLeft }}
        className={`my-1 h-2 rounded-full transition-colors duration-150 ${
          active ? "bg-blue-400/60 dark:bg-blue-500/80" : "bg-transparent"
        }`}
      />
    );
  };

  const TodoNode = ({ node, depth }) => {
    const stats = computeDescendantStats(node);
    const isCollapsed = collapsed.has(node.id);
    const isDragging = draggingId === node.id;
    const isChildTarget = dragOver && dragOver.targetId === node.id && dragOver.placement === "child";

    const allowChildDrop = () => {
      if (draggingId === null || draggingId === node.id) return false;
      return !nodeContains(node, draggingId);
    };

    const handleChildEnter = (event) => {
      if (!allowChildDrop()) return;
      event.preventDefault();
      event.stopPropagation();
      setDragOver({ targetId: node.id, placement: "child" });
    };

    const handleChildOver = (event) => {
      if (!allowChildDrop()) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      if (!isChildTarget) setDragOver({ targetId: node.id, placement: "child" });
    };

    const handleChildLeave = (event) => {
      if (event.currentTarget.contains(event.relatedTarget)) return;
      if (isChildTarget) setDragOver(null);
    };

    const handleChildDrop = (event) => {
      if (!allowChildDrop()) return;
      event.preventDefault();
      event.stopPropagation();
      handleMove(draggingId, node.id, "child");
    };

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
          onDragEnter={handleChildEnter}
          onDragOver={handleChildOver}
          onDragLeave={handleChildLeave}
          onDrop={handleChildDrop}
          className={`relative flex items-start gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm transition shadow-sm hover:border-blue-200 hover:shadow-md dark:border-gray-700 dark:bg-slate-800 ${
            isDragging ? "cursor-grabbing opacity-60 ring-1 ring-blue-400/60" : "cursor-grab"
          } ${isChildTarget ? "border-blue-300/70 bg-blue-50/40 dark:border-blue-400/40 dark:bg-blue-500/10" : ""}`}
          style={{ marginLeft: depth * 20 }}
        >
          {isChildTarget && (
            <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-dashed border-blue-400/60 bg-blue-500/5 backdrop-blur-sm dark:border-blue-400/40 dark:bg-blue-500/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-200">Переместить внутрь</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="mt-1 inline-flex cursor-grab select-none text-gray-300 transition group-hover:text-blue-400 dark:text-gray-500 dark:group-hover:text-blue-300">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M6 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6 16a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
              </svg>
            </span>
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
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="Добавить подзадачу"
              onClick={() => openAddModal(node.id)}
              onDragStart={(event) => event.stopPropagation()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-blue-400/40 dark:hover:text-blue-200"
            >
              <span className="sr-only">Добавить подзадачу</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M10 4v12" />
                <path d="M4 10h12" />
              </svg>
            </button>
            <button
              type="button"
              title="Редактировать задачу"
              onClick={() => openEditModal(node)}
              onDragStart={(event) => event.stopPropagation()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-blue-400/40 dark:hover:text-blue-200"
            >
              <span className="sr-only">Редактировать задачу</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 13.5V16h2.5L15 7.5l-2.5-2.5L4 13.5Z" />
                <path d="m12.5 5 2.5 2.5" />
              </svg>
            </button>
            <button
              type="button"
              title="Удалить задачу"
              onClick={() => openDeleteModal(node)}
              onDragStart={(event) => event.stopPropagation()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 dark:border-red-500/40 dark:bg-slate-800 dark:text-red-300 dark:hover:border-red-400/50 dark:hover:bg-red-500/10"
            >
              <span className="sr-only">Удалить задачу</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h12" />
                <path d="M8 6V4.5a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5V6" />
                <path d="M8 9v6" />
                <path d="M12 9v6" />
                <path d="M6 6l.4 9a1.5 1.5 0 0 0 1.5 1.4h4.2a1.5 1.5 0 0 0 1.5-1.4L14 6" />
              </svg>
            </button>
          </div>
        </div>
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
            <motion.div key={item.to} whileHover={{ y: -4 }} className="w-[240px] flex-shrink-0 snap-start md:w-auto">
              <Link
                to={item.to}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-slate-700/60 dark:bg-slate-900/85"
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute -top-32 right-0 h-48 w-48 translate-x-16 rounded-full blur-3xl opacity-0 transition duration-500 group-hover:opacity-100 ${item.glow}`}
                />
                <div className="flex items-center justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg}`}>{item.icon}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition-colors group-hover:bg-slate-900 group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700">
                    {item.badge}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-300">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 transition-colors group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300">
                    {item.description}
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-all group-hover:gap-3 dark:text-blue-300">
                  Открыть
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 15L15 5" />
                    <path d="M7 5h8v8" />
                  </svg>
                </span>
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
          <div className="mt-4 space-y-3">
            {todos.length === 0 ? (
              <DropZone
                targetId="root"
                placement="after"
                depth={0}
                label="Перетащите задачу сюда или создайте новую."
              />
            ) : (
              <>
                {todos.map((node) => (
                  <TodoNode key={node.id} node={node} depth={0} />
                ))}
                <DropZone
                  targetId="root"
                  placement="after"
                  depth={0}
                  label="Отпустите здесь, чтобы переместить задачу в корень"
                />
              </>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white/80 p-6 shadow-sm transition-colors duration-500 dark:bg-slate-900/80">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Быстрые действия</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Управляйте деплоем через подготовленные скрипты: отдельные действия для git, backend, frontend и полный запуск deploy.sh.</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickDeployActions.map((action) => {
              const isRunning = runningAction === action.key;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => runQuickAction(action)}
                  disabled={isRunning}
                  title={action.tooltip}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white/95 px-3 py-4 text-sm font-medium text-gray-600 transition hover:border-blue-400/60 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 dark:border-gray-700 dark:bg-slate-800/85 dark:text-gray-200 dark:hover:border-blue-400/40 dark:hover:text-blue-200"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.accent} ${isRunning ? "ring-2 ring-blue-400/40" : ""}`}>
                    {isRunning ? spinnerIcon : action.icon}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-300">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
          {actionResult && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-xs leading-relaxed transition ${
                actionResult.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
              }`}
              role="status"
            >
              <div className="font-semibold">{actionResult.message}</div>
              {actionResult.stdout && (
                <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px] text-current/80">
                  {actionResult.stdout.trim() || "stdout пуст"}
                </pre>
              )}
              {actionResult.stderr && (
                <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px] text-current/80">
                  {actionResult.stderr.trim()}
                </pre>
              )}
            </div>
          )}
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

