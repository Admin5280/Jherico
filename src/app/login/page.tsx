"use client";

import { useState } from "react";
import { supabaseBrowser, authConfigured } from "@/lib/supabaseBrowser";
import { canAccessPage, landingPage } from "@/lib/permissions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    if (!authConfigured()) {
      setErr("Login is not configured yet (missing Supabase env vars). The app is running in open demo mode — just visit any page.");
      setBusy(false);
      return;
    }
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    const me = await fetch("/api/me").then((r) => r.json()).catch(() => null);
    const role = me?.profile?.role;
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = next && canAccessPage(role, next) ? next : landingPage(role);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot.svg" alt="Auto Dude" className="h-28 w-auto object-contain mb-3" />
          <div className="text-2xl font-head font-bold text-ink tracking-wide">AUTO DUDE</div>
          <div className="text-xs text-muted uppercase tracking-wide">Command Center · New Braunfels, TX</div>
        </div>
        <form onSubmit={submit} className="bg-surface border border-line rounded-2xl shadow-card p-6 space-y-3">
          <div>
            <label className="text-xs text-muted">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-base border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-base border border-line rounded-lg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none" />
          </div>
          {err && <div className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">{err}</div>}
          <button type="submit" disabled={busy}
            className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-accent text-white hover:bg-accent2 transition-colors disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-[11px] text-muted text-center pt-1">Access is invite-only. Contact an admin for an account.</p>
        </form>
      </div>
    </div>
  );
}
