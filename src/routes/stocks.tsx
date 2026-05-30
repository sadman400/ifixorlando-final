import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { createId } from "@/lib/id";
import { cleanInventoryModel, screenColorLabelFor } from "@/lib/inventory";
import { useRepairStore } from "@/lib/repair-store";
import type { StockItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, AlertTriangle, ArrowDown, ArrowUp } from "lucide-react";

export const Route = createFileRoute("/stocks")({
  component: Stocks,
});

function Stocks() {
  const { stocks, addStock, updateStock, deleteStock, reorderStocks } = useRepairStore();
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({
    iPhoneModel: "",
    screenColor: "Black",
    quantity: 0,
    lowStockThreshold: 3,
  });

  const orderedStocks = orderStocks(stocks);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.iPhoneModel.trim()) return;
    addStock({
      id: createId("stock"),
      iPhoneModel: cleanInventoryModel(draft.iPhoneModel.trim()),
      screenColor: draft.screenColor,
      quantity: draft.quantity,
      costPerUnit: 0,
      lowStockThreshold: draft.lowStockThreshold,
      sortOrder: orderedStocks.length,
    });
    setDraft({ iPhoneModel: "", screenColor: "Black", quantity: 0, lowStockThreshold: 3 });
    setShowForm(false);
  };

  const lowStock = stocks.filter((s) => s.quantity <= s.lowStockThreshold);

  const moveStock = (id: string, direction: -1 | 1) => {
    const currentIndex = orderedStocks.findIndex((stock) => stock.id === id);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= orderedStocks.length) return;

    const next = [...orderedStocks];
    const [moved] = next.splice(currentIndex, 1);
    next.splice(nextIndex, 0, moved);
    reorderStocks(next);
  };

  return (
    <div className="space-y-4 pb-8 sm:space-y-6 md:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Screen Stock
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{stocks.length} screens tracked</p>
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
            <Label className="text-xs">Screen Color</Label>
            <select
              value={draft.screenColor}
              onChange={(e) => setDraft({ ...draft, screenColor: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="White">White Screen</option>
              <option value="Black">Black Screen</option>
            </select>
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

      <div className="max-w-full overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <table className="min-w-[660px] text-sm sm:w-full">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-24 px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">Screen</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">Low Threshold</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orderedStocks.map((s, index) => (
                <StockRow
                  key={s.id}
                  s={s}
                  isFirst={index === 0}
                  isLast={index === orderedStocks.length - 1}
                  onMoveUp={() => moveStock(s.id, -1)}
                  onMoveDown={() => moveStock(s.id, 1)}
                  onUpdate={(u) => updateStock(s.id, u)}
                  onDelete={() => deleteStock(s.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StockRow({
  s,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onDelete,
}: {
  s: StockItem;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (u: Partial<StockItem>) => void;
  onDelete: () => void;
}) {
  const low = s.quantity <= s.lowStockThreshold;
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={isFirst}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={isLast}>
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </td>
      <td className="px-4 py-3 font-medium text-foreground">
        {cleanInventoryModel(s.iPhoneModel)}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{screenColorLabel(s)}</td>
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
          value={s.lowStockThreshold}
          onChange={(e) => onUpdate({ lowStockThreshold: Number(e.target.value) })}
          className="ml-auto h-8 w-20 text-right"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

function orderStocks(stocks: StockItem[]) {
  return stocks
    .map((stock, index) => ({ stock, index }))
    .sort((a, b) => (a.stock.sortOrder ?? a.index) - (b.stock.sortOrder ?? b.index))
    .map(({ stock }) => stock);
}

function screenColorLabel(stock: StockItem) {
  return screenColorLabelFor(stock) || "-";
}
