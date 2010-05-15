"use client";

interface Settings {
  temperature: number;
  maxTokens: number | null;
}

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  onClear: () => void;
}

export default function SettingsPanel({ settings, onChange, onClear }: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">生成参数</h3>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Temperature</span>
          <span className="font-mono">{settings.temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={settings.temperature}
          onChange={(e) =>
            onChange({ ...settings, temperature: parseFloat(e.target.value) })
          }
          className="w-full accent-brand-600"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-500">Max Tokens（0 = 不限制）</label>
        <input
          type="number"
          min={0}
          value={settings.maxTokens ?? 0}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            onChange({ ...settings, maxTokens: v > 0 ? v : null });
          }}
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      <button
        onClick={onClear}
        className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
      >
        清空当前对话
      </button>
    </div>
  );
}
