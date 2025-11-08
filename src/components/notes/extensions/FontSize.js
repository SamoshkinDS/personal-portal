import { Extension } from "@tiptap/core";

// Simple FontSize helper that maps to textStyle mark's style.fontSize
const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            renderHTML: (attrs) => {
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}` };
            },
            parseHTML: (element) => ({ fontSize: element.style?.fontSize || null }),
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().unsetMark("textStyle").run(),
    };
  },
});

export default FontSize;

