import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useRepairStore } from '@/lib/repair-store';
import { appointmentTotal, type AppointmentStatus } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/appointments/')({
  component: AppointmentsList,
});

const FILTERS: { label: string; value: 'all' | AppointmentStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

function AppointmentsList() {
  const { appointments } = useRepairStore();
  const [filter, setFilter] = useState<'all' | AppointmentStatus>('all');
  const [query, setQuery] = useState('');

  const filtered = appointments
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return a.customerName.toLowerCase().includes(q)
        || a.phone.includes(q)
        || a.iPhoneModel.toLowerCase().includes(q)
        || a.description.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">{appointments.length} total repair jobs</p>
        </div>
        <Link to="/appointments/new"><Button className="glow-primary">+ New Appointment</Button></Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search by name, phone, model..." value={query} onChange={e => setQuery(e.target.value)} className="sm:max-w-xs" />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No appointments match.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map(a => (
            <Link key={a.id} to="/appointments/$id" params={{ id: a.id }} className="glass-card rounded-xl p-4 transition-colors hover:bg-accent">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{a.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.iPhoneModel}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">{new Date(a.scheduledDate).toLocaleDateString()}</span>
                <span className="text-sm font-semibold text-foreground">${appointmentTotal(a).toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
