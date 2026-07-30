"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TechBottomNav } from "./TechBottomNav";
import { useAuth } from "./AuthProvider";
import { Loading } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, role } = useAuth();
  const [open, setOpen] = useState(false);

  // login renders bare
  if (pathname === "/login") return <>{children}</>;

  // technician mobile app (namespaced /t/*): bottom nav, no sidebar
  const isTechArea = pathname.startsWith("/t");
  if (isTechArea || role === "Technician") {
    return (
      <div className="min-h-screen bg-base pb-20">
        <header className="sticky top-0 z-30 bg-base/95 backdrop-blur border-b border-line px-4 py-3 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot.svg" alt="Auto Dude" className="h-9 w-9 object-contain" />
          <span className="font-head font-bold tracking-wide text-ink">AUTO DUDE</span>
          <span className="ml-auto text-[11px] text-muted uppercase tracking-wide">Technician</span>
        </header>
        <main className="max-w-md mx-auto px-3 py-4">
          {loading ? <Loading /> : children}
        </main>
        <TechBottomNav />
      </div>
    );
  }

  // admin / manager command center
  return (
    <div className="min-h-screen flex bg-base">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-base/90 backdrop-blur border-b border-line px-4 py-2.5 flex items-center gap-3 md:hidden">
          <button className="text-ink text-xl px-1" onClick={() => setOpen(true)} aria-label="Menu">☰</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot.svg" alt="Auto Dude" className="h-8 w-8 object-contain" />
          <span className="font-head font-bold tracking-wide text-ink">AUTO DUDE</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {loading ? <Loading /> : children}
        </main>
      </div>
    </div>
  );
}
