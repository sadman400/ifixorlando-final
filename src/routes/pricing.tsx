import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { createId } from "@/lib/id";
import { useRepairStore } from "@/lib/repair-store";
import type { PricingItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  component: Pricing,
});

function Pricing() {
  const { pricing, addPricing, updatePricing, deletePricing } = useRepairStore();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({
    iPhoneModel: "",
    repairType: "Screen Replacement",
    price: 0,
    partsCost: 0,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.iPhoneModel.trim()) return;
    addPricing({
      id: createId("pricing"),
      ...draft,
      iPhoneModel: draft.iPhoneModel.trim(),
      repairType: draft.repairType.trim(),
    });
    setDraft({ iPhoneModel: "", repairType: "Screen Replacement", price: 0, partsCost: 0 });
    setShowForm(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Pricing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Service catalog with retail price and parts cost
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Add Service
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="glass-card grid gap-3 rounded-xl p-4 sm:grid-cols-5 sm:p-6"
        >
          <div className="sm:col-span-2">
            <Label className="text-xs">iPhone Model</Label>
            <Input
              value={draft.iPhoneModel}
              onChange={(e) => setDraft({ ...draft, iPhoneModel: e.target.value })}
              placeholder="e.g. iPhone 15"
            />
          </div>
          <div>
            <Label className="text-xs">Repair Type</Label>
            <Input
              value={draft.repairType}
              onChange={(e) => setDraft({ ...draft, repairType: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Price ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Parts Cost ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={draft.partsCost}
              onChange={(e) => setDraft({ ...draft, partsCost: Number(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...pricing]
          .sort((a, b) => {
            const na = parseInt(a.iPhoneModel.replace(/\D/g, ""), 10) || 0;
            const nb = parseInt(b.iPhoneModel.replace(/\D/g, ""), 10) || 0;
            return na - nb;
          })
          .map((p) => (
            <PricingCard
              key={p.id}
              p={p}
              onUpdate={(u) => updatePricing(p.id, u)}
              onDelete={() => deletePricing(p.id)}
            />
          ))}
      </div>
    </div>
  );
}

function PricingCard({
  p,
  onUpdate,
  onDelete,
}: {
  p: PricingItem;
  onUpdate: (u: Partial<PricingItem>) => void;
  onDelete: () => void;
}) {
  const profit = p.price - p.partsCost;
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{p.iPhoneModel}</p>
          <p className="text-xs text-muted-foreground">{p.repairType}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} className="-mr-2 -mt-1">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Price ($)
          </Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={p.price}
            onChange={(e) => onUpdate({ price: Number(e.target.value) })}
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Parts Cost ($)
          </Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={p.partsCost}
            onChange={(e) => onUpdate({ partsCost: Number(e.target.value) })}
            className="h-9"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Profit</span>
        <span className="text-lg font-bold text-success">${profit.toFixed(2)}</span>
      </div>
    </div>
  );
}
