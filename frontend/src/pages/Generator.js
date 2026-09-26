import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api, { apiErr } from "@/lib/api";
import { GENERATORS, TYPE_LABEL } from "@/lib/docTypes";
import { useOptions } from "@/lib/useOptions";
import { ComboInput, SavedPicker } from "@/components/ComboInput";
import { ArrowLeft, Sparkles, Save, Loader2, Wand2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const INPUT_FIELDS = [
  { key: "mataPelajaran", label: "Mata Pelajaran", ph: "Bahasa Indonesia", option: "mataPelajaran" },
  { key: "kelas", label: "Kelas", ph: "3", option: "kelas" },
  { key: "fase", label: "Fase", ph: "Fase B", option: "fase" },
  { key: "semester", label: "Semester", ph: "Ganjil", option: "semester" },
  { key: "tahunAjaran", label: "Tahun Ajaran", ph: "2026/2027" },
  { key: "alokasiWaktu", label: "Alokasi Waktu", ph: "18 JP" },
];

export default function Generator() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const editRef = useRef();

  const cfg = GENERATORS.find((g) => g.key === type);
  const isEdit = !!id;
  const options = useOptions();

  const [inputs, setInputs] = useState({});
  const [html, setHtml] = useState("");
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/documents/${id}`)
        .then((r) => {
          setHtml(r.data.content_html || "");
          setInputs(r.data.meta || {});
          setMeta(r.data.meta || {});
          setHasContent(true);
        })
        .catch(() => toast.error("Gagal memuat"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (hasContent && editRef.current && editRef.current.innerHTML !== html) {
      editRef.current.innerHTML = html;
    }
  }, [hasContent, html]);

  const setInput = (k, v) => setInputs((s) => ({ ...s, [k]: v }));

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post("/ai/generate", { type, inputs });
      setHtml(data.content_html);
      setMeta(inputs);
      setHasContent(true);
      toast.success("Dokumen berhasil dibuat! Edit sesuai kebutuhan lalu simpan.");
    } catch (err) {
      toast.error(apiErr(err.response?.data?.detail) || "Gagal membuat dokumen");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const current = editRef.current ? editRef.current.innerHTML : html;
    const title = `${TYPE_LABEL[type]} - ${inputs.mataPelajaran || meta.mataPelajaran || "Tanpa Judul"}${(inputs.kelas || meta.kelas) ? ` Kelas ${inputs.kelas || meta.kelas}` : ""}`;
    const payload = { type, title, meta: inputs, fields: {}, content_html: current };
    try {
      let res;
      if (isEdit) res = await api.put(`/documents/${id}`, payload);
      else res = await api.post("/documents", payload);
      toast.success("Dokumen tersimpan");
      navigate(`/view/${res.data.id}`);
    } catch (err) {
      toast.error(apiErr(err.response?.data?.detail) || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  if (!cfg) return <div className="p-10 text-center text-slate-500">Jenis dokumen tidak dikenal.</div>;
  if (loading) return <div className="p-10 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-800 mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </Link>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
        {isEdit ? "Edit " : "Buat "}{cfg.label} <Sparkles className="w-5 h-5 text-amber-500" />
      </h1>
      <p className="text-slate-500 mt-1 mb-6">{cfg.desc}</p>

      {!hasContent && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-base font-bold text-slate-900 mb-4">Data Acuan</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {INPUT_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">{f.label}</label>
                {f.option ? (
                  <ComboInput
                    id={f.key}
                    testid={`gen-input-${f.key}`}
                    value={inputs[f.key] || ""}
                    onChange={(v) => setInput(f.key, v)}
                    options={options[f.option] || []}
                    placeholder={f.ph}
                  />
                ) : (
                  <input
                    data-testid={`gen-input-${f.key}`}
                    value={inputs[f.key] || ""} onChange={(e) => setInput(f.key, e.target.value)} placeholder={f.ph}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Capaian Pembelajaran (CP)</label>
            <SavedPicker testid="gen-picker-cp" options={options.capaianPembelajaran || []} onPick={(v) => setInput("capaianPembelajaran", v)} />
            <textarea data-testid="gen-input-cp" value={inputs.capaianPembelajaran || ""} onChange={(e) => setInput("capaianPembelajaran", e.target.value)} rows={3}
              placeholder="Tempel Capaian Pembelajaran sesuai mapel & fase..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm resize-y" />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Materi / Lingkup Materi</label>
            <SavedPicker testid="gen-picker-materi" options={options.materi || []} onPick={(v) => setInput("materi", v)} />
            <textarea data-testid="gen-input-materi" value={inputs.materi || ""} onChange={(e) => setInput("materi", e.target.value)} rows={2}
              placeholder="Contoh: Panca indra dan fungsinya..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm resize-y" />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Alur Tujuan Pembelajaran / Catatan (opsional)</label>
            <SavedPicker testid="gen-picker-atp" options={options.alurTujuanPembelajaran || []} onPick={(v) => setInput("alurTujuanPembelajaran", v)} />
            <textarea data-testid="gen-input-atp" value={inputs.alurTujuanPembelajaran || ""} onChange={(e) => setInput("alurTujuanPembelajaran", e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm resize-y" />
          </div>

          <button
            data-testid="btn-generate" onClick={generate} disabled={generating}
            className="mt-5 w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-colors disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {generating ? "Sedang membuat..." : `Buat ${cfg.label} dengan AI`}
          </button>
        </div>
      )}

      {hasContent && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-emerald-800">
              <Sparkles className="w-4 h-4" /> Klik teks untuk mengedit langsung, lalu simpan.
            </div>
            {!isEdit && (
              <button data-testid="btn-regenerate" onClick={() => { setHasContent(false); setHtml(""); }}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-800">
                <RotateCcw className="w-4 h-4" /> Ubah input
              </button>
            )}
          </div>
          <div className="a4-desk rounded-xl p-4 sm:p-8 overflow-x-auto">
            <div className="a4-sheet">
              <div
                ref={editRef}
                data-testid="editable-content"
                className="doc-content"
                contentEditable
                suppressContentEditableWarning
              />
            </div>
          </div>
          <div className="sticky bottom-4 mt-6 flex justify-end gap-3">
            <button
              data-testid="btn-save-doc" onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Simpan Dokumen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
