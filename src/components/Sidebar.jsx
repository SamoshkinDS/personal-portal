import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 h-screen p-4 flex flex-col justify-between text-gray-900 dark:text-gray-100 transition-colors duration-[3000ms]">
      <div>
        <h1 className="text-xl font-bold mb-6">LOGO</h1>
        <nav className="flex flex-col gap-3">
          <Link to="/analytics" className="hover:text-blue-400">Аналитика</Link>
          <Link to="/ai" className="hover:text-blue-400">Нейронки</Link>
          <Link to="/docs" className="hover:text-blue-400">Документация</Link>
          <Link to="/posts" className="hover:text-blue-400">Посты</Link>
          <Link to="/admin" className="hover:text-blue-400">Админ</Link>
        </nav>
      </div>
      <div>
        <Link to="/settings" className="text-gray-600 dark:text-gray-300 hover:text-blue-400">
          ⚙ Настройки
        </Link>
      </div>
    </div>
  );
}
