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
      setData((prev) =>
        persist({
          ...prev,
          appointments: prev.appointments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status,
                  updatedAt: new Date().toISOString(),
                  completedAt: status === "completed" ? new Date().toISOString() : a.completedAt,
                }
              : a,
          ),
        }),
      );
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
        addPricing,
        updatePricing,
        deletePricing,
        seedSampleData,
        clearAll,
      }}
    >
      {children}
    </RepairContext.Provider>
  );
}
