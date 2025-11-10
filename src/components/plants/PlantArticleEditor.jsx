import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdCode,
  MdLink,
  MdLinkOff,
  MdImage,
} from "react-icons/md";
import Modal from "../Modal.jsx";

export function getPlantArticleExtensions() {
  return [
    Color.configure({ types: [TextStyle.name] }),
    TextStyle,
    Underline,
    Link.configure({ openOnClick: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
    Image.configure({ inline: false }),
    StarterKit.configure({
      bulletList: true,
      orderedList: true,
      blockquote: true,
      codeBlock: true,
      history: true,
      underline: false,
      link: false,
    }),
  ];
}

const EMPTY_DOC = { type: "doc", content: [] };

export default function PlantArticleEditor({
  open,
  onClose,
  initialContent,
  initialMarkdown = "",
  onSave,
  loading,
}) {
  const [activeTab, setActiveTab] = React.useState("visual");
  const [markdownValue, setMarkdownValue] = React.useState(initialMarkdown || "");
  const editor = useEditor({
    extensions: getPlantArticleExtensions(),
    content: initialContent || EMPTY_DOC,
    editorProps: {
      attributes: {
        class: "prose max-w-none dark:prose-invert min-h-[320px] rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 focus:outline-none dark:border-white/10 dark:bg-slate-900/60 dark:text-white",
      },
    },
  });

  React.useEffect(() => {
    if (editor && open) {
      editor.commands.setContent(initialContent || EMPTY_DOC);
      setMarkdownValue(initialMarkdown || "");
      setActiveTab("visual");
    }
  }, [editor, initialContent, initialMarkdown, open]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!editor || loading) return;
    const doc = editor.getJSON();
    onSave?.({
      content_rich: doc,
      content_text: markdownValue,
    });
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
    const url = window.prompt("URL изображения (S3 / HTTP):");
    if (!url) return;
    editor.chain().focus().setImage({ src: url, alt: "Изображение" }).run();
  };

  return (
    <Modal open={open} onClose={onClose} title="Статья о растении" maxWidth="max-w-5xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-slate-900 dark:text-slate-100">
        <div className="flex gap-2">
          {["visual", "markdown"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow"
                  : "border border-slate-200 text-slate-500 hover:border-blue-200 hover:text-blue-600 dark:border-white/10 dark:text-slate-300"
              }`}
            >
              {tab === "visual" ? "Визуально" : "Markdown"}
            </button>
          ))}
        </div>

        {activeTab === "visual" ? (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-slate-500 dark:text-slate-300">Формат</span>
              <ToolbarButton icon={<MdFormatBold />} onClick={() => editor?.chain().focus().toggleBold().run()} />
              <ToolbarButton icon={<MdFormatItalic />} onClick={() => editor?.chain().focus().toggleItalic().run()} />
              <ToolbarButton icon={<MdFormatUnderlined />} onClick={() => editor?.chain().focus().toggleUnderline().run()} />
              <ToolbarButton icon={<MdFormatListBulleted />} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
              <ToolbarButton icon={<MdFormatListNumbered />} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
              <ToolbarButton icon={<MdFormatQuote />} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
              <ToolbarButton icon={<MdCode />} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} />
              <ToolbarButton icon={<MdLink />} onClick={insertLink} />
              <ToolbarButton icon={<MdLinkOff />} onClick={removeLink} />
              <ToolbarButton icon={<MdImage />} onClick={insertImage} />
              <input
                type="color"
                aria-label="Цвет"
                className="h-9 w-9 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-slate-800"
                onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
              />
            </div>
            <EditorContent editor={editor} />
          </>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <textarea
              value={markdownValue}
              onChange={(e) => setMarkdownValue(e.target.value)}
              className="min-h-[280px] rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900/40"
              placeholder="## Заголовок\n\n- Элемент списка"
            />
            <div className="min-h-[280px] rounded-2xl border border-slate-100 bg-white/80 p-4 text-sm dark:border-white/10 dark:bg-slate-900/40">
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose max-w-none dark:prose-invert">
                {markdownValue || "*Здесь появится предпросмотр...*"}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 dark:border-white/10 dark:text-slate-300"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ToolbarButton({ icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
    >
      {icon}
    </button>
  );
}
