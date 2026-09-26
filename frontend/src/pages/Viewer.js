import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { RPP_SECTIONS, TYPE_LABEL } from "@/lib/docTypes";
import { ArrowLeft, Printer, Pencil, Loader2, Download, FileDown, Copy } from "lucide-react";
import { toast } from "sonner";

export default function Viewer() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/documents/${id}`)
      .then((r) => setDoc(r.data))
      .catch(() => toast.error("Gagal memuat dokumen"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (doc && params.get("print") === "1") {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [doc]);

  if (loading) return <div className="p-10 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  if (!doc) return <div className="p-10 text-center text-slate-500">Dokumen tidak ditemukan.</div>;

  const editLink = doc.type === "rpp" ? `/rpp/${doc.id}` : `/generate/${doc.type}/${doc.id}`;

  const downloadDocx = async () => {
    try {
      toast.message("Menyiapkan file Word...");
      const res = await api.get(`/documents/${doc.id}/docx`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(doc.title || "dokumen").replace(/[^a-z0-9]+/gi, "_")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Gagal mengunduh Word"); }
  };

  const duplicate = async () => {
    try {
      const { data } = await api.post(`/documents/${doc.id}/duplicate`);
      toast.success("Dokumen diduplikat");
      navigate(data.type === "rpp" ? `/rpp/${data.id}` : `/generate/${data.type}/${data.id}`);
    } catch { toast.error("Gagal menduplikat"); }
  };

  return (
    <div className="a4-desk min-h-screen">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-emerald-800">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="hidden sm:inline text-xs uppercase font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-800">
            {TYPE_LABEL[doc.type] || doc.type}
          </span>
          <button data-testid="btn-duplicate-doc" onClick={duplicate}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">
            <Copy className="w-4 h-4" /> Duplikat
          </button>
          <button data-testid="btn-docx-doc" onClick={downloadDocx}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50">
            <FileDown className="w-4 h-4" /> Word
          </button>
          <Link to={editLink} data-testid="btn-edit-doc"
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100">
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <button data-testid="btn-print-doc" onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold">
            <Printer className="w-4 h-4" /> Cetak / PDF
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-8 flex justify-center">
        <div className="print-area">
          <div className="a4-sheet">
            <KopSekolah doc={doc} />
            {doc.type === "rpp" ? <RppView doc={doc} /> : (
              <div className="doc-content" dangerouslySetInnerHTML={{ __html: doc.content_html || "" }} />
            )}
            <Signature doc={doc} />
          </div>
        </div>
      </div>

      <div className="no-print text-center text-sm text-slate-400 pb-8 px-4">
        <Download className="w-4 h-4 inline mr-1" />
        Tips: klik "Cetak / PDF" lalu pilih "Simpan sebagai PDF" atau printer. Ukuran kertas otomatis A4.
      </div>
    </div>
  );
}

function KopSekolah({ doc }) {
  const f = doc.fields || {};
  const m = doc.meta || {};
  const sekolah = f.namaSekolah || m.namaSekolah || "";
  const alamat = f.alamatSekolah || m.alamatSekolah || "";
  const logo = f.logoMadrasah || m.logoMadrasah || "";
  const title =
    doc.type === "rpp"
      ? "RENCANA PELAKSANAAN PEMBELAJARAN (RPP)"
      : (TYPE_LABEL[doc.type] || "DOKUMEN").toUpperCase();
  return (
    <div className="border-b-2 border-black pb-3 mb-4">
      <div className="flex items-center justify-center gap-3">
        {logo && <img src={logo} alt="Logo Madrasah" style={{ height: "64px", width: "auto" }} />}
        <div className="text-center">
          {sekolah && <div className="text-lg font-bold uppercase">{sekolah}</div>}
          {alamat && <div className="text-xs mt-0.5">{alamat}</div>}
        </div>
      </div>
      <div className="text-center text-base font-bold uppercase mt-2">{title}</div>
      {doc.type !== "rpp" && (
        <div className="text-center text-sm mt-1">
          {[m.mataPelajaran, m.kelas && `Kelas ${m.kelas}`, m.semester, m.tahunAjaran].filter(Boolean).join(" · ")}
        </div>
      )}
    </div>
  );
}

function RppView({ doc }) {
  const f = doc.fields || {};
  const identitas = [
    ["Nama Guru", f.namaGuru], ["NIP", f.nip], ["Jabatan", f.jabatan],
    ["Satuan Pendidikan", f.namaSekolah], ["Mata Pelajaran", f.mataPelajaran],
    ["Kelas / Fase", [f.kelas, f.fase].filter(Boolean).join(" / ")],
    ["Semester", f.semester], ["Materi Pokok", f.materiPokok],
    ["Alokasi Waktu", f.alokasiWaktu], ["Tahun Ajaran", f.tahunAjaran],
  ].filter(([, v]) => v);

  return (
    <div className="doc-content">
      <table style={{ marginBottom: "12px" }}>
        <tbody>
          {identitas.map(([k, v]) => (
            <tr key={k}>
              <td style={{ width: "35%", fontWeight: 700 }}>{k}</td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {RPP_SECTIONS.map((s, i) => {
        const raw = f[s.key];
        const val = Array.isArray(raw) ? raw.filter(Boolean).join(", ") : raw;
        if (!val || !String(val).trim()) return null;
        return (
          <div key={s.key} style={{ marginBottom: "10px" }}>
            <h3>{String.fromCharCode(65 + (i % 26))}. {s.label}</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{val}</p>
          </div>
        );
      })}
    </div>
  );
}

function Signature({ doc }) {
  const f = doc.fields || {};
  const kepala = f.namaKepalaSekolah;
  const guru = f.namaGuru;
  const nipGuru = f.nip;
  const nipKepala = f.nipKepalaSekolah;
  if (!kepala && !guru) return null;
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  return (
    <table style={{ marginTop: "28px", border: "none" }} className="signature">
      <tbody>
        <tr style={{ border: "none" }}>
          <td style={{ border: "none", textAlign: "center", width: "50%" }}>
            Mengetahui,<br />Kepala Sekolah<br /><br /><br /><br />
            <strong style={{ textDecoration: "underline" }}>{kepala || "..............................."}</strong><br />
            {nipKepala ? `NIP. ${nipKepala}` : "NIP. ..............................."}
          </td>
          <td style={{ border: "none", textAlign: "center", width: "50%" }}>
            {today}<br />Guru Mata Pelajaran<br /><br /><br /><br />
            <strong style={{ textDecoration: "underline" }}>{guru || "..............................."}</strong><br />
            {nipGuru ? `NIP. ${nipGuru}` : "NIP. ..............................."}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
