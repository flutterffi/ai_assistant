/**
 * 前端只持有后端网关地址，绝不接触模型 API Key。
 * 所有模型调用通过后端中转。
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const CHAT_API = `${API_BASE_URL}/api/chat`;
export const PROVIDERS_API = `${API_BASE_URL}/api/providers`;
export const HEALTH_API = `${API_BASE_URL}/health`;
