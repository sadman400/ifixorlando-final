import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { createId } from "@/lib/id";
import { useRepairStore } from "@/lib/repair-store";
import type { StockItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/stocks")({
  component: Stocks,
});

function Stocks() {
  const { stocks, addStock, updateStock, deleteStock } = useRepairStore();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({
    iPhoneModel: "",
    quantity: 0,
    costPerUnit: 0,
    lowStockThreshold: 3,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.iPhoneModel.trim()) return;
    addStock({ id: createId("stock"), ...draft, iPhoneModel: draft.iPhoneModel.trim() });
    setDraft({ iPhoneModel: "", quantity: 0, costPerUnit: 0, lowStockThreshold: 3 });
    setShowForm(false);
  };

  const totalValue = stocks.reduce((s, x) => s + x.quantity * x.costPerUnit, 0);
  const lowStock = stocks.filter((s) => s.quantity <= s.lowStockThreshold);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Screen Stock
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stocks.length} models tracked · Inventory value ${totalValue.toFixed(2)}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Add Screen
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-medium">Low stock alert</p>
            <p className="text-xs opacity-90">{lowStock.map((s) => s.iPhoneModel).join(", ")}</p>
          </div>
        </div>
      )}

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
              placeholder="e.g. iPhone 15 Pro"
            />
          </div>
          <div>
            <Label className="text-xs">Quantity</Label>
            <Input
              type="number"
              min="0"
              value={draft.quantity}
              onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Cost / Unit</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={draft.costPerUnit}
              onChange={(e) => setDraft({ ...draft, costPerUnit: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Low Threshold</Label>
            <Input
              type="number"
              min="0"
              value={draft.lowStockThreshold}
              onChange={(e) => setDraft({ ...draft, lowStockThreshold: Number(e.target.value) })}
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

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Model</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">Cost / Unit</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">Low Threshold</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => (
              <StockRow
                key={s.id}
                s={s}
                onUpdate={(u) => updateStock(s.id, u)}
                onDelete={() => deleteStock(s.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockRow({
  s,
  onUpdate,
  onDelete,
}: {
  s: StockItem;
  onUpdate: (u: Partial<StockItem>) => void;
  onDelete: () => void;
}) {
  const low = s.quantity <= s.lowStockThreshold;
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3 font-medium text-foreground">{s.iPhoneModel}</td>
      <td className="px-4 py-3 text-right">
        <Input
          type="number"
          min="0"
          value={s.quantity}
          onChange={(e) => onUpdate({ quantity: Number(e.target.value) })}
          className={`ml-auto h-8 w-20 text-right ${low ? "text-warning" : ""}`}
        />
      </td>
      <td className="hidden px-4 py-3 text-right sm:table-cell">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={s.costPerUnit}
          onChange={(e) => onUpdate({ costPerUnit: Number(e.target.value) })}
          className="ml-auto h-8 w-24 text-right"
        />
      </td>
      <td className="hidden px-4 py-3 text-right sm:table-cell">
        <Input
          type="number"
          min="0"
          value={s.lowStockThreshold}
          onChange={(e) => onUpdate({ lowStockThreshold: Number(e.target.value) })}
          className="ml-auto h-8 w-20 text-right"
        />
      </td>
      <td className="px-4 py-3 text-right font-semibold text-foreground">
        ${(s.quantity * s.costPerUnit).toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
