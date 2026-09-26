import React from "react";
import { toArray } from "@/lib/kbcOptions";
import { Check } from "lucide-react";

// Kelompok checkbox multi-pilih. value = array of string.
export default function CheckList({ options = [], value, onChange, testid }) {
  const selected = toArray(value);
  const toggle = (opt) => {
    const set = new Set(selected);
    if (set.has(opt)) set.delete(opt);
    else set.add(opt);
    // pertahankan urutan sesuai daftar opsi
    onChange(options.filter((o) => set.has(o)));
  };
  return (
    <div
      data-testid={testid}
      className="grid sm:grid-cols-2 gap-x-4 gap-y-2 bg-slate-50 border border-slate-200 rounded-lg p-3"
    >
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            data-testid={testid ? `${testid}-opt-${opt}` : undefined}
            onClick={() => toggle(opt)}
            className={`flex items-center gap-2.5 text-left text-sm px-2.5 py-2 rounded-lg border transition-colors ${
              on
                ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-medium"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span
              className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center ${
                on ? "bg-emerald-700 border-emerald-700 text-white" : "border-slate-300 bg-white"
              }`}
            >
              {on && <Check className="w-3.5 h-3.5" />}
            </span>
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}
