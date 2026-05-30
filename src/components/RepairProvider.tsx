import { useState, useCallback, useEffect, type ReactNode } from "react";
import { fetchRepairData, saveRepairData } from "@/lib/api-client";
import {
  RepairContext,
  loadStore,
  saveStore,
  DEFAULT_PRICING,
  DEFAULT_STOCKS,
  type RepairData,
} from "@/lib/repair-store";
import { findStockForAppointment } from "@/lib/inventory";
import { generateSampleData } from "@/lib/sample-data";
import type { Appointment, StockItem, PricingItem, AppointmentStatus } from "@/lib/types";

export function RepairProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(() => loadStore());
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    fetchRepairData()
      .then((serverData) => {
        setData(serverData);
        saveStore(serverData);
        setBackendAvailable(true);
      })
      .catch(() => setBackendAvailable(false));
  }, []);

  const persist = useCallback(
    (next: RepairData) => {
      saveStore(next);

      if (backendAvailable) {
        saveRepairData(next).catch((error) => {
          console.error("Failed to persist repair data to backend", error);
        });
      }

      return next;
    },
    [backendAvailable],
  );

  const addAppointment = useCallback(
    (a: Appointment) => {
      setData((prev) => persist({ ...prev, appointments: [a, ...prev.appointments] }));
    },
    [persist],
  );

  const updateAppointment = useCallback(
    (id: string, updates: Partial<Appointment>) => {
      setData((prev) =>
        persist({
          ...prev,
          appointments: prev.appointments.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a,
          ),
        }),
      );
    },
    [persist],
  );

  const updateStatus = useCallback(
    (id: string, status: AppointmentStatus) => {
      setData((prev) => persist(applyStatusUpdate(prev, id, status)));
    },
    [persist],
  );

  const deleteAppointment = useCallback(
    (id: string) => {
      setData((prev) =>
        persist({ ...prev, appointments: prev.appointments.filter((a) => a.id !== id) }),
      );
    },
    [persist],
  );

  const getAppointment = useCallback(
    (id: string) => data.appointments.find((a) => a.id === id),
    [data.appointments],
  );

  const addStock = useCallback(
    (s: StockItem) => {
      setData((prev) => persist({ ...prev, stocks: [...prev.stocks, s] }));
    },
    [persist],
  );
  const updateStock = useCallback(
    (id: string, updates: Partial<StockItem>) => {
      setData((prev) =>
        persist({
          ...prev,
          stocks: prev.stocks.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }),
      );
    },
    [persist],
  );
  const deleteStock = useCallback(
    (id: string) => {
      setData((prev) => persist({ ...prev, stocks: prev.stocks.filter((s) => s.id !== id) }));
    },
    [persist],
  );
  const reorderStocks = useCallback(
    (stocks: StockItem[]) => {
      setData((prev) =>
        persist({
          ...prev,
          stocks: stocks.map((stock, index) => ({ ...stock, sortOrder: index })),
        }),
      );
    },
    [persist],
  );

  const addPricing = useCallback(
    (p: PricingItem) => {
      setData((prev) => persist({ ...prev, pricing: [...prev.pricing, p] }));
    },
    [persist],
  );
  const updatePricing = useCallback(
    (id: string, updates: Partial<PricingItem>) => {
      setData((prev) =>
        persist({
          ...prev,
          pricing: prev.pricing.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }),
      );
    },
    [persist],
  );
  const deletePricing = useCallback(
    (id: string) => {
      setData((prev) => persist({ ...prev, pricing: prev.pricing.filter((p) => p.id !== id) }));
    },
    [persist],
  );
  const reorderPricing = useCallback(
    (pricing: PricingItem[]) => {
      setData((prev) =>
        persist({
          ...prev,
          pricing: pricing.map((item, index) => ({ ...item, sortOrder: index })),
        }),
      );
    },
    [persist],
  );

  const seedSampleData = useCallback(() => {
    const sample = generateSampleData();
    setData(persist(sample));
  }, [persist]);

  const clearAll = useCallback(() => {
    setData(persist({ appointments: [], stocks: DEFAULT_STOCKS, pricing: DEFAULT_PRICING }));
  }, [persist]);

  return (
    <RepairContext.Provider
      value={{
        ...data,
        addAppointment,
        updateAppointment,
        updateStatus,
        deleteAppointment,
        getAppointment,
        addStock,
        updateStock,
        deleteStock,
        reorderStocks,
        addPricing,
        updatePricing,
        deletePricing,
        reorderPricing,
        seedSampleData,
        clearAll,
      }}
    >
      {children}
    </RepairContext.Provider>
  );
}

function applyStatusUpdate(
  data: RepairData,
  appointmentId: string,
  nextStatus: AppointmentStatus,
): RepairData {
  const appointment = data.appointments.find((item) => item.id === appointmentId);

  if (!appointment || appointment.status === nextStatus) {
    return data;
  }

  const quantityDelta =
    appointment.status !== "completed" && nextStatus === "completed"
      ? -1
      : appointment.status === "completed" && nextStatus !== "completed"
        ? 1
        : 0;
  const stockMatch = quantityDelta ? findStockForAppointment(data.stocks, appointment) : undefined;
  const stockId = stockMatch?.id;
  const nextCost =
    nextStatus === "completed" && appointment.cost <= 0 && stockMatch?.costPerUnit
      ? stockMatch.costPerUnit
      : appointment.cost;
  const now = new Date().toISOString();

  return {
    ...data,
    appointments: data.appointments.map((item) =>
      item.id === appointmentId
        ? {
            ...item,
            status: nextStatus,
            cost: nextCost,
            updatedAt: now,
            completedAt: nextStatus === "completed" ? now : undefined,
          }
        : item,
    ),
    stocks:
      stockId && quantityDelta
        ? data.stocks.map((stock) =>
            stock.id === stockId
              ? {
                  ...stock,
                  quantity: Math.max(0, stock.quantity + quantityDelta),
                }
              : stock,
          )
        : data.stocks,
  };
}
