import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <div className="w-64 bg-gray-800 text-gray-100 flex flex-col min-h-screen">
      <div className="p-4 text-xl font-bold border-b border-gray-700">🧭 Портал</div>
      <nav className="flex-1 p-4 space-y-3">
        <Link to="/analytics" className="block hover:text-blue-400">Аналитика</Link>
        <Link to="/ai" className="block hover:text-blue-400">Нейронки</Link>
        <Link to="/docs" className="block hover:text-blue-400">Документация</Link>
        <Link to="/posts" className="block hover:text-blue-400">Посты</Link>
        <Link to="/settings" className="block hover:text-blue-400">Настройки</Link>
        <Link to="/admin" className="block hover:text-blue-400">Админка</Link>
      </nav>
      <button
        onClick={logout}
        className="m-4 py-2 rounded bg-red-600 hover:bg-red-700 transition text-white font-semibold"
      >
        Выйти
      </button>
    </div>
  );
}
