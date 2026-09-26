import React from "react";
import { Database } from "lucide-react";

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm";

// Input with type-ahead suggestions (native datalist). Allows free typing too.
export function ComboInput({ id, value, onChange, options = [], placeholder, testid }) {
  const listId = `dl-${id}`;
  return (
    <>
      <input
        list={listId}
        data-testid={testid}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((o, i) => (
          <option key={i} value={o} />
        ))}
      </datalist>
    </>
  );
}

// Dropdown that inserts a previously-saved long value into a textarea.
export function SavedPicker({ options = [], onPick, testid }) {
  if (!options || options.length === 0) return null;
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <Database className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
      <select
        data-testid={testid}
        onChange={(e) => {
          if (e.target.value) {
            onPick(e.target.value);
            e.target.value = "";
          }
        }}
        className="text-xs px-2 py-1.5 rounded-md border border-slate-300 bg-emerald-50/50 text-slate-700 outline-none focus:border-emerald-700 max-w-full"
      >
        <option value="">Ambil dari data tersimpan…</option>
        {options.map((o, i) => (
          <option key={i} value={o}>
            {o.length > 90 ? o.slice(0, 90) + "…" : o}
          </option>
        ))}
      </select>
    </div>
  );
}
