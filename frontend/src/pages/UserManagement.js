import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api, { apiErr } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, UserPlus, Loader2, Trash2, ShieldCheck, GraduationCap, FileText, Mail,
  Settings2, Save, ImagePlus, Building2, X,
} from "lucide-react";
import { toast } from "sonner";

const MADRASAH_FIELDS = [
  { key: "namaSekolah", label: "Nama Madrasah" },
  { key: "alamatSekolah", label: "Alamat Madrasah" },
  { key: "namaKepalaSekolah", label: "Nama Kepala Madrasah" },
  { key: "nipKepalaSekolah", label: "NIP Kepala Madrasah" },
];

// Kompres gambar menjadi data URL kecil (tinggi maks 200px)
function fileToCompressedDataUrl(file, maxH = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxH / img.height);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UserManagement() {
  const { user } = useAuth();
  const isSuper = user?.role === "superadmin";
  const roleLabel = isSuper ? "Admin" : "Guru";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // user id being configured

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch {
      toast.error("Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/users", form);
      toast.success(`Akun ${roleLabel} berhasil dibuat`);
      setForm({ name: "", email: "", password: "" });
      load();
    } catch (err) {
      toast.error(apiErr(err.response?.data?.detail) || "Gagal membuat akun");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(`Hapus akun ${roleLabel} ini?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("Akun dihapus");
      load();
    } catch (err) {
      toast.error(apiErr(err.response?.data?.detail) || "Gagal menghapus");
    }
  };

  const onSaved = (updated) => {
    setUsers((list) => list.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
    setEditing(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-800 mb-4">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </Link>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
        {isSuper ? <ShieldCheck className="w-6 h-6 text-emerald-800" /> : <GraduationCap className="w-6 h-6 text-emerald-800" />}
        Kelola {roleLabel}
      </h1>
      <p className="text-slate-500 mt-1 mb-6">
        {isSuper
          ? "Buat & kelola akun Admin madrasah. Atur identitas madrasah (nama, alamat, kepala, NIP, logo) untuk tiap Admin — data otomatis mengalir ke semua guru di bawahnya."
          : "Buat & kelola akun Guru. Dokumen mereka otomatis muncul di dashboard Anda."}
      </p>

      <div className="grid md:grid-cols-5 gap-6">
        <form onSubmit={create} className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 h-fit" data-testid="create-user-form">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4 text-emerald-800" /> Tambah {roleLabel}</h3>
          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Nama</label>
          <input data-testid="cu-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
            className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-700 outline-none text-sm" />
          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Email</label>
          <input data-testid="cu-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
            className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-700 outline-none text-sm" />
          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Kata Sandi</label>
          <input data-testid="cu-password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
            className="w-full mb-4 px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-700 outline-none text-sm" />
          <button data-testid="btn-create-user" type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Buat Akun
          </button>
        </form>

        <div className="md:col-span-3">
          <h3 className="font-bold text-slate-900 mb-3">Daftar {roleLabel} ({users.length})</h3>
          {loading ? (
            <div className="py-10 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">Belum ada akun {roleLabel}.</div>
          ) : (
            <div className="space-y-2" data-testid="users-list">
              {users.map((u) => (
                <div key={u.id} data-testid={`user-item-${u.id}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                      {u.logoMadrasah
                        ? <img src={u.logoMadrasah} alt="logo" className="w-full h-full object-contain bg-white" />
                        : (u.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 truncate">{u.name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</div>
                      {u.namaSekolah && (
                        <div className="text-xs text-emerald-700 flex items-center gap-1 mt-0.5 truncate">
                          <Building2 className="w-3 h-3" />{u.namaSekolah}
                        </div>
                      )}
                    </div>
                    {!isSuper && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
                        <FileText className="w-3.5 h-3.5" /> {u.doc_count} dok
                      </div>
                    )}
                    <button data-testid={`btn-settings-user-${u.id}`} onClick={() => setEditing(editing === u.id ? null : u.id)}
                      title="Pengaturan Madrasah"
                      className={`p-2 rounded-lg ${editing === u.id ? "bg-emerald-100 text-emerald-800" : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"}`}>
                      <Settings2 className="w-[18px] h-[18px]" />
                    </button>
                    <button data-testid={`btn-del-user-${u.id}`} onClick={() => remove(u.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                  {editing === u.id && (
                    <MadrasahSettings target={u} onSaved={onSaved} onClose={() => setEditing(null)} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MadrasahSettings({ target, onSaved, onClose }) {
  const fileRef = useRef();
  const [form, setForm] = useState(() => {
    const f = { logoMadrasah: target.logoMadrasah || "" };
    MADRASAH_FIELDS.forEach((x) => (f[x.key] = target[x.key] || ""));
    return f;
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 200);
      setForm((s) => ({ ...s, logoMadrasah: dataUrl }));
    } catch {
      toast.error("Gagal memuat logo");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/users/${target.id}`, form);
      toast.success("Pengaturan madrasah tersimpan & diterapkan ke guru terkait");
      onSaved(data);
    } catch (err) {
      toast.error(apiErr(err.response?.data?.detail) || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-slate-200 bg-slate-50 p-4" data-testid={`madrasah-settings-${target.id}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-800" /> Pengaturan Madrasah — {target.name}
        </h4>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className="w-20 h-20 rounded-lg border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
          {form.logoMadrasah
            ? <img src={form.logoMadrasah} alt="Logo" className="w-full h-full object-contain" />
            : <ImagePlus className="w-7 h-7 text-slate-300" />}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Logo Madrasah</label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" data-testid={`logo-upload-${target.id}`} onChange={onLogo} />
          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} Pilih Logo
            </button>
            {form.logoMadrasah && (
              <button type="button" onClick={() => setForm((s) => ({ ...s, logoMadrasah: "" }))}
                className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-100">Hapus</button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">PNG/JPG. Tampil di kop dokumen cetak/PDF.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {MADRASAH_FIELDS.map((f) => (
          <div key={f.key} className={f.key === "alamatSekolah" ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">{f.label}</label>
            <input
              data-testid={`madrasah-input-${f.key}-${target.id}`}
              value={form[f.key]} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm"
            />
          </div>
        ))}
      </div>

      <button data-testid={`btn-save-madrasah-${target.id}`} onClick={save} disabled={saving}
        className="mt-4 flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Pengaturan
      </button>
    </div>
  );
}
