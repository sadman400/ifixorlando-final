import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useRepairStore } from '@/lib/repair-store';
import { appointmentProfit, appointmentTotal, type Appointment, type AppointmentStatus } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ArrowLeft, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/appointments/$id')({
  component: AppointmentDetail,
});

function AppointmentDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { getAppointment, updateAppointment, updateStatus, deleteAppointment } = useRepairStore();
  const appt = getAppointment(id);
  const [editing, setEditing] = useState(false);

  if (!appt) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">Appointment not found</p>
        <Link to="/appointments" className="mt-2 inline-block text-sm text-primary hover:underline">← Back to appointments</Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('Delete this appointment?')) {
      deleteAppointment(id);
      navigate({ to: '/appointments' });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/appointments" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-3 w-3" /> Appointments
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">{appt.customerName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={appt.status} />
            <span className="text-sm text-muted-foreground">{appt.iPhoneModel}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
          <Button variant="ghost" size="icon" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Status changer */}
      <section className="glass-card rounded-xl p-4 sm:p-6">
        <Label className="text-xs">Update Status</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['scheduled','completed','cancelled'] as AppointmentStatus[]).map(s => (
            <button
              key={s}
              onClick={() => updateStatus(id, s)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                appt.status === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </section>

      {editing ? (
        <EditForm appt={appt} onSave={updates => { updateAppointment(id, updates); setEditing(false); }} />
      ) : (
        <ViewMode appt={appt} />
      )}

      <section className="glass-card rounded-xl p-4 sm:p-6">
        <Label className="mb-3 block text-xs">Photos / Documentation</Label>
        <PhotoUpload photos={appt.photos} onPhotosChange={photos => updateAppointment(id, { photos })} label="Repair photos" />
      </section>
    </div>
  );
}

function ViewMode({ appt }: { appt: Appointment }) {
  return (
    <div className="space-y-4">
      <section className="glass-card rounded-xl p-4 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Customer</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Detail label="Phone" value={appt.phone} />
          <Detail label="Email" value={appt.email || '—'} />
          <Detail label="Address" value={appt.address || '—'} />
          <Detail label="Scheduled" value={new Date(appt.scheduledDate).toLocaleString()} />
        </div>
      </section>

      <section className="glass-card rounded-xl p-4 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Repair</h2>
        <Detail label="Description" value={appt.description || '—'} />
      </section>

      <section className="glass-card rounded-xl p-4 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pricing</h2>
        <div className="space-y-2 text-sm">
          <Row label="Charge" value={`$${appt.charge.toFixed(2)}`} />
          {appt.addOns.map((a, i) => <Row key={i} label={`Add-on: ${a.name}`} value={`$${a.price.toFixed(2)}`} />)}
          {appt.coupon > 0 && <Row label="Coupon" value={`-$${appt.coupon.toFixed(2)}`} />}
          <div className="border-t border-border pt-2">
            <Row label="Total" value={`$${appointmentTotal(appt).toFixed(2)}`} bold />
            <Row label="Parts Cost" value={`$${appt.cost.toFixed(2)}`} muted />
            <Row label="Profit" value={`$${appointmentProfit(appt).toFixed(2)}`} className="text-success" bold />
          </div>
        </div>
      </section>
    </div>
  );
}

function EditForm({ appt, onSave }: { appt: Appointment; onSave: (u: Partial<Appointment>) => void }) {
  const [f, setF] = useState({
    customerName: appt.customerName, phone: appt.phone, email: appt.email, address: appt.address,
    iPhoneModel: appt.iPhoneModel, description: appt.description,
    charge: appt.charge, cost: appt.cost, coupon: appt.coupon,
    scheduledDate: appt.scheduledDate.slice(0, 16),
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...f, scheduledDate: new Date(f.scheduledDate).toISOString() }); }} className="space-y-4">
      <section className="glass-card space-y-3 rounded-xl p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer Name"><Input value={f.customerName} onChange={e => set('customerName', e.target.value)} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={e => set('phone', e.target.value)} /></Field>
          <Field label="Email"><Input value={f.email} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Address"><Input value={f.address} onChange={e => set('address', e.target.value)} /></Field>
          <Field label="iPhone Model"><Input value={f.iPhoneModel} onChange={e => set('iPhoneModel', e.target.value)} /></Field>
          <Field label="Scheduled Date"><Input type="datetime-local" value={f.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} /></Field>
        </div>
        <Field label="Description"><Textarea rows={3} value={f.description} onChange={e => set('description', e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Charge ($)"><Input type="number" step="0.01" value={f.charge} onChange={e => set('charge', Number(e.target.value))} /></Field>
          <Field label="Parts Cost ($)"><Input type="number" step="0.01" value={f.cost} onChange={e => set('cost', Number(e.target.value))} /></Field>
          <Field label="Coupon ($)"><Input type="number" step="0.01" value={f.coupon} onChange={e => set('coupon', Number(e.target.value))} /></Field>
        </div>
      </section>
      <div className="flex justify-end"><Button type="submit" className="glow-primary">Save Changes</Button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

function Row({ label, value, bold, muted, className }: { label: string; value: string; bold?: boolean; muted?: boolean; className?: string }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold' : ''} ${muted ? 'text-muted-foreground' : 'text-foreground'} ${className || ''}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
