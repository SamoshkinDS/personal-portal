import React from "react";
export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [password, setPassword] = React.useState("");

  const handleLogin = () => {
    if (password === "admin") { setLoggedIn(true); setPassword(""); }
    else alert("Неверный пароль");
  };

  if (!loggedIn)
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-4">Админ-панель</h2>
        <input type="password" placeholder="Пароль" className="border p-2 rounded mb-3 block"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin} className="bg-blue-600 text-white px-4 py-2 rounded">Войти</button>
      </div>
    );

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-4">Добро пожаловать в админку!</h2>
      <p>Тут в будущем будет возможность управлять контентом портала.</p>
    </div>
  );
}