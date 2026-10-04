import { Extension } from "@tiptap/core";

export const textAlignments = ["left", "center", "right", "justify"];

export const TextAlignment = Extension.create({
  name: "textAlignment",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph"],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element) =>
              textAlignments.includes(element.style.textAlign)
                ? element.style.textAlign
                : null,
            renderHTML: ({ textAlign }) =>
              textAlignments.includes(textAlign)
                ? { style: `text-align: ${textAlign}` }
                : {},
          },
        },
      },
    ];
  },
});
