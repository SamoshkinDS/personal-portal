// encoding: utf-8
import React from "react";
import { Link } from "react-router-dom";

export default function Logo({ showName = true, size = "md", className = "" }) {
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  const imgSize = sizeMap[size] || sizeMap.md;

  return (
    <Link
      to="/"
      className={`group inline-flex items-center gap-3 text-inherit ${className}`}
      title="На главную"
      aria-label="На главную"
    >
      <span
        className={`${imgSize} shrink-0 rounded-xl ring-1 ring-black/5 bg-white/70 dark:bg-slate-800/70 flex items-center justify-center overflow-hidden`}
      >
        <img
          src={"/icon-512.png"}
          alt="Логотип SAMOSHECHKIN"
          className="h-10 w-10 object-contain"
          loading="lazy"
          decoding="async"
        />
      </span>
      {showName && (
        <span className="font-semibold tracking-wide">
          SAMOSHECHKIN
        </span>
      )}
    </Link>
  );
}

