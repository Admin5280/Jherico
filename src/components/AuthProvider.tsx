"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Profile, Role, Capability, can as roleCan, canAccessPage, landingPage } from "@/lib/permissions";
import { supabaseBrowser, authConfigured } from "@/lib/supabaseBrowser";

interface AuthState {
  loading: boolean;
  configured: boolean;
  profile: Profile | null;
  role: Role | undefined;
  can: (cap: Capability) => boolean;
  canAccess: (path: string) => boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setConfigured(!!j.configured);
        setProfile(j.profile ?? null);
      })
      .catch(() => setConfigured(false))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // In demo mode (Supabase not configured) the server runs open as Admin, so
  // mirror that on the client so admin action buttons are usable.
  const role = profile?.role ?? (!configured ? "Admin" : undefined);

  // route away from pages this role can't open (once loaded & configured)
  useEffect(() => {
    if (loading || !configured || !profile) return;
    if (pathname === "/login") return;
    if (!canAccessPage(role, pathname)) {
      router.replace(landingPage(role));
    }
  }, [loading, configured, profile, pathname, role, router]);

  async function signOut() {
    if (authConfigured()) await supabaseBrowser().auth.signOut();
    window.location.href = "/login";
  }

  const value: AuthState = {
    loading,
    configured,
    profile,
    role,
    can: (cap) => roleCan(role, cap),
    canAccess: (path) => canAccessPage(role, path),
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
