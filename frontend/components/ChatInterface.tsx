"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import MessageBubble from "./MessageBubble";
import ProviderSelector, { type ProviderOption } from "./ProviderSelector";
import SettingsPanel from "./SettingsPanel";
import ConversationSidebar from "./ConversationSidebar";
import { useConversations } from "@/lib/useConversations";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  CHAT_API,
  PROVIDERS_API,
  conversationApi,
  type Conversation,
  type ConversationMessage,
} from "@/lib/api";

interface ChatSettings {
  temperature: number;
  maxTokens: number | null;
}

export default function ChatInterface() {
  const { conversations, createConversation, renameConversation, deleteConversation } =
    useConversations();
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [provider, setProvider] = useState<string>("kimi");
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useLocalStorage<ChatSettings>(
    "ai_assistant_settings",
    { temperature: 0.7, maxTokens: null },
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } =
    useChat({
      api: CHAT_API,
      body: {
        provider,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        conversation_id: activeConv?.id ?? null,
      },
      onFinish: () => {
        // 首条用户消息自动生成会话标题
        if (activeConv) {
          const firstUser = messages.find((m) => m.role === "user");
          if (firstUser && activeConv.title === "新对话") {
            renameConversation(activeConv.id, firstUser.content.slice(0, 30));
          }
        }
      },
    });

  // 拉取供应商列表
  useEffect(() => {
    fetch(PROVIDERS_API)
      .then((r) => r.json())
      .then((data) => {
        const list: ProviderOption[] = data.providers ?? [];
        setProviders(list);
        const firstReady = list.find((p) => p.configured);
        if (firstReady) setProvider(firstReady.name);
      })
      .catch((e) => console.error("fetch providers failed:", e));
  }, []);

  // 自动滚动
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // 切换会话时加载历史消息
  const loadConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setProvider(conv.provider);
    try {
      const res = await fetch(conversationApi(conv.id));
      if (res.ok) {
        const data = await res.json();
        const msgs: ConversationMessage[] = data.messages ?? [];
        setMessages(
          msgs.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        );
      }
    } catch (e) {
      console.error("load conversation failed:", e);
    }
  };

  const handleCreate = async () => {
    const conv = await createConversation({ provider, system_prompt: "" });
    if (conv) {
      setActiveConv(conv);
      setMessages([]);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
    if (activeConv?.id === id) {
      setActiveConv(null);
      setMessages([]);
    }
  };

  const handleClear = () => {
    setMessages([]);
    if (activeConv) {
      setActiveConv(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConv?.id ?? null}
        onSelect={loadConversation}
        onCreate={handleCreate}
        onRename={renameConversation}
        onDelete={handleDelete}
      />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              {activeConv?.title ?? "AI Assistant"}
            </h1>
            <p className="text-xs text-slate-500">安全网关架构 · 密钥不出后端</p>
          </div>
          <div className="flex items-center gap-3">
            <ProviderSelector
              providers={providers}
              value={provider}
              onChange={setProvider}
            />
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              ⚙ 设置
            </button>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto p-6"
        >
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-slate-400">开始一段对话吧，输入消息后按 Enter 发送。</p>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              请求失败：{error.message}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-4">
          <div className="mx-auto flex max-w-3xl gap-2">
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
          </div>
        </form>
      </div>

      {showSettings && (
        <aside className="w-64 shrink-0 border-l border-slate-200 bg-white p-4">
          <SettingsPanel settings={settings} onChange={setSettings} onClear={handleClear} />
        </aside>
      )}
    </div>
  );
}
