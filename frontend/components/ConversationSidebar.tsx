"use client";

import { useState } from "react";
import type { Conversation } from "@/lib/api";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (c: Conversation) => void;
  onCreate: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startRename = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const commitRename = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="p-3">
        <button
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <span className="text-lg leading-none">+</span> 新建对话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-slate-400">暂无对话</p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((c) => (
              <li key={c.id}>
                {editingId === c.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full rounded-md border border-brand-400 px-3 py-2 text-sm focus:outline-none"
                  />
                ) : (
                  <div
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      activeId === c.id
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <button
                      onClick={() => onSelect(c)}
                      className="flex-1 truncate text-left"
                      title={c.title}
                    >
                      {c.is_temporary && <span className="mr-1 text-xs">🕒</span>}
                      {c.title}
                    </button>
                    <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => startRename(c)}
                        className="rounded px-1 text-xs text-slate-400 hover:text-slate-600"
                        title="重命名"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => onDelete(c.id)}
                        className="rounded px-1 text-xs text-slate-400 hover:text-red-500"
                        title="删除"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
