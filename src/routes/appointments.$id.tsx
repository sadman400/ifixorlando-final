import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUSINESS_TIME_ZONE,
  businessDateTimeLocalToIso,
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/PhotoUpload";
import { ArrowLeft, CheckCircle2, MapPin, MessageSquare, Pencil, Send, Trash2 } from "lucide-react";
import type { SmsTemplate } from "@/lib/types";

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
          onAgreementChange={(updates) => updateAppointment(id, updates)}
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
  onAgreementChange,
}: {
  appt: Appointment;
  stockQuantity?: number;
  stockPartsCost?: number;
  onNotesChange: (notes: string) => void;
  onAgreementChange: (updates: Partial<Appointment>) => void;
}) {
  const partsCost = appt.cost > 0 ? appt.cost : (stockPartsCost ?? 0);
  const profit = appointmentTotal(appt) - partsCost;

  return (
    <div className="space-y-4">
      <Section title="Customer">
        <div className="grid gap-3 sm:grid-cols-2">
          <Detail label="Name" value={appt.customerName} />
          <Detail label="Email" value={appt.email || "-"} />
          <Detail
            label="Phone"
            value={appt.phone || "-"}
            valueContent={
              appt.phone ? (
                <a
                  href={`tel:${phoneHref(appt.phone)}`}
                  className="font-bold text-primary hover:underline"
                >
                  {appt.phone}
                </a>
              ) : undefined
            }
          />
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
          <Detail label="Start Time" value={formatDateTime(appt.scheduledDate)} />
          <Detail label="End Time" value={appt.endDate ? formatDateTime(appt.endDate) : "-"} />
          <Detail label="Coupon Code" value={appt.couponCode || "-"} />
          <Detail label="Apt / Unit / Floor" value={appt.unit || "-"} />
        </div>
        <div className="mt-3">
          <Detail label="Description" value={appt.description || "-"} />
        </div>
      </Section>

      <AgreementSection appt={appt} onAgreementChange={onAgreementChange} />

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
            href={`https://maps.apple.com/?q=${encodeURIComponent(
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

function AgreementSection({
  appt,
  onAgreementChange,
}: {
  appt: Appointment;
  onAgreementChange: (updates: Partial<Appointment>) => void;
}) {
  const [open, setOpen] = useState(false);
  const signed = Boolean(appt.agreementSignedAt);

  const clearAgreement = () => {
    onAgreementChange({
      agreementSignature: undefined,
      agreementSignerName: undefined,
      agreementSignedAt: undefined,
    });
  };

  return (
    <>
      <section
        className={
          signed
            ? "rounded-xl border border-success/50 bg-success/10 p-4 shadow-[0_0_0_1px_rgba(34,197,94,0.12)] sm:p-6"
            : "rounded-xl border border-primary/40 bg-primary/10 p-4 shadow-[0_0_0_1px_rgba(250,166,26,0.12)] sm:p-6"
        }
      >
        {signed ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <div className="min-w-0">
                  <h2 className="font-bold text-success">Agreement Signed</h2>
                  <p className="text-xs text-muted-foreground">
                    Signed by {appt.agreementSignerName || appt.customerName || "customer"} on{" "}
                    {formatSignedAt(appt.agreementSignedAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  className="bg-success text-white hover:bg-success/90"
                  onClick={() => setOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Re-Sign
                </Button>
                <Button type="button" variant="outline" onClick={clearAgreement}>
                  Clear
                </Button>
              </div>
            </div>
            {appt.agreementSignature ? (
              <div className="rounded-lg bg-white p-3">
                <img
                  src={appt.agreementSignature}
                  alt="Saved customer signature"
                  className="h-24 w-full object-contain"
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Pencil className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-primary">Signature Pending</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Customer has not signed the repair agreement yet.
              </p>
              <Button
                type="button"
                className="mt-4 h-11 w-full px-6 text-base font-semibold sm:w-auto"
                onClick={() => setOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                Sign Agreement
              </Button>
            </div>
          </div>
        )}
      </section>
      <AgreementModal
        appt={appt}
        open={open}
        onOpenChange={setOpen}
        onSave={(updates) => {
          onAgreementChange(updates);
          setOpen(false);
        }}
      />
    </>
  );
}

function AgreementModal({
  appt,
  open,
  onOpenChange,
  onSave,
}: {
  appt: Appointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<Appointment>) => void;
}) {
  const signatureRef = useRef<SVGSVGElement | null>(null);
  const drawingRef = useRef(false);
  const [signatureSize, setSignatureSize] = useState({ width: 720, height: 160 });
  const [signaturePaths, setSignaturePaths] = useState<string[]>([]);
  const [activeSignaturePath, setActiveSignaturePath] = useState("");
  const [signerName, setSignerName] = useState(appt.customerName);
  const [signedDate, setSignedDate] = useState(formatAgreementDate(new Date()));
  const [hasSignature, setHasSignature] = useState(Boolean(appt.agreementSignature));

  useEffect(() => {
    if (!open) return;

    setSignerName(appt.agreementSignerName || appt.customerName);
    setSignedDate(formatAgreementDate(new Date()));
    setHasSignature(Boolean(appt.agreementSignature));
    setSignaturePaths([]);
    setActiveSignaturePath("");

    const frame = window.requestAnimationFrame(() => {
      const rect = signatureRef.current?.getBoundingClientRect();
      if (!rect) return;

      setSignatureSize({ width: Math.max(rect.width, 1), height: Math.max(rect.height, 160) });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [appt.agreementSignature, appt.agreementSignerName, appt.customerName, open]);

  const clearSignature = () => {
    drawingRef.current = false;
    setSignaturePaths([]);
    setActiveSignaturePath("");
    setHasSignature(false);
  };

  const saveSignature = () => {
    const now = new Date();
    const paths = activeSignaturePath ? [...signaturePaths, activeSignaturePath] : signaturePaths;
    const nextSignature =
      paths.length > 0
        ? signatureSvgDataUrl(paths, signatureSize)
        : hasSignature
          ? appt.agreementSignature
          : undefined;

    onSave({
      agreementSignature: nextSignature,
      agreementSignerName: signerName.trim() || appt.customerName,
      agreementSignedAt: now.toISOString(),
    });
  };

  const startSignature = (point: { x: number; y: number }) => {
    setActiveSignaturePath(`M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
    drawingRef.current = true;
    setHasSignature(true);
  };

  const continueSignature = (point: { x: number; y: number }) => {
    if (!drawingRef.current) return;

    setActiveSignaturePath((path) => `${path} L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
  };

  const stopSignature = () => {
    if (!drawingRef.current) return;

    drawingRef.current = false;
    setActiveSignaturePath((path) => {
      if (!path) return "";
      setSignaturePaths((paths) => [...paths, path]);
      return "";
    });
  };

  const beginMouseSignature = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    event.stopPropagation();
    startSignature(signaturePointFromClient(event.currentTarget, event.clientX, event.clientY));
  };

  const drawMouseSignature = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!drawingRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    continueSignature(signaturePointFromClient(event.currentTarget, event.clientX, event.clientY));
  };

  const endMouseSignature = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!drawingRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    continueSignature(signaturePointFromClient(event.currentTarget, event.clientX, event.clientY));
    stopSignature();
  };

  const beginTouchSignature = (event: React.TouchEvent<SVGSVGElement>) => {
    const touch = event.touches[0];
    if (!touch) return;

    event.preventDefault();
    event.stopPropagation();
    startSignature(signaturePointFromClient(event.currentTarget, touch.clientX, touch.clientY));
  };

  const drawTouchSignature = (event: React.TouchEvent<SVGSVGElement>) => {
    const touch = event.touches[0];
    if (!touch || !drawingRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    continueSignature(signaturePointFromClient(event.currentTarget, touch.clientX, touch.clientY));
  };

  const endTouchSignature = (event: React.TouchEvent<SVGSVGElement>) => {
    if (!drawingRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    stopSignature();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-3xl gap-0 overflow-hidden border-slate-200 bg-white p-0 text-slate-950 sm:rounded-lg">
        <DialogHeader className="border-b border-slate-200 px-5 py-4 text-left">
          <DialogTitle className="font-serif text-xl font-bold text-slate-950">
            iFixOrlando CellPhone Repair Authorization
          </DialogTitle>
          <DialogDescription className="sr-only">
            Repair authorization agreement with warranty terms and optional signature fields.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(92vh-8.5rem)] overflow-y-auto px-5 py-5 text-sm leading-relaxed text-slate-900">
          <div className="space-y-5">
            <p>
              <strong>Warranty Terms:</strong> Limited Lifetime Warranty provided on all repair and
              parts.
            </p>
            <p>
              <strong>Warranty Covers:</strong> Defective parts by iFixOrlando. Warranty provided
              only on the parts that was replaced during repair by iFixOrlando.
            </p>
            <p>
              <strong>Warranty Does Not Cover:</strong> Cracks, physical damage to external and
              internal parts of repaired device. Damage due to moisture, liquid, extreme humidity,
              sand, food, dirt or similar substances.
            </p>
            <p>
              Any part that gets replaced will have our store warranty sticker or identification. If
              the sticker or identification has been altered, deleted, duplicated, removed, or made
              illegible, iFixOrlando has the right to refuse any no-cost warranty related repairs.
            </p>
            <p>
              <strong>Terms & Conditions:</strong> All sales are final. No returns unless the item
              is defective and can not be repaired or replaced. No returns provided for parts
              purchased without installation. If defected or malfunction, valid for replacement
              only. Must be returned in the same condition as it was received. (See bottom of page
              for additional details)
            </p>

            <div>
              <p className="mb-2 font-semibold">
                Please sign here:{" "}
                <span className="font-normal italic text-slate-500">- optional</span>
              </p>
              <div className="relative rounded-md border border-dashed border-slate-400 bg-white">
                <svg
                  ref={signatureRef}
                  viewBox={`0 0 ${signatureSize.width} ${signatureSize.height}`}
                  className="block h-40 w-full cursor-crosshair touch-none select-none rounded-md"
                  aria-label="Signature field"
                  role="img"
                  onMouseDown={beginMouseSignature}
                  onMouseMove={drawMouseSignature}
                  onMouseUp={endMouseSignature}
                  onMouseLeave={stopSignature}
                  onTouchStart={beginTouchSignature}
                  onTouchMove={drawTouchSignature}
                  onTouchEnd={endTouchSignature}
                  onTouchCancel={endTouchSignature}
                >
                  <rect width="100%" height="100%" fill="white" />
                  {appt.agreementSignature &&
                  signaturePaths.length === 0 &&
                  !activeSignaturePath ? (
                    <image
                      href={appt.agreementSignature}
                      x="0"
                      y="0"
                      width={signatureSize.width}
                      height={signatureSize.height}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  ) : null}
                  {signaturePaths.map((path, index) => (
                    <path
                      key={`${path}-${index}`}
                      d={path}
                      fill="none"
                      stroke="rgb(15, 23, 42)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />
                  ))}
                  {activeSignaturePath ? (
                    <path
                      d={activeSignaturePath}
                      fill="none"
                      stroke="rgb(15, 23, 42)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />
                  ) : null}
                </svg>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute bottom-2 right-2 border-slate-800 bg-slate-950 text-white hover:bg-slate-800 hover:text-white"
                  onClick={clearSignature}
                >
                  Clear
                </Button>
              </div>
            </div>

            <Field label="Please fill in your name: - optional">
              <Input
                value={signerName}
                onChange={(event) => setSignerName(event.target.value)}
                className="border-slate-300 bg-white text-slate-950"
              />
            </Field>

            <Field label="Please fill date: - optional">
              <Input
                value={signedDate}
                onChange={(event) => setSignedDate(event.target.value)}
                className="border-slate-300 bg-white text-slate-950"
              />
            </Field>

            <div className="space-y-5">
              <p className="font-semibold">Additional Details:</p>
              <p>
                iFixOrlando does not take any responsibility for malfunction of other components of
                the repaired device that may result after the repair has been made.
              </p>
              <p>
                Smartphone or table that has protect or resistance against liquid or water will not
                be water proof or water resistant after providing. Repair service that requires
                device alteration. If the device has come into contact with water or liquid after
                repair service, iFixOrlando does not take any responsibility and it voids the
                warranty.
              </p>
              <p>
                iFixOrlando has the right to refuse any non-cost warranty repairs or replacements if
                any of the warranty terms are not complied.
              </p>
              <p>
                No warranty for parts provided by customer. iFixOrlando is not responsible if device
                has any other defective parts/problems other than the one requested to fix.
                iFixOrlando does not take any responsibility for loss of data/personal information
                that can be caused during the repair. iFixOrlando is not responsible for forgotten
                logins, passwords, locks, iCloud locks and etc.
              </p>
              <p>
                IFixOrlando does not take any responsibilities if any other issue determined on the
                device during a repair or diagnostic beside the one that was requested to be fixed..
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:space-x-2">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="border-slate-300 bg-slate-950 text-white hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={saveSignature}
          >
            Save Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const { smsTemplates, updateSmsTemplate } = useRepairStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const phone = (appt.phone || "").replace(/[^\d+]/g, "");
  const smsHref = (body: string) => `sms:${phone}?&body=${encodeURIComponent(body)}`;
  const messages = smsTemplates
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((template) => ({
      ...template,
      renderedBody: renderSmsTemplate(template.body, appt),
    }));

  const startEditing = (template: SmsTemplate) => {
    setEditingId(template.id);
    setDraftBody(template.body);
  };

  const saveTemplate = (template: SmsTemplate) => {
    updateSmsTemplate(template.id, { body: draftBody });
    setEditingId(null);
    setDraftBody("");
  };

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
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => startEditing(message)}>
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                <Button asChild size="sm" className="glow-primary">
                  <a href={smsHref(message.renderedBody)}>
                    <Send className="mr-1 h-3 w-3" /> Send
                  </a>
                </Button>
              </div>
            </div>
            {editingId === message.id ? (
              <div className="space-y-2">
                <Textarea
                  rows={6}
                  value={draftBody}
                  onChange={(event) => setDraftBody(event.target.value)}
                  className="text-xs leading-relaxed"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setDraftBody("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" className="glow-primary" onClick={() => saveTemplate(message)}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {message.renderedBody}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function renderSmsTemplate(template: string, appt: Appointment) {
  const customerName = appt.customerName || "there";
  const technicianName = appt.technicianName || customerName;
  const deviceModel = cleanModel(appt.iPhoneModel) || "iPhone";
  const appointmentDate = formatLongDate(appt.scheduledDate);
  const startTime = formatTime(appt.scheduledDate);
  const endTime = formatTime(appt.endDate || appt.scheduledDate);
  const signature = "iFixOrlando Support Team\nwww.iFixOrlando.com\n(321) 355-4648";

  const values: Record<string, string> = {
    customerName,
    technicianName,
    deviceModel,
    appointmentDate,
    startTime,
    endTime,
    signature,
  };

  return template.replace(/\{([a-zA-Z0-9]+)\}/g, (match, key: string) => values[key] ?? match);
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
  valueContent,
  valueClassName = "text-foreground",
}: {
  label: string;
  value: string;
  valueContent?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`mt-0.5 text-sm ${valueClassName}`}>{valueContent ?? value}</p>
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

function phoneHref(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function formatDateTime(value: string) {
  return formatAppointmentDetailDateTime(value);
}

function formatLongDate(value: string) {
  return formatBusinessLongDate(value);
}

function formatTime(value: string) {
  return formatBusinessTime(value);
}

function formatAgreementDate(value: Date) {
  return `${value.getMonth() + 1} / ${value.getDate()} / ${value.getFullYear()}`;
}

function signaturePointFromClient(svg: SVGSVGElement, clientX: number, clientY: number) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;

  return {
    x: ((clientX - rect.left) / Math.max(rect.width, 1)) * viewBox.width,
    y: ((clientY - rect.top) / Math.max(rect.height, 1)) * viewBox.height,
  };
}

function signatureSvgDataUrl(paths: string[], size: { width: number; height: number }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}"><rect width="100%" height="100%" fill="white"/>${paths.map(signaturePathMarkup).join("")}</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function signaturePathMarkup(path: string) {
  return `<path d="${path}" fill="none" stroke="rgb(15, 23, 42)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"/>`;
}

function formatSignedAt(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatAppointmentDetailDateTime(value: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const parts = new Map(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TIME_ZONE,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  const day = Number(parts.get("day"));
  const weekday = parts.get("weekday") ?? "";
  const month = parts.get("month") ?? "";
  const year = parts.get("year") ?? "";
  const hour = parts.get("hour") ?? "";
  const minute = parts.get("minute") ?? "";
  const dayPeriod = parts.get("dayPeriod") ?? "";

  return `${weekday} ${month} ${day}${ordinalSuffix(day)}, ${year}, ${hour}:${minute} ${dayPeriod}`;
}

function ordinalSuffix(day: number) {
  const teen = day % 100;

  if (teen >= 11 && teen <= 13) return "th";

  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
