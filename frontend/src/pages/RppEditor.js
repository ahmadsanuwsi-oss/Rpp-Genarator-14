import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import api, { apiErr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { emptyRppFields } from "@/lib/docTypes";
import RppForm from "@/components/RppForm";
import { ArrowLeft, Upload, Save, Loader2, Sparkles, FileText, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function RppEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef();

  const isEdit = !!id;
  const [tab, setTab] = useState(params.get("mode") === "upload" ? "upload" : "manual");
  const [fields, setFields] = useState(emptyRppFields());
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [extracted, setExtracted] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/documents/${id}`)
        .then((r) => { setFields({ ...emptyRppFields(), ...(r.data.fields || {}) }); setTab("manual"); })
        .catch(() => toast.error("Gagal memuat dokumen"))
        .finally(() => setLoading(false));
    } else {
      // prefill identitas guru
      setFields((f) => ({
        ...f,
        namaGuru: user?.name || "",
        nip: user?.nip || "",
        jabatan: user?.jabatan || "",
        namaSekolah: user?.namaSekolah || "",
        alamatSekolah: user?.alamatSekolah || "",
        namaKepalaSekolah: user?.namaKepalaSekolah || "",
        nipKepalaSekolah: user?.nipKepalaSekolah || "",
        logoMadrasah: user?.logoMadrasah || "",
      }));
    }
  }, [id]);

  const setField = (k, v) => setFields((f) => ({ ...f, [k]: v }));

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setExtracting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/ai/extract-rpp", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setFields({ ...emptyRppFields(), ...data.fields });
      setExtracted(true);
      setTab("manual");
      toast.success("Berhasil diekstrak! Silakan periksa & edit sebelum menyimpan.");
    } catch (err) {
      toast.error(apiErr(err.response?.data?.detail) || "Gagal membaca file");
    } finally {
      setExtracting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const title = `RPP - ${fields.mataPelajaran || "Tanpa Judul"}${fields.kelas ? ` Kelas ${fields.kelas}` : ""}`;
    const payload = {
      type: "rpp",
      title,
      meta: {
        mataPelajaran: fields.mataPelajaran, kelas: fields.kelas,
        semester: fields.semester, tahunAjaran: fields.tahunAjaran,
      },
      fields,
      content_html: null,
    };
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

  if (loading) {
    return <div className="p-10 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-800 mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </Link>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        {isEdit ? "Edit RPP" : "Buat RPP / Modul Ajar"}
      </h1>
      <p className="text-slate-500 mt-1 mb-6">Pilih metode: isi manual atau unggah file untuk diisi otomatis oleh AI.</p>

      {!isEdit && (
        <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 mb-6">
          <button
            data-testid="tab-manual" onClick={() => setTab("manual")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "manual" ? "bg-emerald-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Pencil className="w-4 h-4" /> Input Manual
          </button>
          <button
            data-testid="tab-upload" onClick={() => setTab("upload")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === "upload" ? "bg-emerald-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <Upload className="w-4 h-4" /> Unggah PDF / Gambar
          </button>
        </div>
      )}

      {tab === "upload" && !isEdit ? (
        <div>
          <div
            onClick={() => !extracting && fileRef.current?.click()}
            data-testid="upload-dropzone"
            className="cursor-pointer border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-2xl p-10 text-center hover:bg-amber-50 transition-colors"
          >
            {extracting ? (
              <div className="flex flex-col items-center gap-3 text-amber-700">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="font-semibold">AI sedang membaca {fileName}...</p>
                <p className="text-sm text-amber-600/80">Mohon tunggu, ini bisa memakan waktu beberapa detik.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-1">
                  <Upload className="w-7 h-7 text-amber-600" />
                </div>
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  Klik untuk pilih file <Sparkles className="w-4 h-4 text-amber-500" />
                </p>
                <p className="text-sm text-slate-500">Format: PDF, PNG, atau JPG. AI akan mengisi form RPP otomatis.</p>
                {fileName && !extracting && <p className="text-xs text-emerald-700 mt-1">Terakhir: {fileName}</p>}
              </div>
            )}
            <input
              ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden"
              data-testid="input-file-upload" onChange={onUpload}
            />
          </div>
          <p className="text-center text-sm text-slate-400 mt-4">
            Setelah diproses, isi RPP akan muncul di form untuk Anda periksa & edit.
          </p>
        </div>
      ) : (
        <div>
          {extracted && (
            <div className="mb-4 flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2">
              <Sparkles className="w-4 h-4" /> Terisi otomatis oleh AI. Periksa & sunting sebelum menyimpan.
            </div>
          )}
          <RppForm fields={fields} setField={setField} />
          <div className="sticky bottom-4 mt-6 flex justify-end gap-3">
            <button
              data-testid="btn-save-rpp" onClick={save} disabled={saving}
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
