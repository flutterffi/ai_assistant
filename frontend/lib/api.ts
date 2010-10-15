/**
 * 前端只持有后端网关地址，绝不接触模型 API Key。
 * 所有模型调用通过后端中转。
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const CHAT_API = `${API_BASE_URL}/api/chat`;
export const PROVIDERS_API = `${API_BASE_URL}/api/providers/detail`;
export const HEALTH_API = `${API_BASE_URL}/health`;

// 会话管理
export const CONVERSATIONS_API = `${API_BASE_URL}/api/conversations`;
export const conversationApi = (id: string) => `${CONVERSATIONS_API}/${id}`;
export const conversationMessagesApi = (id: string) =>
  `${CONVERSATIONS_API}/${id}/messages`;
export const SEARCH_API = `${API_BASE_URL}/api/search`;
export const UPLOAD_API = `${API_BASE_URL}/api/upload`;

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  system_prompt: string;
  is_temporary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}
