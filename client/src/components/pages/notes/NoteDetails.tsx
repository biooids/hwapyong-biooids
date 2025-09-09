// components/NoteDetails.tsx
"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Toolbar } from "./Toolbar"; // <-- Importing our separate toolbar

// Your original component, now transformed!
export default function NoteDetails() {
  const [content, setContent] = useState(
    "<h1>Your Note Title</h1><p>Start writing your details here...</p>"
  );

  const editor = useEditor({
    extensions: [StarterKit.configure({})],
    content: content,
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base rounded-md border min-h-[400px] border-input bg-background p-4 ring-offset-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      },
    },
    onUpdate({ editor }) {
      // Every time you type, update the React state
      setContent(editor.getHTML());
    },
  });

  return (
    <div className="flex w-full max-w-4xl flex-col justify-stretch gap-2">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
