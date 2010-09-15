"use client";

import { useTheme } from "@/lib/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="btn-ghost flex h-9 w-9 items-center justify-center p-0"
      title={theme === "light" ? "切换暗色" : "切换亮色"}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
