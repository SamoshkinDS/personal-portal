// encoding: utf-8
import React from "react";

function List({ id, title, items, onDropItem }) {
  const allow = (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e) => {
    e.preventDefault();
    const payload = e.dataTransfer?.getData("text/plain");
    if (!payload) return;
    onDropItem(payload, id);
  };
  return (
    <div className="flex-1 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-800/70">
      <div className="mb-2 text-xs font-semibold text-slate-500">{title}</div>
      <div
        className="min-h-[220px] rounded-xl border border-dashed border-slate-300/60 p-3 dark:border-slate-600/60"
        onDragOver={allow}
        onDragEnter={allow}
        onDrop={handleDrop}
      >
        <div className="flex flex-col gap-2">
          {items.map((it) => (
            <div
              key={it}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", it);
                try {
                  const el = e.currentTarget;
                  e.dataTransfer.setDragImage(el, el.offsetWidth / 2, 16);
                } catch {}
                console.log("probe: dragstart", it);
              }}
              onDragEnd={() => console.log("probe: dragend", it)}
              className="cursor-grab active:cursor-grabbing rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {it}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DebugDnd() {
  const [left, setLeft] = React.useState(["A-1", "A-2"]);
  const [right, setRight] = React.useState(["B-1", "B-2"]);

  const onDropItem = (item, list) => {
    if (left.includes(item) || right.includes(item)) {
      if (list === "left") {
        setLeft((l) => [...l.filter((x) => x !== item), item]);
        setRight((r) => r.filter((x) => x !== item));
      } else {
        setRight((r) => [...r.filter((x) => x !== item), item]);
        setLeft((l) => l.filter((x) => x !== item));
      }
    }
  };

  const support = typeof window !== "undefined" && "ondragstart" in window;

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">HTML5 Drag & Drop Probe</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Support: <span className="font-semibold">{String(support)}</span>
      </p>
      <div className="mt-4 flex gap-4">
        <List id="left" title="LEFT" items={left} onDropItem={onDropItem} />
        <List id="right" title="RIGHT" items={right} onDropItem={onDropItem} />
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Р•СЃР»Рё Р·РґРµСЃСЊ РїРµСЂРµС‚Р°СЃРєРёРІР°РЅРёРµ СЂР°Р±РѕС‚Р°РµС‚ вЂ” HTML5 DnD РІ Р±СЂР°СѓР·РµСЂРµ РѕРє, РїСЂРѕР±Р»РµРјР° РІ Р»РѕРіРёРєРµ Home. Р•СЃР»Рё РЅРµ СЂР°Р±РѕС‚Р°РµС‚ вЂ”
        РїСЂРѕРІРµСЂСЊС‚Рµ СѓСЃС‚СЂРѕР№СЃС‚РІРѕ (РјРѕР±РёР»СЊРЅС‹Р№ Safari/СЃРµРЅСЃРѕСЂРЅС‹Р№ СЂРµР¶РёРј) РёР»Рё СЂР°СЃС€РёСЂРµРЅРёСЏ/РїРѕР»РёС‚РёРєРё, Р±Р»РѕРєРёСЂСѓСЋС‰РёРµ DnD.
      </p>
    </div>
  );
}