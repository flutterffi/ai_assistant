"use client";

interface Settings {
  temperature: number;
  maxTokens: number | null;
  systemPrompt: string;
  isTemporary: boolean;
}

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onClear: () => void;
}

export default function SettingsPanel({ settings, onChange, onClear }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">生成参数</h3>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Temperature</span>
          <span className="font-mono">{settings.temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={settings.temperature}
          onChange={(e) => onChange({ ...settings, temperature: parseFloat(e.target.value) })}
          className="w-full accent-brand-600"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
          Max Tokens（0 = 不限制）
        </label>
        <input
          type="number"
          min={0}
          value={settings.maxTokens ?? 0}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onChange({ ...settings, maxTokens: v > 0 ? v : null });
          }}
          className="input-base w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
          系统提示词（System Prompt）
        </label>
        <textarea
          value={settings.systemPrompt}
          onChange={(e) => onChange({ ...settings, systemPrompt: e.target.value })}
          rows={3}
          placeholder="你是一个乐于助人的 AI 助手…"
          className="input-base w-full resize-none"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={settings.isTemporary}
          onChange={(e) => onChange({ ...settings, isTemporary: e.target.checked })}
          className="h-4 w-4 accent-brand-600"
        />
        临时对话（不保存历史）
      </label>

      <button
        onClick={onClear}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        清空当前对话
      </button>
    </div>
  );
}
