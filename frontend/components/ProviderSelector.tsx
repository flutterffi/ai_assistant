"use client";

export interface ProviderOption {
  name: string;
  default_model: string;
  configured: boolean;
}

interface Props {
  providers: ProviderOption[];
  value: string;
  onChange: (name: string) => void;
}

export default function ProviderSelector({ providers, value, onChange }: Props) {
  if (providers.length === 0) {
    return <span className="text-sm text-slate-400">未发现可用供应商</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-base h-9 cursor-pointer py-1.5"
      >
        {providers.map((p) => (
          <option key={p.name} value={p.name} disabled={!p.configured}>
            {p.name} · {p.default_model}
            {p.configured ? "" : "（未配置密钥）"}
          </option>
        ))}
      </select>
    </div>
  );
}
