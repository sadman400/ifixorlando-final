import type { AppointmentStatus } from '@/lib/types';

const LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const CLASSES: Record<AppointmentStatus, string> = {
  scheduled: 'status-pending',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
