"use client";

// --- REACT & UI IMPORTS ---
import { useState, useEffect } from "react";
import { UrlInputModal } from "./UrlInputModal";
import { EditorStats } from "./EditorStats";
import "highlight.js/styles/atom-one-dark.css";

// --- CORE TIPPY IMPORTS ---
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Toolbar } from "./Toolbar";

// --- TIPPY EXTENSIONS ---
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { SlashCommand } from "./slash-command";
import Placeholder from "@tiptap/extension-placeholder";

// Load the languages you need for syntax highlighting
const lowlight = createLowlight(common);

export default function NoteDetails() {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: "Write something…",
      }),
      Image,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          class: "text-blue-500 underline cursor-pointer",
        },
      }),
      TextStyle,
      Color,
      CharacterCount.configure({
        limit: 10000,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      TaskList,

      TaskList.configure({
        HTMLAttributes: {
          class: "not-prose",
        },
      }),
      TaskItem.configure({
        nested: true,
      }),

      SlashCommand,
    ],
    content: ``,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    const handleOpenModal = () => setIsImageModalOpen(true);
    window.addEventListener("open-image-modal", handleOpenModal);
    return () => {
      window.removeEventListener("open-image-modal", handleOpenModal);
    };
  }, []);

  // --- START: NEW DEBUGGING FUNCTION ---
  const logContent = () => {
    if (editor) {
      console.log(editor.getHTML());
    }
  };
  // --- END: NEW DEBUGGING FUNCTION ---

  if (!editor) {
    // Skeleton component
    return (
      <div className="flex w-full flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-5xl rounded-lg border bg-background shadow-xl">
          <div className="h-[56px] w-full animate-pulse rounded-t-lg border-b bg-muted"></div>
          <div className="min-h-[400px] p-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted"></div>
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-muted"></div>
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-muted"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleImageSubmit = (url: string) => {
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setIsImageModalOpen(false);
  };

  return (
    <>
      <UrlInputModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onSubmit={handleImageSubmit}
        title="Add Image from URL"
      />
      <div className="flex w-full flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-lg border bg-background shadow-xl">
          <Toolbar editor={editor} />
          <div className="min-h-[400px] max-h-[800px] overflow-y-auto p-4">
            <EditorContent editor={editor} />
          </div>
          <EditorStats editor={editor} />
        </div>

        {/* --- START: NEW DEBUG BUTTON --- */}
        <button
          onClick={logContent}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Log Editor HTML to Console
        </button>
        {/* --- END: NEW DEBUG BUTTON --- */}
      </div>
    </>
  );
}
