import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiErr } from "@/lib/api";
import { GraduationCap, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Akun berhasil dibuat!");
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
            Mulai Gratis.<br />Ringankan Beban Administrasi.
          </h1>
          <p className="mt-5 text-emerald-100/80 text-base leading-relaxed max-w-md">
            Daftar sebagai guru dan simpan seluruh perangkat ajar Anda secara otomatis.
            Cetak ke printer atau ekspor PDF A4 kapan saja.
          </p>
        </div>
        <div className="text-emerald-200/50 text-sm relative z-10">Kurikulum Merdeka & Berbasis Cinta</div>
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-emerald-700/30 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 bg-[#F8FAFC]">
        <form onSubmit={submit} className="w-full max-w-sm" data-testid="register-form">
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-emerald-800" /> Daftar Akun Guru
          </h2>
          <p className="text-slate-500 text-sm mt-1 mb-6">Buat akun untuk mulai menyusun perangkat ajar.</p>

          {error && (
            <div data-testid="register-error" className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Nama Lengkap</label>
          <input data-testid="input-name" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full mb-4 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm" />
          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Email</label>
          <input data-testid="input-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full mb-4 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm" />
          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-1">Kata Sandi</label>
          <input data-testid="input-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full mb-5 px-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 outline-none text-sm" />
          <button data-testid="btn-register" type="submit" disabled={loading}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Daftar
          </button>
          <p className="text-center text-sm text-slate-500 mt-5">
            Sudah punya akun?{" "}
            <Link to="/login" data-testid="link-login" className="text-emerald-800 font-semibold hover:underline">Masuk</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
