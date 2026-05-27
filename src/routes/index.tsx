import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useRepairStore } from '@/lib/repair-store';
import { appointmentProfit, appointmentTotal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Route = createFileRoute('/')({
  component: Dashboard,
});

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function Dashboard() {
  const { appointments, seedSampleData } = useRepairStore();
  const now = new Date();

  // Current month metrics
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthCompleted = appointments.filter(a => {
    if (a.status !== 'completed') return false;
    const d = new Date(a.completedAt || a.scheduledDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSales = thisMonthCompleted.reduce((s, a) => s + appointmentTotal(a), 0);
  const totalProfit = thisMonthCompleted.reduce((s, a) => s + appointmentProfit(a), 0);
  const completedCount = thisMonthCompleted.length;
  const scheduledCount = appointments.filter(a => a.status === 'scheduled').length;

  // History — month/year selector
  const years = useMemo(() => {
    const set = new Set<number>([currentYear]);
    appointments.forEach(a => set.add(new Date(a.scheduledDate).getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [appointments, currentYear]);

  const [histYear, setHistYear] = useState(currentYear);
  const [histMonth, setHistMonth] = useState(currentMonth);

  const histAppts = appointments.filter(a => {
    const d = new Date(a.completedAt || a.scheduledDate);
    return d.getMonth() === histMonth && d.getFullYear() === histYear && a.status === 'completed';
  });
  const histSales = histAppts.reduce((s, a) => s + appointmentTotal(a), 0);
  const histProfit = histAppts.reduce((s, a) => s + appointmentProfit(a), 0);
  const histJobs = histAppts.length;

  const stats = [
    { label: 'Sales (This Month)', value: fmtMoney(totalSales), color: 'text-primary' },
    { label: 'Profit (This Month)', value: fmtMoney(totalProfit), color: 'text-success' },
    { label: 'Completed Repairs', value: completedCount, color: 'text-foreground' },
    { label: 'Scheduled Repairs', value: scheduledCount, color: 'text-chart-3' },
  ];

  const upcoming = appointments
    .filter(a => a.status === 'scheduled')
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">{MONTH_NAMES[currentMonth]} {currentYear} overview</p>
        </div>
        <div className="flex gap-2">
          {appointments.length === 0 && (
            <Button variant="outline" onClick={seedSampleData} className="text-xs sm:text-sm">Load Sample Data</Button>
          )}
          <Link to="/appointments/new">
            <Button className="glow-primary text-xs sm:text-sm">+ New Appointment</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="stat-card rounded-xl p-4 sm:p-5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold sm:mt-2 sm:text-3xl ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* History */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">History</h2>
            <p className="text-xs text-muted-foreground">Browse sales, profit, and jobs by month</p>
          </div>
          <div className="flex gap-2">
            <Select value={String(histMonth)} onValueChange={v => setHistMonth(Number(v))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(histYear)} onValueChange={v => setHistYear(Number(v))}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
          <HistCell label="Sales" value={fmtMoney(histSales)} color="text-primary" />
          <HistCell label="Profit" value={fmtMoney(histProfit)} color="text-success" />
          <HistCell label="Jobs" value={String(histJobs)} color="text-foreground" />
        </div>
      </section>

      {/* Upcoming */}
      <section>
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">Upcoming Repairs</h2>
          <Link to="/appointments" className="text-xs text-primary hover:underline sm:text-sm">View all →</Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center sm:p-12">
            <p className="text-muted-foreground">No upcoming repairs</p>
            <Link to="/appointments/new" className="mt-2 inline-block text-sm text-primary hover:underline">Schedule one →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map(a => (
              <Link key={a.id} to="/appointments/$id" params={{ id: a.id }} className="glass-card flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent sm:p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.iPhoneModel} · {a.description}</p>
                </div>
                <div className="ml-3 text-right">
                  <p className="text-xs text-muted-foreground">{new Date(a.scheduledDate).toLocaleDateString()}</p>
                  <p className="text-sm font-semibold text-foreground">{fmtMoney(appointmentTotal(a))}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HistCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 sm:p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">{label}</p>
      <p className={`mt-1 text-lg font-bold sm:text-2xl ${color}`}>{value}</p>
    </div>
  );
}
