import React from "react";

export default function Analytics() {
  const cards = [
    { title: "Теория: UML", desc: "Краткое описание..." },
    { title: "Практика: задачи", desc: "Краткое описание..." },
  ];
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">АНАЛИТИКА</h2>
      <input placeholder="Поиск..." className="border p-2 w-full max-w-md mb-6 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="p-4 border rounded-lg shadow-sm bg-white">
            <h3 className="font-bold">{card.title}</h3>
            <p className="text-sm text-gray-600">{card.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-gray-400 text-sm mt-10">Версия сайта: 1.0.1 (локальное обновление)</p>
    </div>
  );
}