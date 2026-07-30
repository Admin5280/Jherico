"use client";

import { useMemo, useState } from "react";
import { useApiData } from "@/lib/api";
import { CustomerWithVehicles } from "@/lib/customersDb";
import { PageHeader, Card, Input, Loading, ErrorState, Empty, Table, Col } from "@/components/ui";
import { fullName } from "@/lib/format";

export default function CustomersPage() {
  const { data, loading, error } = useApiData<{ customers: CustomerWithVehicles[] }>("/api/customers");
  const [q, setQ] = useState("");
  const customers = data?.customers ?? [];

  const filtered = useMemo(() => customers.filter((c) => {
    if (!q) return true;
    const hay = `${c.first_name} ${c.last_name} ${c.phone} ${c.email} ${c.city}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [customers, q]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const cols: Col<CustomerWithVehicles>[] = [
    { key: "name", label: "Customer", render: (c) => <span className="text-ink">{fullName(c.first_name, c.last_name)}</span> },
    { key: "phone", label: "Phone", render: (c) => <span className="text-muted">{c.phone}</span> },
    { key: "email", label: "Email", render: (c) => <span className="text-muted">{c.email}</span> },
    { key: "city", label: "City", render: (c) => <span className="text-muted">{c.city}</span> },
    { key: "vehicles", label: "Vehicles", render: (c) => <span className="text-muted">{(c.vehicles ?? []).map((v) => `${v.make} ${v.model}`).join(", ") || "—"}</span> },
    { key: "ghl", label: "GHL", render: (c) => <span className="text-[10px] text-muted font-mono">{c.ghl_contact_id || "—"}</span> },
  ];

  return (
    <>
      <PageHeader title="Customers" subtitle={`${customers.length} customers`} />
      <Card className="p-3 mb-4"><Input placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} /></Card>
      {filtered.length === 0 ? <Empty label="No customers found." /> : <Table cols={cols} rows={filtered} />}
      <p className="text-[11px] text-muted mt-3">GoHighLevel is the source of truth for contacts; records here link by GHL contact ID.</p>
    </>
  );
}
