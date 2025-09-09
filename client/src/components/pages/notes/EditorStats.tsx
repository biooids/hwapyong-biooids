"use client";

import { type Editor } from "@tiptap/react";
import React, { useState, useEffect } from "react";

type EditorStatsProps = {
  editor: Editor | null;
};

export function EditorStats({ editor }: EditorStatsProps) {
  const [stats, setStats] = useState({ characters: 0, words: 0 });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const updateStats = () => {
      const { characters, words } = editor.storage.characterCount;
      setStats({ characters: characters(), words: words() });
    };

    // Update stats on initial load and on every editor update
    updateStats();
    editor.on("update", updateStats);

    // Cleanup listener on component unmount
    return () => {
      editor.off("update", updateStats);
    };
  }, [editor]);

  if (!editor || stats.characters === 0) {
    return null; // Don't render anything if there's no editor or no content
  }

  return (
    <div className="flex items-center justify-end gap-4 border-t px-4 py-2 text-sm text-muted-foreground">
      <span>{stats.characters} characters</span>
      <span>{stats.words} words</span>
    </div>
  );
}
