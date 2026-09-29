import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

export const BlockIdentity = Extension.create({
  name: "blockIdentity",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "bulletList", "orderedList"],
        attributes: {
          i18nId: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-i18n-id"),
            renderHTML: (attrs) =>
              attrs.i18nId ? { "data-i18n-id": attrs.i18nId } : {},
          },
        },
      },
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction(transactions, _oldState, state) {
          if (!transactions.some((transaction) => transaction.docChanged))
            return null;
          const seen = new Set();
          const transaction = state.tr;
          state.doc.forEach((node, offset) => {
            let id = node.attrs.i18nId;
            if (!id || seen.has(id)) {
              id = crypto.randomUUID();
              transaction.setNodeMarkup(offset, undefined, {
                ...node.attrs,
                i18nId: id,
              });
            }
            seen.add(id);
          });
          return transaction.docChanged ? transaction : null;
        },
      }),
    ];
  },
});
