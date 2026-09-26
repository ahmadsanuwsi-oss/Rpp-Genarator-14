import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { GENERATORS } from "@/lib/docTypes";
import {
  LayoutDashboard, FileText, CalendarRange, CalendarDays, ClipboardCheck,
  Clock, Waypoints, ListChecks, PencilRuler, Image as ImageIcon, LogOut,
  GraduationCap, Menu, X, User, ShieldCheck, Users,
} from "lucide-react";

const ICONS = {
  CalendarRange, CalendarDays, ClipboardCheck, Clock, Waypoints, ListChecks,
  PencilRuler, Image: ImageIcon,
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const NavItem = ({ to, icon: Icon, label, testid }) => {
    const active = loc.pathname === to;
    return (
      <Link
        to={to}
        data-testid={testid}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
          active
            ? "bg-emerald-800 text-white font-semibold"
            : "text-emerald-100/80 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-white font-extrabold text-base">Generator Pembelajaran</div>
          <div className="text-emerald-200/70 text-[11px]">Perangkat Ajar Guru</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" testid="nav-dashboard" />

        {(user?.role === "admin" || user?.role === "superadmin") && (
          <NavItem
            to="/users"
            icon={user?.role === "superadmin" ? ShieldCheck : Users}
            label={user?.role === "superadmin" ? "Kelola Admin" : "Kelola Guru"}
            testid="nav-users"
          />
        )}

        {user?.role !== "superadmin" && (
          <>
            <NavItem to="/rpp/new" icon={FileText} label="Buat RPP" testid="nav-rpp" />
            <div className="pt-3 pb-1 px-3 text-[10px] uppercase tracking-wider text-emerald-300/60 font-semibold">
              Perangkat Lain
            </div>
            {GENERATORS.map((g) => (
              <NavItem
                key={g.key}
                to={`/generate/${g.key}`}
                icon={ICONS[g.icon] || FileText}
                label={g.label}
                testid={`nav-${g.key}`}
              />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          to="/profile"
          data-testid="nav-profile"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white text-sm font-bold">
            {(user?.name || "G").charAt(0).toUpperCase()}
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name}</div>
            <div className="text-emerald-200/60 text-[11px] truncate">{user?.namaSekolah || "Atur profil"}</div>
          </div>
        </Link>
        <button
          data-testid="btn-logout"
          onClick={() => { logout(); navigate("/login"); }}
          className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-emerald-100/70 hover:bg-red-500/20 hover:text-red-200 text-sm transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[#0B261E] sticky top-0 h-screen no-print">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 no-print">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#0B261E]">
            <button className="absolute right-2 top-2 text-white p-1" onClick={() => setOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 bg-[#0B261E] text-white flex items-center justify-between px-4 py-3 no-print">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <span className="font-bold">Generator Pembelajaran</span>
          </div>
          <button data-testid="btn-menu" onClick={() => setOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
