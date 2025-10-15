import React from "react";

export default function Settings() {
  const [dark, setDark] = React.useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  React.useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <div className="p-8 transition-colors duration-[3000ms]">
      <h2 className="text-2xl font-semibold mb-4">НАСТРОЙКИ</h2>
      <div className="space-y-3">
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setDark(!dark)}
        >
          <div
            className={`w-14 h-8 rounded-full transition-colors duration-500 ${
              dark ? "bg-blue-500" : "bg-gray-300"
            } relative`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-500 ${
                dark ? "translate-x-6" : ""
              }`}
            ></div>
          </div>
          <span className="text-base">
            {dark ? "Тёмная тема включена" : "Светлая тема"}
          </span>
        </div>
      </div>
    </div>
  );
}
