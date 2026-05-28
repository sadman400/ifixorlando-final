import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { formatBusinessDate } from "@/lib/date-time";
import { useRepairStore } from "@/lib/repair-store";
import { appointmentTotal } from "@/lib/types";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/clients")({
  component: Clients,
});

interface ClientRecord {
  name: string;
  phone: string;
  email: string;
  address: string;
  totalJobs: number;
  totalSpent: number;
  lastVisit: string;
  appointmentIds: string[];
}

function Clients() {
  const { appointments } = useRepairStore();
  const [query, setQuery] = useState("");

  const clients = useMemo<ClientRecord[]>(() => {
    const map = new Map<string, ClientRecord>();
    appointments.forEach((a) => {
      const key = `${a.customerName.toLowerCase()}|${a.phone}`;
      const existing = map.get(key);
      if (existing) {
        existing.totalJobs++;
        existing.totalSpent += appointmentTotal(a);
        existing.appointmentIds.push(a.id);
        if (new Date(a.scheduledDate) > new Date(existing.lastVisit))
          existing.lastVisit = a.scheduledDate;
      } else {
        map.set(key, {
          name: a.customerName,
          phone: a.phone,
          email: a.email,
          address: a.address,
          totalJobs: 1,
          totalSpent: appointmentTotal(a),
          lastVisit: a.scheduledDate,
          appointmentIds: [a.id],
        });
      }
    });
    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [appointments]);

  const filtered = clients.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">{clients.length} unique customers</p>
      </div>

      <Input
        placeholder="Search by name, phone, email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="sm:max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No clients yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <div key={c.phone + c.name} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                  {c.email && <p className="truncate text-xs text-muted-foreground">{c.email}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">${c.totalSpent.toFixed(0)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Total spent
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>
                  {c.totalJobs} {c.totalJobs === 1 ? "job" : "jobs"}
                </span>
                <span>Last: {formatBusinessDate(c.lastVisit)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.appointmentIds.slice(0, 3).map((id) => (
                  <Link
                    key={id}
                    to="/appointments/$id"
                    params={{ id }}
                    className="text-xs text-primary hover:underline"
                  >
                    #{id.slice(0, 6)}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
