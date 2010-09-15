"use client";

import type { Message } from "ai/react";

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex animate-fade-in gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
          isUser
            ? "bg-brand-600 text-white"
            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
        }`}
      >
        {isUser ? "我" : "AI"}
      </div>
      <div
        className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-brand-600 text-white"
            : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
        }`}
      >
        {message.content || (
          <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-slate-300 dark:bg-slate-600" />
        )}
      </div>
    </div>
  );
}
