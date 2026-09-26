import React, { useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Save, Loader2, User } from "lucide-react";
import { toast } from "sonner";

const FIELDS = [
  { key: "name", label: "Nama Lengkap" },
  { key: "nip", label: "NIP" },
  { key: "jabatan", label: "Jabatan" },
  { key: "namaSekolah", label: "Nama Sekolah / Satuan Pendidikan" },
  { key: "alamatSekolah", label: "Alamat Sekolah (untuk Kop)" },
  { key: "namaKepalaSekolah", label: "Nama Kepala Sekolah" },
  { key: "nipKepalaSekolah", label: "NIP Kepala Sekolah" },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(() => {
    const f = {};
    FIELDS.forEach((x) => (f[x.key] = user?.[x.key] || ""));
    return f;
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", form);
      updateUser(data);
      toast.success("Profil tersimpan. Identitas ini otomatis mengisi dokumen baru.");
    } catch (err) {
      toast.error(apiErr(err.response?.data?.detail) || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-800 mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </Link>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
        <User className="w-6 h-6 text-emerald-800" /> Profil Guru
      </h1>
      <p className="text-slate-500 mt-1 mb-6">Data ini dipakai untuk mengisi identitas & tanda tangan pada dokumen.</p>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Email</label>
          <input value={user?.email || ""} disabled className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 text-sm" />
        </div>
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">{f.label}</label>
            <input
              data-testid={`profile-input-${f.key}`}
              value={form[f.key]} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm"
            />
          </div>
        ))}
        <button
          data-testid="btn-save-profile" onClick={save} disabled={saving}
          className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Profil
        </button>
      </div>
    </div>
  );
}
