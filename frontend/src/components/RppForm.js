import React from "react";
import { RPP_IDENTITAS, RPP_SECTIONS } from "@/lib/docTypes";
import { useOptions } from "@/lib/useOptions";
import { ComboInput, SavedPicker } from "@/components/ComboInput";
import CheckList from "@/components/CheckList";
import { CHECKLIST_OPTIONS } from "@/lib/kbcOptions";

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm";

export default function RppForm({ fields, setField }) {
  const options = useOptions();

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-base font-bold text-slate-900 mb-4">Identitas</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {RPP_IDENTITAS.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">{f.label}</label>
              {f.option ? (
                <ComboInput
                  id={f.key}
                  testid={`rpp-input-${f.key}`}
                  value={fields[f.key] || ""}
                  onChange={(v) => setField(f.key, v)}
                  options={options[f.option] || []}
                />
              ) : (
                <input
                  data-testid={`rpp-input-${f.key}`}
                  value={fields[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className={inputCls}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-base font-bold text-slate-900 mb-4">Komponen Pembelajaran</h3>
        <div className="space-y-4">
          {RPP_SECTIONS.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">{f.label}</label>
              {f.checklist ? (
                <CheckList
                  testid={`rpp-check-${f.key}`}
                  options={CHECKLIST_OPTIONS[f.checklist] || []}
                  value={fields[f.key]}
                  onChange={(arr) => setField(f.key, arr)}
                />
              ) : (
                <>
                  {f.option && (options[f.option] || []).length > 0 && (
                    <SavedPicker
                      testid={`rpp-picker-${f.key}`}
                      options={options[f.option] || []}
                      onPick={(v) => setField(f.key, v)}
                    />
                  )}
                  <textarea
                    data-testid={`rpp-input-${f.key}`}
                    value={fields[f.key] || ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    rows={f.key === "kegiatanInti" ? 6 : 3}
                    className={`${inputCls} leading-relaxed resize-y`}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
