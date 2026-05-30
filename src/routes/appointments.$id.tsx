import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  businessDateTimeLocalToIso,
  formatBusinessDateTime,
  formatBusinessLongDate,
  formatBusinessTime,
  toBusinessDateTimeLocal,
} from "@/lib/date-time";
import {
  appointmentLabel,
  cleanInventoryModel,
  findStockForAppointment,
  screenColorLabelFor,
  screenColorNameFor,
} from "@/lib/inventory";
import { useRepairStore } from "@/lib/repair-store";
import { appointmentTotal, type Appointment, type AppointmentStatus } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/PhotoUpload";
import { ArrowLeft, MapPin, MessageSquare, Send, Trash2 } from "lucide-react";

export const Route = createFileRoute("/appointments/$id")({
  component: AppointmentDetail,
});

function AppointmentDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { getAppointment, updateAppointment, updateStatus, deleteAppointment, stocks } =
    useRepairStore();
  const appt = getAppointment(id);
  const [editing, setEditing] = useState(false);

  const stockMatch = useMemo(() => {
    if (!appt) return undefined;

    return findStockForAppointment(stocks, appt);
  }, [appt, stocks]);

  if (!appt) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <p className="text-muted-foreground">Appointment not found</p>
        <Link to="/appointments" className="mt-2 inline-block text-sm text-primary hover:underline">
          Back to appointments
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm("Delete this appointment?")) {
      deleteAppointment(id);
      navigate({ to: "/appointments" });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/appointments"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-3 w-3" /> Appointments
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            {appt.customerName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={appt.status} />
            <span className="text-sm text-muted-foreground">{appointmentLabel(appt)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
            {editing ? "Cancel" : "Edit"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            aria-label="Delete appointment"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Section title="Update Status">
        <div className="flex flex-wrap gap-2">
          {(["scheduled", "completed", "cancelled"] as AppointmentStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => updateStatus(id, status)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                appt.status === status
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Section>

      {editing ? (
        <EditForm
          appt={appt}
          onSave={(updates) => {
            updateAppointment(id, updates);
            setEditing(false);
          }}
        />
      ) : (
        <ViewMode
          appt={appt}
          stockQuantity={stockMatch?.quantity}
          stockPartsCost={stockMatch?.costPerUnit}
          onNotesChange={(notes) => updateAppointment(id, { notes })}
        />
      )}

      <Section title="Photos / Documentation">
        <PhotoUpload
          photos={appt.photos}
          onPhotosChange={(photos) => updateAppointment(id, { photos })}
          label="Repair photos"
        />
      </Section>

      <SmsMessages appt={appt} />
    </div>
  );
}

function ViewMode({
  appt,
  stockQuantity,
  stockPartsCost,
  onNotesChange,
}: {
  appt: Appointment;
  stockQuantity?: number;
  stockPartsCost?: number;
  onNotesChange: (notes: string) => void;
}) {
  const partsCost = appt.cost > 0 ? appt.cost : (stockPartsCost ?? 0);
  const profit = appointmentTotal(appt) - partsCost;

  return (
    <div className="space-y-4">
      <Section title="Customer">
        <div className="grid gap-3 sm:grid-cols-2">
          <Detail label="Name" value={appt.customerName} />
          <Detail label="Email" value={appt.email || "-"} />
          <Detail label="Phone" value={appt.phone || "-"} />
        </div>
      </Section>

      <Section title="Service">
        <div className="grid gap-3 sm:grid-cols-2">
          <Detail label="Device Model" value={cleanModel(appt.iPhoneModel)} />
          <Detail label="Screen Color" value={screenColorLabelFor(appt) || "-"} />
          <Detail
            label="In Stock"
            value={
              typeof stockQuantity === "number"
                ? `${stockQuantity} unit${stockQuantity === 1 ? "" : "s"}`
                : "Not tracked"
            }
            valueClassName="font-bold text-primary"
          />
          <Detail label="Parts Cost" value={`$${partsCost.toFixed(2)}`} />
          <Detail label="Start Time" value={formatDateTime(appt.scheduledDate)} />
          <Detail label="End Time" value={appt.endDate ? formatDateTime(appt.endDate) : "-"} />
          <Detail label="Coupon Code" value={appt.couponCode || "-"} />
          <Detail label="Apt / Unit / Floor" value={appt.unit || "-"} />
        </div>
        <div className="mt-3">
          <Detail label="Description" value={appt.description || "-"} />
        </div>
      </Section>

      <Section title="Technician Notes">
        <Textarea
          rows={4}
          placeholder="Add notes about the repair, diagnostics, parts used..."
          value={appt.notes || ""}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </Section>

      <Section title="Address">
        {appt.address ? (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(
              [appt.address, appt.unit].filter(Boolean).join(" "),
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-2 text-sm text-primary hover:underline"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {appt.address}
              {appt.unit ? (
                <span className="block text-xs text-muted-foreground">Unit: {appt.unit}</span>
              ) : null}
              {appt.zip ? (
                <span className="block text-xs text-muted-foreground">ZIP: {appt.zip}</span>
              ) : null}
            </span>
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">-</p>
        )}
      </Section>

      <Section title="Pricing">
        <div className="space-y-2 text-sm">
          <Row label="Charge" value={`$${appt.charge.toFixed(2)}`} />
          {appt.addOns.map((addOn, index) => (
            <Row
              key={`${addOn.name}-${index}`}
              label={`Service Charge: ${addOn.name || "Add-on"}`}
              value={`$${addOn.price.toFixed(2)}`}
            />
          ))}
          {appt.coupon > 0 && (
            <Row
              label={`Coupon${appt.couponCode ? ` (${appt.couponCode})` : ""}`}
              value={`-$${appt.coupon.toFixed(2)}`}
            />
          )}
          <div className="border-t border-border pt-2">
            <Row label="Total" value={`$${appointmentTotal(appt).toFixed(2)}`} bold />
            <Row label="Parts Cost" value={`$${partsCost.toFixed(2)}`} muted />
            <Row label="Profit" value={`$${profit.toFixed(2)}`} className="text-success" bold />
          </div>
        </div>
      </Section>
    </div>
  );
}

function EditForm({
  appt,
  onSave,
}: {
  appt: Appointment;
  onSave: (updates: Partial<Appointment>) => void;
}) {
  const [form, setForm] = useState({
    customerName: appt.customerName,
    phone: appt.phone,
    email: appt.email,
    address: appt.address,
    zip: appt.zip || "",
    unit: appt.unit || "",
    iPhoneModel: cleanModel(appt.iPhoneModel),
    screenColor: screenColorNameFor(appt) || "Black",
    description: appt.description,
    technicianName: appt.technicianName || "",
    charge: appt.charge,
    cost: appt.cost,
    coupon: appt.coupon,
    couponCode: appt.couponCode || "",
    scheduledDate: toBusinessDateTimeLocal(appt.scheduledDate),
    endDate: appt.endDate ? toBusinessDateTimeLocal(appt.endDate) : "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...form,
          iPhoneModel: `${cleanModel(form.iPhoneModel)} - ${form.screenColor} Screen`,
          screenColor: form.screenColor,
          scheduledDate: businessDateTimeLocalToIso(form.scheduledDate),
          endDate: form.endDate ? businessDateTimeLocalToIso(form.endDate) : undefined,
        });
      }}
      className="space-y-4"
    >
      <section className="glass-card space-y-3 rounded-xl p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Customer Name">
            <Input
              value={form.customerName}
              onChange={(event) => set("customerName", event.target.value)}
            />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(event) => set("phone", event.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
            />
          </Field>
          <Field label="Technician Name">
            <Input
              value={form.technicianName}
              onChange={(event) => set("technicianName", event.target.value)}
            />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(event) => set("address", event.target.value)} />
          </Field>
          <Field label="ZIP">
            <Input value={form.zip} onChange={(event) => set("zip", event.target.value)} />
          </Field>
          <Field label="Apt / Unit / Floor">
            <Input value={form.unit} onChange={(event) => set("unit", event.target.value)} />
          </Field>
          <Field label="iPhone Model">
            <Input
              value={form.iPhoneModel}
              onChange={(event) => set("iPhoneModel", event.target.value)}
            />
          </Field>
          <Field label="Screen Color">
            <div className="flex gap-2">
              {["Black", "White"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => set("screenColor", color)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    form.screenColor === color
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {color} Screen
                </button>
              ))}
            </div>
          </Field>
          <Field label="Coupon Code">
            <Input
              value={form.couponCode}
              onChange={(event) => set("couponCode", event.target.value)}
            />
          </Field>
          <Field label="Start Time">
            <Input
              type="datetime-local"
              value={form.scheduledDate}
              onChange={(event) => set("scheduledDate", event.target.value)}
            />
          </Field>
          <Field label="End Time">
            <Input
              type="datetime-local"
              value={form.endDate}
              onChange={(event) => set("endDate", event.target.value)}
            />
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            rows={3}
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Charge ($)">
            <Input
              type="number"
              step="0.01"
              value={form.charge}
              onChange={(event) => set("charge", Number(event.target.value))}
            />
          </Field>
          <Field label="Parts Cost ($)">
            <Input
              type="number"
              step="0.01"
              value={form.cost}
              onChange={(event) => set("cost", Number(event.target.value))}
            />
          </Field>
          <Field label="Coupon ($)">
            <Input
              type="number"
              step="0.01"
              value={form.coupon}
              onChange={(event) => set("coupon", Number(event.target.value))}
            />
          </Field>
        </div>
      </section>
      <div className="flex justify-end">
        <Button type="submit" className="glow-primary">
          Save Changes
        </Button>
      </div>
    </form>
  );
}

function SmsMessages({ appt }: { appt: Appointment }) {
  const phone = (appt.phone || "").replace(/[^\d+]/g, "");
  const smsHref = (body: string) => `sms:${phone}?&body=${encodeURIComponent(body)}`;
  const messages = smsTemplates(appt);

  return (
    <section className="glass-card rounded-xl p-4 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          SMS Messages
        </h2>
      </div>
      {!phone && (
        <p className="mb-3 text-xs text-muted-foreground">
          No phone number on file. Messages will open without a recipient.
        </p>
      )}
      <div className="space-y-3">
        {messages.map((message) => (
          <div key={message.label} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{message.label}</p>
              <Button asChild size="sm" className="glow-primary">
                <a href={smsHref(message.body)}>
                  <Send className="mr-1 h-3 w-3" /> Send
                </a>
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
              {message.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function smsTemplates(appt: Appointment) {
  const customerName = appt.customerName || "there";
  const technicianName = appt.technicianName || customerName;
  const device = appointmentLabel(appt) || "iPhone";
  const appointmentDate = formatLongDate(appt.scheduledDate);
  const startTime = formatTime(appt.scheduledDate);
  const endTime = formatTime(appt.endDate || appt.scheduledDate);
  const signature = "iFixOrlando Support Team www.iFixOrlando.com (321) 355-4648";

  return [
    {
      label: "Confirmation",
      body: `iFixOrlando: Thank you for booking your repair ${customerName}. Your ${device} repair is confirmed and scheduled for ${appointmentDate} at ${startTime}. For your convenience, we will notify you with updates regarding your appointment via sms text messages. Thank you for choosing us, and we look forward to seeing you soon! ${signature}`,
    },
    {
      label: "Reminder",
      body: `iFixOrlando: Hello ${customerName}. Just a friendly reminder about your scheduled ${device} repair appointment for today at ${startTime}. We'll notify you as soon as your technician is en route. ${signature}`,
    },
    {
      label: "En Route",
      body: `iFixOrlando: Good news ${customerName}! ${technicianName}, is currently en route to your location for your scheduled iPhone repair appointment. The estimated time of arrival (ETA) is ${startTime}. You will receive a notification once your technician arrives at your location. ${signature}`,
    },
    {
      label: "Arrival",
      body: `iFixOrlando: ${technicianName} has arrived to repair your device. Thank you for your business and for choosing iFixOrlando! www.iFixOrlando.com`,
    },
    {
      label: "Appointment Delay",
      body: `iFixOrlando: Good news ${customerName}! ${technicianName}, is currently en route to your location for your scheduled iPhone repair appointment. Please note the slight delay. The estimated time of arrival is between ${startTime} and ${endTime}. We apologize for the delay and look forward to seeing you shortly. ${signature}`,
    },
    {
      label: "Reschedule Request",
      body: `iFixOrlando: We've successfully rescheduled your ${device} repair appointment to today at ${startTime}. If you have any further questions or need assistance, feel free to reach out. We look forward to seeing you at ${startTime} for your repair. ${signature}`,
    },
    {
      label: "Cancellation",
      body: `iFixOrlando: Hello ${customerName}. Per your request, your scheduled appointment has been canceled. ${signature}`,
    },
  ];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-card rounded-xl p-4 sm:p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Detail({
  label,
  value,
  valueClassName = "text-foreground",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-0.5 text-sm ${valueClassName}`}>{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  muted,
  className,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "font-semibold" : ""} ${
        muted ? "text-muted-foreground" : "text-foreground"
      } ${className || ""}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function cleanModel(value: string) {
  return cleanInventoryModel(value);
}

function formatDateTime(value: string) {
  return formatBusinessDateTime(value);
}

function formatLongDate(value: string) {
  return formatBusinessLongDate(value);
}

function formatTime(value: string) {
  return formatBusinessTime(value);
}
