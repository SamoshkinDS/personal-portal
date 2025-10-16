// encoding: utf-8
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("auth");
    return saved ? JSON.parse(saved) : null;
  });

  // Синхронизируем состояние авторизации с localStorage.
  useEffect(() => {
    if (user) {
      localStorage.setItem("auth", JSON.stringify(user));
    } else {
      localStorage.removeItem("auth");
    }
  }, [user]);

  // Проверяем логин и пароль администратора.
  const login = (login, password) => {
    if (login === "admin" && password === "admin") {
      const data = { username: "admin", role: "admin" };
      setUser(data);
      navigate("/analytics", { replace: true });
      return true;
    }
    return false;
  };

  // Очищаем авторизацию и возвращаем на страницу входа.
  const logout = () => {
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
