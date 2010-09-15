"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import MessageBubble from "./MessageBubble";
import ProviderSelector, { type ProviderOption } from "./ProviderSelector";
import SettingsPanel from "./SettingsPanel";
import ConversationSidebar from "./ConversationSidebar";
import ThemeToggle from "./ThemeToggle";
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
  systemPrompt: string;
  isTemporary: boolean;
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
    { temperature: 0.7, maxTokens: null, systemPrompt: "", isTemporary: false },
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // 构建发送给后端的消息：若有系统提示词则作为首条 system 消息
  const buildMessages = (msgs: { role: string; content: string }[]) => {
    const list = [...msgs];
    if (settings.systemPrompt.trim()) {
      list.unshift({ role: "system", content: settings.systemPrompt.trim() });
    }
    return list;
  };

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } =
    useChat({
      api: CHAT_API,
      body: {
        provider,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        conversation_id: activeConv?.id ?? null,
      },
      // 发送前注入系统提示词
      experimental_prepareRequestBody: ({ messages: msgs, requestBody }) => {
        return {
          ...(requestBody as object),
          messages: buildMessages(msgs as { role: string; content: string }[]),
        };
      },
      onFinish: () => {
        if (activeConv) {
          const firstUser = messages.find((m) => m.role === "user");
          if (firstUser && activeConv.title === "新对话") {
            renameConversation(activeConv.id, firstUser.content.slice(0, 30));
          }
        }
      },
    });

  // 拉取供应商
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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
    const conv = await createConversation({
      provider,
      system_prompt: settings.systemPrompt,
      is_temporary: settings.isTemporary,
    });
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
    setActiveConv(null);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConv?.id ?? null}
        onSelect={loadConversation}
        onCreate={handleCreate}
        onRename={renameConversation}
        onDelete={handleDelete}
      />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {activeConv?.title ?? "AI Assistant"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              安全网关架构 · 密钥不出后端
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ProviderSelector providers={providers} value={provider} onChange={setProvider} />
            <ThemeToggle />
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="btn-ghost"
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
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
              <div className="text-4xl">💬</div>
              <p>开始一段对话吧，输入消息后按 Enter 发送。</p>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
              请求失败：{error.message}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mx-auto flex max-w-3xl gap-2">
            <input
              className="input-base flex-1"
              placeholder="输入消息…（Shift+Enter 换行）"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="btn-primary">
              {isLoading ? "生成中…" : "发送"}
            </button>
          </div>
        </form>
      </div>

      {showSettings && (
        <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <SettingsPanel settings={settings} onChange={setSettings} onClear={handleClear} />
        </aside>
      )}
    </div>
  );
}
