import { createContext, useContext } from 'react';
import type { Appointment, StockItem, PricingItem, AppointmentStatus } from './types';

const STORAGE_KEY = 'ifixorlando-data';

export interface RepairData {
  appointments: Appointment[];
  stocks: StockItem[];
  pricing: PricingItem[];
}

export interface RepairStore extends RepairData {
  addAppointment: (a: Appointment) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  updateStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;
  getAppointment: (id: string) => Appointment | undefined;

  addStock: (s: StockItem) => void;
  updateStock: (id: string, updates: Partial<StockItem>) => void;
  deleteStock: (id: string) => void;
  reorderStocks: (stocks: StockItem[]) => void;

  addPricing: (p: PricingItem) => void;
  updatePricing: (id: string, updates: Partial<PricingItem>) => void;
  deletePricing: (id: string) => void;

  seedSampleData: () => void;
  clearAll: () => void;
}

export const DEFAULT_PRICING: PricingItem[] = [
  { id: 'p8', iPhoneModel: 'iPhone 8', repairType: 'Screen Replacement', price: 90, partsCost: 35 },
  { id: 'p11', iPhoneModel: 'iPhone 11', repairType: 'Screen Replacement', price: 110, partsCost: 45 },
  { id: 'p12', iPhoneModel: 'iPhone 12', repairType: 'Screen Replacement', price: 140, partsCost: 60 },
  { id: 'p13', iPhoneModel: 'iPhone 13', repairType: 'Screen Replacement', price: 160, partsCost: 75 },
  { id: 'p14', iPhoneModel: 'iPhone 14', repairType: 'Screen Replacement', price: 180, partsCost: 90 },
  { id: 'p15', iPhoneModel: 'iPhone 15', repairType: 'Screen Replacement', price: 220, partsCost: 110 },
  { id: 'p16', iPhoneModel: 'iPhone 16', repairType: 'Screen Replacement', price: 250, partsCost: 130 },
  { id: 'p17', iPhoneModel: 'iPhone 17', repairType: 'Screen Replacement', price: 280, partsCost: 150 },
];

export const DEFAULT_STOCKS: StockItem[] = [
  { id: 's1', iPhoneModel: 'iPhone 11', quantity: 6, costPerUnit: 45, lowStockThreshold: 3 },
  { id: 's2', iPhoneModel: 'iPhone 12', quantity: 4, costPerUnit: 60, lowStockThreshold: 3 },
  { id: 's3', iPhoneModel: 'iPhone 13', quantity: 3, costPerUnit: 75, lowStockThreshold: 3 },
  { id: 's4', iPhoneModel: 'iPhone 14', quantity: 2, costPerUnit: 90, lowStockThreshold: 3 },
  { id: 's5', iPhoneModel: 'iPhone 15', quantity: 1, costPerUnit: 110, lowStockThreshold: 2 },
];

export function loadStore(): RepairData {
  if (typeof window === 'undefined') {
    return { appointments: [], stocks: DEFAULT_STOCKS, pricing: DEFAULT_PRICING };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        appointments: parsed.appointments || [],
        stocks: parsed.stocks || DEFAULT_STOCKS,
        pricing: parsed.pricing || DEFAULT_PRICING,
      };
    }
  } catch {}
  return { appointments: [], stocks: DEFAULT_STOCKS, pricing: DEFAULT_PRICING };
}

export function saveStore(data: RepairData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const RepairContext = createContext<RepairStore | null>(null);

export function useRepairStore(): RepairStore {
  const ctx = useContext(RepairContext);
  if (!ctx) throw new Error('useRepairStore must be used within RepairProvider');
  return ctx;
}
