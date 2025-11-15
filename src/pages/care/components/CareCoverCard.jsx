import React from "react";

export default function CareCoverCard({
  photoUrl,
  name,
  placeholder = "🌿",
  canManage = false,
  uploading = false,
  onUpload,
  className = "",
}) {
  const inputRef = React.useRef(null);

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (file && typeof onUpload === "function") {
      onUpload(file);
    }
    event.target.value = "";
  };

  return (
    <div
      className={`relative h-80 overflow-hidden rounded-3xl border border-slate-100 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5 ${className}`}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-6xl">{placeholder}</div>
      )}

      {canManage && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-md hover:bg-white disabled:opacity-70 dark:bg-slate-900/80 dark:text-slate-100"
          >
            {uploading ? "Загружаем..." : "Обновить фото"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
        </>
      )}
    </div>
  );
}
