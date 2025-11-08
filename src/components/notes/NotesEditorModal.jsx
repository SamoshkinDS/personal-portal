// encoding: utf-8
import React from "react";
import Modal from "../Modal.jsx";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import FontSize from "./extensions/FontSize.js";

// Icons
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdStrikethroughS,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdCode,
  MdLink,
  MdLinkOff,
  MdImage,
  MdTableChart,
  MdAdd,
  MdRemove,
} from "react-icons/md";

const DEFAULT_NOTE = {
  title: "",
  description: "",
  content: "",
};

export default function NotesEditorModal({ open, onClose, initialValue, onSubmit, loading }) {
  const [formState, setFormState] = React.useState(() => ({ ...DEFAULT_NOTE }));
  const [tableModalOpen, setTableModalOpen] = React.useState(false);
  const [tableRows, setTableRows] = React.useState(3);
  const [tableCols, setTableCols] = React.useState(3);

  const editor = useEditor({
    extensions: [
      Color.configure({ types: [TextStyle.name] }),
      TextStyle,
      FontSize,
      Underline,
      Link.configure({ openOnClick: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Image.configure({ inline: false }),
      Table.configure({ resizable: false, HTMLAttributes: { class: "note-table" } }),
      TableRow,
      TableHeader,
      TableCell,
      StarterKit.configure({
        bulletList: true,
        orderedList: true,
        blockquote: true,
        codeBlock: true,
        history: true,
      }),
    ],
    content: initialValue?.content || "",
    editorProps: {
      attributes: { class: "note-editor prose max-w-none dark:prose-invert" },
    },
  });

  React.useEffect(() => {
    setFormState(initialValue ? { ...initialValue } : { ...DEFAULT_NOTE });
    // sync editor content when opening for edit/create
    if (editor && open) {
      editor.commands.setContent(initialValue?.content || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, open, editor]);

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const applyFontSize = (size) => {
    if (!editor) return;
    if (!size) {
      editor.chain().focus().unsetFontSize().run();
      return;
    }
    editor.chain().focus().setFontSize(size).run();
  };

  const applyColor = (color) => {
    if (!editor) return;
    if (!color) {
      editor.chain().focus().unsetColor().run();
      return;
    }
    editor.chain().focus().extendMarkRange("textStyle").setColor(color).run();
  };

  const insertLink = () => {
    if (!editor) return;
    const url = window.prompt("Вставьте URL (http/https):", "https://");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const removeLink = () => editor?.chain().focus().unsetLink().run();
  const insertImage = () => {
    if (!editor) return;
    const url = window.prompt("URL изображения (S3 / MinIO / HTTP):");
    if (!url) return;
    editor.chain().focus().setImage({ src: url, alt: "Изображение" }).run();
  };

  const openInsertTable = () => setTableModalOpen(true);
  const closeInsertTable = () => setTableModalOpen(false);
  const confirmInsertTable = () => {
    if (!editor) return;
    const rows = Math.max(1, Number(tableRows) || 1);
    const cols = Math.max(1, Number(tableCols) || 1);
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    closeInsertTable();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (loading) return;
    const content = editor?.getHTML() || "";
    onSubmit?.({ ...formState, content });
  };

  return (
    <>
    <Modal open={open} onClose={onClose} title={initialValue?.id ? "Редактировать заметку" : "Новая заметка"} maxWidth="max-w-5xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-gray-900 dark:text-gray-100">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Заголовок *</span>
          <input
            required
            maxLength={255}
            value={formState.title}
            onChange={handleChange("title")}
            placeholder="Например: Архитектура MinIO"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Краткое описание (до 200 символов)</span>
          <textarea
            maxLength={200}
            value={formState.description}
            onChange={handleChange("description")}
            placeholder="Эта заметка пригодится, когда нужно быстро вспомнить..."
            className="custom-scrollbar h-24 w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100"
          />
        </label>

        <div className="space-y-2">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold mr-1 text-gray-700 dark:text-gray-300">Формат</span>
            <button title="Жирный" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().toggleBold().run()}><MdFormatBold /></button>
            <button title="Курсив" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().toggleItalic().run()}><MdFormatItalic /></button>
            <button title="Подчеркнутый" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().toggleUnderline().run()}><MdFormatUnderlined /></button>
            <button title="Зачёркнутый" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().toggleStrike().run()}><MdStrikethroughS /></button>

            <select aria-label="Размер шрифта" className="rounded-xl border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-slate-800" onChange={(e) => applyFontSize(e.target.value)} defaultValue="">
              <option value="">Размер</option>
              {["12px","14px","16px","18px","20px","24px","28px","32px"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input title="Цвет" type="color" aria-label="Цвет" className="h-9 w-9 cursor-pointer rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-slate-800" onChange={(e) => applyColor(e.target.value)} />

            <button title="Маркированный список" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().toggleBulletList().run()}><MdFormatListBulleted /></button>
            <button title="Нумерованный список" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><MdFormatListNumbered /></button>
            <button title="Цитата" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><MdFormatQuote /></button>
            <button title="Код" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><MdCode /></button>

            <button title="Ссылка" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={insertLink}><MdLink /></button>
            <button title="Удалить ссылку" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={removeLink}><MdLinkOff /></button>
            <button title="Изображение" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={insertImage}><MdImage /></button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold mr-1 text-gray-700 dark:text-gray-300">Таблицы</span>
            <button title="Вставить таблицу" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={openInsertTable}><MdTableChart /></button>
            <button title="Добавить строку" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().addRowAfter().run()}><MdAdd /><span className="sr-only">Строка</span></button>
            <button title="Добавить столбец" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().addColumnAfter().run()}><MdAdd /><span className="sr-only">Столбец</span></button>
            <button title="Удалить строку" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().deleteRow().run()}><MdRemove /><span className="sr-only">Строка</span></button>
            <button title="Удалить столбец" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().deleteColumn().run()}><MdRemove /><span className="sr-only">Столбец</span></button>
            <button title="Удалить таблицу" type="button" className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200" onClick={() => editor?.chain().focus().deleteTable().run()}>Удалить</button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-slate-800">
            <EditorContent editor={editor} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200"
            disabled={loading}
          >
            Отмена
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
    {/* Insert Table Modal */}
    <Modal open={tableModalOpen} onClose={closeInsertTable} title="Вставить таблицу" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Строки</span>
            <input type="number" min={1} value={tableRows} onChange={(e) => setTableRows(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Столбцы</span>
            <input type="number" min={1} value={tableCols} onChange={(e) => setTableCols(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-100" />
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={closeInsertTable} className="btn border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-200">Отмена</button>
          <button type="button" onClick={confirmInsertTable} className="btn btn-primary">Вставить</button>
        </div>
      </div>
    </Modal>
    </>
  );
}
