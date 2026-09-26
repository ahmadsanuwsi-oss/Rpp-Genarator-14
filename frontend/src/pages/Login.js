import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiErr } from "@/lib/api";
import { GraduationCap, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("guru@demo.com");
  const [password, setPassword] = useState("guru123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Selamat datang kembali!");
      navigate("/dashboard");
    } catch (err) {
      setError(apiErr(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-[#0B261E] p-12 text-white relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-xl font-extrabold">Generator Pembelajaran</span>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Susun Perangkat Ajar<br />dalam Hitungan Menit.
          </h1>
          <p className="mt-5 text-emerald-100/80 text-base leading-relaxed max-w-md">
            Buat RPP secara manual atau unggah PDF/gambar untuk diisi otomatis oleh AI.
            Lengkapi juga Prota, Prosem, KKTP, ATP, Asesmen, LKPD, hingga Poster —
            semua tersimpan dan siap dicetak ke kertas A4 kapan saja.
          </p>
          <div className="mt-8 flex gap-3 flex-wrap">
            {["RPP", "Prota", "Prosem", "ATP", "LKPD", "Asesmen"].map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full bg-white/10 text-sm border border-white/15">{t}</span>
            ))}
          </div>
        </div>
        <div className="text-emerald-200/50 text-sm relative z-10">
          Kurikulum Merdeka & Kurikulum Berbasis Cinta
        </div>
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-emerald-700/30 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 bg-[#F8FAFC]">
        <form onSubmit={submit} className="w-full max-w-sm" data-testid="login-form">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-800 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-slate-900">Generator Pembelajaran</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-800" /> Masuk Akun Guru
          </h2>
          <p className="text-slate-500 text-sm mt-1 mb-6">Kelola semua perangkat ajar Anda di satu tempat.</p>

          {error && (
            <div data-testid="login-error" className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Email</label>
          <input
            data-testid="input-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full mb-4 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm"
          />
          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Kata Sandi</label>
          <input
            data-testid="input-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full mb-5 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm"
          />
          <button
            data-testid="btn-login" type="submit" disabled={loading}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Masuk
          </button>
          <p className="text-center text-sm text-slate-500 mt-5">
            Akun dibuat oleh Admin sekolah Anda.
          </p>
          <div className="mt-4 text-center text-xs text-slate-400">
            Demo: guru@demo.com / guru123
          </div>
        </form>
      </div>
    </div>
  );
}
