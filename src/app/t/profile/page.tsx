"use client";

import { useAuth } from "@/components/AuthProvider";
import { Card, Button, Loading } from "@/components/ui";
import { fullName } from "@/lib/permissions";

export default function TechProfilePage() {
  const { profile, loading, signOut, configured } = useAuth();
  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-head font-bold text-ink">Profile</h1>
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-accent grid place-items-center text-white font-head text-xl">
            {(profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "")}
          </div>
          <div>
            <div className="text-lg font-semibold text-ink">{fullName(profile) || "Technician"}</div>
            <div className="text-sm text-muted">{profile?.email}</div>
            <div className="text-xs text-accent uppercase tracking-wide mt-0.5">{profile?.role}</div>
          </div>
        </div>
        {profile?.phone && <div className="text-sm text-muted mt-4">Phone: {profile.phone}</div>}
      </Card>

      {!configured && (
        <Card className="p-4 text-xs text-gold border-gold/30">
          Demo mode — Supabase Auth not configured. You are viewing as a demo user.
        </Card>
      )}

      <Button variant="danger" onClick={signOut} className="w-full">Sign out</Button>
    </div>
  );
}
