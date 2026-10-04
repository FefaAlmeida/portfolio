"use client";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useEffect } from "react";
import { useI18n } from "@/i18n/provider";
import { BlockIdentity } from "./block-identity";
import { TextAlignment } from "./text-alignment";

const alignmentOptions = [
  ["left", "Alinhar à esquerda", AlignLeft],
  ["center", "Centralizar", AlignCenter],
  ["right", "Alinhar à direita", AlignRight],
  ["justify", "Justificar", AlignJustify],
];

function editorContent(value) {
  if (value == null || typeof value === "string") {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          ...(value ? { content: [{ type: "text", text: value }] } : {}),
        },
      ],
    };
  }
  return value;
}

export default function TextEditor({
  value,
  onChange,
  label,
  disabled = false,
  pendingIds = [],
}) {
  const { ui } = useI18n();
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      BlockIdentity,
      TextAlignment,
      StarterKit.configure({
        undoRedo: false,
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: {
          openOnClick: false,
          autolink: false,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
    ],
    content: editorContent(value),
    editorProps: {
      attributes: {
        "aria-label": label,
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor, transaction }) =>
      onChange(
        editor.getJSON(),
        transaction.steps.every((step) => step.toJSON().stepType === "replace"),
      ),
  });
  useEffect(() => {
    editor?.setEditable(!disabled, false);
  }, [editor, disabled]);
  useEffect(() => {
    if (!editor || !value) return;
    for (const element of editor.view.dom.querySelectorAll("[data-i18n-id]")) {
      element.toggleAttribute(
        "data-needs-review",
        pendingIds.includes(element.dataset.i18nId),
      );
    }
  }, [editor, value, pendingIds]);
  useEffect(() => {
    if (!editor) return;
    const content = editorContent(value);
    const normalized = editor.schema.nodeFromJSON(content).toJSON();
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(normalized)) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(content, { emitUpdate: false });
      const end = editor.state.doc.content.size;
      editor.commands.setTextSelection({
        from: Math.min(from, end),
        to: Math.min(to, end),
      });
    }
  }, [editor, value]);
  if (!editor) return <p>{ui("Carregando editor…")}</p>;
  const alignment = editor.getAttributes("paragraph").textAlign || "left";
  const AlignmentIcon =
    alignmentOptions.find(([value]) => value === alignment)?.[2] || AlignLeft;
  const command = (name) => () => editor.chain().focus()[name]().run();
  const link = () => {
    const href = window.prompt(
      ui("Endereço do link (https://…); deixe vazio para remover."),
      editor.getAttributes("link").href || "",
    );
    if (href === null) return;
    if (!href) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    try {
      const url = new URL(href);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    } catch {
      window.alert(ui("Informe um endereço http ou https válido."));
    }
  };
  return (
    <div className="text-editor [&_.tiptap_strong]:font-semibold [&_.tiptap_strong]:text-highlight">
      <div
        className="editor-toolbar"
        role="toolbar"
        onPointerDown={(event) => event.preventDefault()}
        aria-label={ui("Formatação: {0}", { 0: label })}
      >
        <button
          type="button"
          aria-label={ui("Negrito")}
          title={ui("Negrito")}
          aria-pressed={editor.isActive("bold")}
          onClick={command("toggleBold")}
        >
          <Bold aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={ui("Itálico")}
          title={ui("Itálico")}
          aria-pressed={editor.isActive("italic")}
          onClick={command("toggleItalic")}
        >
          <Italic aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={ui("Lista")}
          title={ui("Lista com marcadores")}
          aria-pressed={editor.isActive("bulletList")}
          onClick={command("toggleBulletList")}
        >
          <List aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={ui("Lista numerada")}
          title={ui("Lista numerada")}
          aria-pressed={editor.isActive("orderedList")}
          onClick={command("toggleOrderedList")}
        >
          <ListOrdered aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={ui("Link")}
          title={ui("Inserir ou editar link")}
          aria-pressed={editor.isActive("link")}
          onClick={link}
        >
          <Link aria-hidden="true" />
        </button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label={ui("Alinhamento do texto")}
              title={ui("Alinhamento do texto")}
            >
              <AlignmentIcon aria-hidden="true" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={6}
              className="z-[80] min-w-48 rounded-xl border border-[#e7d9d0] bg-white p-1.5 text-sm text-[#3d302b] shadow-lg"
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              <DropdownMenu.RadioGroup
                value={alignment}
                onValueChange={(value) =>
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("paragraph", { textAlign: value })
                    .run()
                }
              >
                {alignmentOptions.map(([value, title, Icon]) => (
                  <DropdownMenu.RadioItem
                    key={value}
                    value={value}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 outline-none data-[highlighted]:bg-[#f8ede7] data-[state=checked]:bg-[#f8ede7] data-[state=checked]:text-[#a94158]"
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {ui(title)}
                  </DropdownMenu.RadioItem>
                ))}
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
