"use client";

import { useState } from "react";

/**
 * Phase 1 占位组件：后续阶段将接入 Vercel AI SDK useChat 实现完整对话。
 */
export default function ChatInterface() {
  const [input, setInput] = useState("");

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">AI Assistant</h1>
        <p className="text-sm text-slate-500">安全网关架构 · 密钥不出后端</p>
      </header>

      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-slate-400">对话区域（开发中…）</p>
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <input
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-brand-500 focus:outline-none"
          placeholder="输入消息…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700"
        >
          发送
        </button>
      </form>
    </div>
  );
}
