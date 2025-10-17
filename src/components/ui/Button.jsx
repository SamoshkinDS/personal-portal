// encoding: utf-8
import React from "react";
import { motion } from "framer-motion";

export default function UIButton({ className = "", children, ...rest }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-2xl px-4 py-2 font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md hover:shadow-xl transition-all ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

