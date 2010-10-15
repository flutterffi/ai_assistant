"use client";

import { useState } from "react";
import type { Conversation, ConversationMessage } from "@/lib/api";
import { SEARCH_API } from "@/lib/api";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (c: Conversation) => void;
  onCreate: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onJumpToMessage: (conversationId: string) => void;
}

interface SearchResult {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onJumpToMessage,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const startRename = (c: Conversation) => {
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const commitRename = () => {
    if (editingId && editTitle.trim()) onRename(editingId, editTitle.trim());
    setEditingId(null);
  };

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`${SEARCH_API}?keyword=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults((data.results ?? []) as SearchResult[]);
      }
    } catch (e) {
      console.error("search failed:", e);
    } finally {
      setSearching(false);
    }
  };

  const isSearching = search.trim().length > 0;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="p-3">
        <button onClick={onCreate} className="btn-primary w-full">
          + 新建对话
        </button>
      </div>

      <div className="px-3 pb-2">
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="搜索消息…"
          className="input-base w-full py-1.5 text-xs"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isSearching ? (
          <div className="space-y-1">
            {searching && (
              <p className="px-3 py-2 text-xs text-slate-400">搜索中…</p>
            )}
            {!searching && results.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-slate-400">无匹配结果</p>
            )}
            {results.map((r) => {
              const conv = conversations.find((c) => c.id === r.conversation_id);
              return (
                <button
                  key={r.id}
                  onClick={() => onJumpToMessage(r.conversation_id)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="font-medium text-slate-700 dark:text-slate-200">
                    {conv?.title ?? "未知对话"}
                  </div>
                  <div className="truncate text-slate-400">{r.content}</div>
                </button>
              );
            })}
          </div>
        ) : conversations.length === 0 ? (
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
                    className="input-base w-full"
                  />
                ) : (
                  <div
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                      activeId === c.id
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
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
                        className="rounded px-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
