"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CONVERSATIONS_API,
  conversationApi,
  type Conversation,
} from "@/lib/api";

/**
 * 会话列表管理 hook：拉取、新建、重命名、删除。
 */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(CONVERSATIONS_API);
      if (res.ok) setConversations(await res.json());
    } catch (e) {
      console.error("fetch conversations failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createConversation = useCallback(
    async (data: Partial<Conversation> = {}): Promise<Conversation | null> => {
      try {
        const res = await fetch(CONVERSATIONS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title ?? "新对话",
            provider: data.provider ?? "kimi",
            system_prompt: data.system_prompt ?? "",
            is_temporary: data.is_temporary ?? false,
          }),
        });
        if (!res.ok) return null;
        const conv: Conversation = await res.json();
        setConversations((prev) => [conv, ...prev]);
        return conv;
      } catch (e) {
        console.error("create conversation failed:", e);
        return null;
      }
    },
    [],
  );

  const renameConversation = useCallback(
    async (id: string, title: string) => {
      try {
        const res = await fetch(conversationApi(id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (res.ok) {
          setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, title } : c)),
          );
        }
      } catch (e) {
        console.error("rename failed:", e);
      }
    },
    [],
  );

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await fetch(conversationApi(id), { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error("delete failed:", e);
    }
  }, []);

  return { conversations, loading, refresh, createConversation, renameConversation, deleteConversation };
}
