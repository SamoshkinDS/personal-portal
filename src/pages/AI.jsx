import React from "react";

export default function AI() {
  const tools = [
    { name: "ChatGPT", desc: "Помощник для анализа и текстов" },
    { name: "Midjourney", desc: "Создание изображений по промтам" },
  ];
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">НЕЙРОНКИ</h2>
      <ul className="space-y-3">
        {tools.map((tool, i) => (
          <li key={i} className="border p-4 rounded-lg bg-white">
            <h3 className="font-bold">{tool.name}</h3>
            <p className="text-sm text-gray-600">{tool.desc}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}