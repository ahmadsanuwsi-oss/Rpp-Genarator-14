import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { RPP_TYPE, GENERATORS, TYPE_LABEL } from "@/lib/docTypes";
import {
  FileText, CalendarRange, CalendarDays, ClipboardCheck, Clock, Waypoints,
  ListChecks, PencilRuler, Image as ImageIcon, Plus, Upload, Printer, Trash2,
  Loader2, Search, Sparkles, Eye, FolderOpen, Users, Copy, FileDown,
} from "lucide-react";
import { toast } from "sonner";

const ICONS = {
  FileText, CalendarRange, CalendarDays, ClipboardCheck, Clock, Waypoints,
  ListChecks, PencilRuler, Image: ImageIcon,
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, by_type: {} });
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([api.get("/documents/stats"), api.get("/documents")]);
      setStats(s.data);
      setDocs(d.data);
    } catch (e) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Hapus dokumen ini?")) return;
    try {
      await api.delete(`/documents/${id}`);
      toast.success("Dokumen dihapus");
      load();
    } catch { toast.error("Gagal menghapus"); }
  };

  const duplicate = async (id) => {
    try {
      const { data } = await api.post(`/documents/${id}/duplicate`);
      toast.success("Dokumen diduplikat");
      navigate(data.type === "rpp" ? `/rpp/${data.id}` : `/generate/${data.type}/${data.id}`);
    } catch { toast.error("Gagal menduplikat"); }
  };

  const downloadDocx = async (doc) => {
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

  const isManager = user?.role === "admin" || user?.role === "superadmin";

  const editLink = (doc) => (doc.type === "rpp" ? `/rpp/${doc.id}` : `/generate/${doc.type}/${doc.id}`);

  const filtered = docs.filter((d) => {
    const okType = filter === "all" || d.type === filter;
    const okQ = !q || (d.title || "").toLowerCase().includes(q.toLowerCase());
    return okType && okQ;
  });

  const genCards = GENERATORS.slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-emerald-800 font-semibold">Dashboard</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
          Halo, {user?.name?.split(" ")[0] || "Guru"} 👋
        </h1>
        <p className="text-slate-500 mt-1">Buat, simpan, dan cetak perangkat ajar Anda kapan saja.</p>
      </div>

      {/* Primary create actions */}
      {isManager ? (
        <Link
          to="/users"
          data-testid="card-manage-users"
          className="group relative overflow-hidden rounded-2xl bg-[#0F382C] text-white p-6 mb-8 flex items-center gap-5 hover:shadow-xl transition-shadow"
        >
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{user?.role === "superadmin" ? "Kelola Admin Sekolah" : "Kelola Akun Guru"}</h3>
            <p className="text-emerald-100/80 text-sm mt-1">
              {user?.role === "superadmin"
                ? "Buat akun Admin. Dokumen seluruh guru terpantau di sini."
                : "Buat akun guru. Semua dokumen guru otomatis tampil di dashboard Anda."}
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-emerald-600/30 blur-2xl group-hover:scale-125 transition-transform" />
        </Link>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/rpp/new"
            data-testid="card-create-rpp-manual"
            className="group relative overflow-hidden rounded-2xl bg-[#0F382C] text-white p-6 hover:shadow-xl transition-shadow"
          >
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Buat RPP Manual</h3>
            <p className="text-emerald-100/80 text-sm mt-1">Isi formulir lengkap RPP / Modul Ajar langkah demi langkah.</p>
            <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-emerald-600/30 blur-2xl group-hover:scale-125 transition-transform" />
          </Link>

          <Link
            to="/rpp/new?mode=upload"
            data-testid="card-create-rpp-upload"
            className="group relative overflow-hidden rounded-2xl bg-white border-2 border-amber-300 p-6 hover:shadow-xl transition-shadow"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Unggah PDF / Gambar <Sparkles className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-slate-500 text-sm mt-1">AI membaca file Anda dan mengisi RPP secara otomatis untuk diedit.</p>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total Dokumen" value={stats.total} icon={FolderOpen} highlight />
        {isManager ? (
          <StatCard label={user?.role === "superadmin" ? "Admin" : "Guru"} value={stats.managed_users || 0} icon={Users} />
        ) : (
          <StatCard label="RPP" value={stats.by_type.rpp || 0} icon={FileText} />
        )}
        <StatCard label="ATP" value={stats.by_type.atp || 0} icon={Waypoints} />
        <StatCard label="LKPD" value={stats.by_type.lkpd || 0} icon={PencilRuler} />
      </div>

      {/* Generators */}
      {user?.role !== "superadmin" && (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">Buat Perangkat Lain dengan AI</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GENERATORS.map((g) => {
            const Icon = ICONS[g.icon] || FileText;
            return (
              <button
                key={g.key}
                data-testid={`btn-gen-${g.key}`}
                onClick={() => navigate(`/generate/${g.key}`)}
                className="text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-700 hover:shadow-md transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5 text-emerald-800" />
                </div>
                <div className="font-semibold text-slate-800 text-sm">{g.label}</div>
                <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{g.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Library */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900">Dokumen Tersimpan</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                data-testid="input-search"
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Cari judul..."
                className="pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-emerald-700 w-full sm:w-48"
              />
            </div>
            <select
              data-testid="select-filter" value={filter} onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-emerald-700 bg-white"
            >
              <option value="all">Semua</option>
              <option value="rpp">RPP</option>
              {GENERATORS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Belum ada dokumen. Mulai buat RPP pertama Anda!</p>
          </div>
        ) : (
          <div className="grid gap-3" data-testid="documents-list">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                data-testid={`doc-item-${doc.id}`}
                className="group bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-emerald-800" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {TYPE_LABEL[doc.type] || doc.type}
                    </span>
                    {isManager && doc.owner_name && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {doc.owner_name}
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-slate-800 truncate mt-1">{doc.title}</div>
                  <div className="text-xs text-slate-400">
                    Diperbarui {new Date(doc.updated_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link to={`/view/${doc.id}`} data-testid={`btn-view-${doc.id}`}
                    className="p-2 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-800" title="Lihat & Cetak">
                    <Eye className="w-[18px] h-[18px]" />
                  </Link>
                  <button onClick={() => downloadDocx(doc)} data-testid={`btn-docx-${doc.id}`}
                    className="p-2 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700" title="Unduh Word (DOCX)">
                    <FileDown className="w-[18px] h-[18px]" />
                  </button>
                  <button onClick={() => duplicate(doc.id)} data-testid={`btn-duplicate-${doc.id}`}
                    className="p-2 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-800" title="Duplikat">
                    <Copy className="w-[18px] h-[18px]" />
                  </button>
                  <button onClick={(e) => remove(doc.id, e)} data-testid={`btn-delete-${doc.id}`}
                    className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" title="Hapus">
                    <Trash2 className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "bg-[#0F382C] border-emerald-900 text-white" : "bg-white border-slate-200"}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${highlight ? "text-emerald-100/70" : "text-slate-400"}`}>{label}</span>
        <Icon className={`w-4 h-4 ${highlight ? "text-amber-400" : "text-emerald-700"}`} />
      </div>
      <div className={`text-3xl font-extrabold mt-2 ${highlight ? "text-white" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}
