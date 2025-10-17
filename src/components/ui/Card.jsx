// encoding: utf-8
import React from "react";

export default function UICard({ className = "", children, ...rest }) {
  return (
    <div
      className={`rounded-2xl p-6 shadow-md hover:shadow-xl transition-all bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

