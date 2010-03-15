"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import MessageBubble from "./MessageBubble";
import ProviderSelector, { type ProviderOption } from "./ProviderSelector";
import { CHAT_API, PROVIDERS_API } from "@/lib/api";

export default function ChatInterface() {
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [provider, setProvider] = useState<string>("kimi");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: CHAT_API,
      body: { provider },
      onError: (err) => {
        console.error("chat error:", err);
      },
    });

  // 拉取供应商列表
  useEffect(() => {
    fetch(PROVIDERS_API)
      .then((r) => r.json())
      .then((data) => {
        const list: ProviderOption[] = data.providers ?? [];
        setProviders(list);
        // 默认选中第一个已配置的供应商
        const firstReady = list.find((p) => p.configured);
        if (firstReady) setProvider(firstReady.name);
      })
      .catch((e) => console.error("fetch providers failed:", e));
  }, []);

  // 切换供应商时清空当前对话
  const handleProviderChange = (name: string) => {
    setProvider(name);
  };

  // 自动滚动到底部
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Assistant</h1>
          <p className="text-sm text-slate-500">安全网关架构 · 密钥不出后端</p>
        </div>
        <ProviderSelector
          providers={providers}
          value={provider}
          onChange={handleProviderChange}
        />
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-inner"
      >
        {messages.length === 0 ? (
          <p className="py-10 text-center text-slate-400">
            开始一段对话吧，输入消息后按 Enter 发送。
          </p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            请求失败：{error.message}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none"
          placeholder="输入消息…（Shift+Enter 换行）"
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "生成中…" : "发送"}
        </button>
      </form>
    </div>
  );
}
