import React from "react";

export default function Docs() {
  const links = [
    { name: "MDN Web Docs", url: "https://developer.mozilla.org" },
    { name: "React Docs", url: "https://react.dev" },
  ];
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">ДОКУМЕНТАЦИЯ</h2>
      <ul className="list-disc ml-5">
        {links.map((l, i) => (
          <li key={i}><a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{l.name}</a></li>
        ))}
      </ul>
    </div>
  );
}