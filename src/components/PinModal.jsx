// encoding: utf-8
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PIN_CODE = "1234";

export default function PinModal({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // Фокусируем поле сразу после появления модального окна.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(digitsOnly);
    if (error) setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (pin === PIN_CODE) {
      setPin("");
      setError("");
      onSuccess();
    } else {
      setError("Неверный PIN-код. Попробуйте снова.");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="pin-modal fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        <motion.form
          onSubmit={handleSubmit}
          className="pin-modal__card w-full max-w-xs space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          <div className="pin-modal__header text-center">
            <h3 className="pin-modal__title text-lg font-semibold text-gray-900">
              Введите PIN
            </h3>
            <p className="pin-modal__subtitle mt-1 text-sm text-gray-500">
              Доступ к админ-панели защищён коротким кодом.
            </p>
          </div>

          <motion.input
            ref={inputRef}
            type="password"
            value={pin}
            onChange={handleChange}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••"
            className="pin-modal__input w-full rounded-xl border border-gray-200 p-3 text-center text-2xl tracking-[0.5rem] text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            whileFocus={{ scale: 1.01 }}
          />

          <div className="pin-modal__error min-h-[20px] text-center text-sm text-red-500">
            {error}
          </div>

          <motion.button
            type="submit"
            className="pin-modal__submit w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            whileTap={{ scale: 0.97 }}
          >
            Войти
          </motion.button>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
