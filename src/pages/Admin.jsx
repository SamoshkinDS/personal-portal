import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PinModal from "../components/PinModal";

export default function Admin() {
  const [authorized, setAuthorized] = useState(false);
  const [pinOk, setPinOk] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    if (!auth) {
      navigate("/login");
    } else {
      setAuthorized(true);
    }
  }, [navigate]);

  if (!authorized) return null;

  if (!pinOk) return <PinModal onSuccess={() => setPinOk(true)} />;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Админ-панель 🔧</h2>
      <p>Добро пожаловать! Вы успешно вошли в систему.</p>
      <div className="mt-6">
        <button
          onClick={() => {
            localStorage.removeItem("auth");
            setPinOk(false);
            navigate("/login");
          }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
