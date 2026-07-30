"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const TECH_NAV = [
  { href: "/t/today", label: "Today", icon: "☀" },
  { href: "/t/schedule", label: "Schedule", icon: "▦" },
  { href: "/t/jobs", label: "Jobs", icon: "◧" },
  { href: "/t/profile", label: "Profile", icon: "◍" },
];

export function TechBottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line grid grid-cols-4 md:max-w-md md:mx-auto md:rounded-t-2xl">
      {TECH_NAV.map((n) => {
        const active = path === n.href || path.startsWith(n.href + "/");
        return (
          <Link key={n.href} href={n.href}
            className={`flex flex-col items-center justify-center py-2.5 gap-0.5 text-[11px] ${active ? "text-accent" : "text-muted"}`}>
            <span className="text-xl leading-none">{n.icon}</span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
