import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PinModal({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const checkPin = () => {
    if (pin === "1234") {
      onSuccess();
    } else {
      setError("Неверный PIN-код");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 shadow-2xl w-80 border border-gray-200"
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 15,
            duration: 0.4,
          }}
        >
          <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">
            Введите PIN-код
          </h3>

          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            className="border w-full mb-3 p-2 rounded text-center tracking-widest text-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />

          {error && (
            <p className="text-red-500 text-sm text-center mb-2">{error}</p>
          )}

          <button
            onClick={checkPin}
            className="bg-blue-600 text-white w-full mt-3 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Подтвердить
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
