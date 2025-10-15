import React from "react";

export default function NeuralNets() {
  const nets = [
    { name: "ChatGPT", desc: "Промты для анализа и генерации текста." },
    { name: "Midjourney", desc: "Промты для генерации изображений." },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Нейронки</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {nets.map((n, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
            <h3 className="font-semibold">{n.name}</h3>
            <p className="text-gray-500">{n.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
