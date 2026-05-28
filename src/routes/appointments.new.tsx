import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { businessDateTimeLocalToIso, toBusinessDateTimeLocal } from "@/lib/date-time";
import { createId } from "@/lib/id";
import { cleanInventoryModel } from "@/lib/inventory";
import { useRepairStore } from "@/lib/repair-store";
import type { AddOn, Appointment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/appointments/new")({
  component: NewAppointment,
});

function NewAppointment() {
  const { addAppointment, pricing, stocks } = useRepairStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    iPhoneModel: "iPhone 14",
    screenColor: "Black",
    description: "",
    cost: 0,
    charge: 0,
    coupon: 0,
    scheduledDate: toBusinessDateTimeLocal(new Date().toISOString()),
  });
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const stockModels = useMemo(
    () => [...new Set(stocks.map((stock) => cleanInventoryModel(stock.iPhoneModel)))],
    [stocks],
  );

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const applyPricingPreset = (model: string) => {
    setField("iPhoneModel", model);
    const cleanedModel = cleanInventoryModel(model);
    const match = pricing.find((p) => cleanInventoryModel(p.iPhoneModel) === cleanedModel);
    if (match) {
      setField("charge", match.price);
      setField("cost", match.partsCost);
    }
  };

  const addOnTotal = addOns.reduce((s, x) => s + x.price, 0);
  const total = Math.max(0, form.charge + addOnTotal - form.coupon);
  const profit = total - form.cost;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) return;

    const appt: Appointment = {
      id: createId("appointment"),
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      iPhoneModel: `${cleanInventoryModel(form.iPhoneModel)} - ${form.screenColor} Screen`,
      screenColor: form.screenColor,
      description: form.description.trim(),
      cost: Number(form.cost) || 0,
      charge: Number(form.charge) || 0,
      coupon: Number(form.coupon) || 0,
      addOns,
      scheduledDate: businessDateTimeLocalToIso(form.scheduledDate),
      status: "scheduled",
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addAppointment(appt);
    navigate({ to: "/appointments/$id", params: { id: appt.id } });
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          New Appointment
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Schedule a new repair job</p>
      </div>

      <section className="glass-card space-y-4 rounded-xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Customer
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer Name *">
            <Input
              required
              value={form.customerName}
              onChange={(e) => setField("customerName", e.target.value)}
            />
          </Field>
          <Field label="Phone Number">
            <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={(e) => setField("address", e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="glass-card space-y-4 rounded-xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Device & Issue
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="iPhone Model">
            <Input
              list="iphone-models"
              value={form.iPhoneModel}
              onChange={(e) => applyPricingPreset(e.target.value)}
              placeholder="Select or type model"
            />
            <datalist id="iphone-models">
              {stockModels.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
          </Field>
          <Field label="Screen Color">
            <div className="flex gap-2">
              {["Black", "White"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setField("screenColor", color)}
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
          <Field label="Scheduled Date">
            <Input
              type="datetime-local"
              value={form.scheduledDate}
              onChange={(e) => setField("scheduledDate", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Description / Issue">
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </Field>
      </section>

      <section className="glass-card space-y-4 rounded-xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Pricing
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Charge ($)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.charge}
              onChange={(e) => setField("charge", Number(e.target.value))}
            />
          </Field>
          <Field label="Parts Cost ($)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.cost}
              onChange={(e) => setField("cost", Number(e.target.value))}
            />
          </Field>
          <Field label="Coupon ($)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.coupon}
              onChange={(e) => setField("coupon", Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Add-ons</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setAddOns([...addOns, { name: "", price: 0 }])}
            >
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>
          {addOns.map((a, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Add-on name"
                value={a.name}
                onChange={(e) => {
                  const next = [...addOns];
                  next[i] = { ...next[i], name: e.target.value };
                  setAddOns(next);
                }}
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                className="w-28"
                value={a.price}
                onChange={(e) => {
                  const next = [...addOns];
                  next[i] = { ...next[i], price: Number(e.target.value) };
                  setAddOns(next);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setAddOns(addOns.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1 border-t border-border pt-4 text-sm sm:flex-row sm:justify-end sm:gap-6">
          <p className="text-muted-foreground">
            Total: <span className="font-semibold text-foreground">${total.toFixed(2)}</span>
          </p>
          <p className="text-muted-foreground">
            Profit: <span className="font-semibold text-success">${profit.toFixed(2)}</span>
          </p>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/appointments" })}>
          Cancel
        </Button>
        <Button type="submit" className="glow-primary">
          Create Appointment
        </Button>
      </div>
    </form>
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
