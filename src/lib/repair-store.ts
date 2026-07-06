import { createContext, useContext } from "react";
import type { Appointment, StockItem, PricingItem, SmsTemplate, AppointmentStatus } from "./types";

const STORAGE_KEY = "ifixorlando-data";

export interface RepairData {
  appointments: Appointment[];
  stocks: StockItem[];
  pricing: PricingItem[];
  smsTemplates: SmsTemplate[];
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
  reorderPricing: (pricing: PricingItem[]) => void;

  updateSmsTemplate: (id: string, updates: Partial<SmsTemplate>) => void;

  clearAll: () => void;
}

export const DEFAULT_PRICING: PricingItem[] = [
  { id: "p8", iPhoneModel: "iPhone 8", repairType: "Screen Replacement", price: 90, partsCost: 35 },
  {
    id: "p11",
    iPhoneModel: "iPhone 11",
    repairType: "Screen Replacement",
    price: 110,
    partsCost: 45,
  },
  {
    id: "p12",
    iPhoneModel: "iPhone 12",
    repairType: "Screen Replacement",
    price: 140,
    partsCost: 60,
  },
  {
    id: "p13",
    iPhoneModel: "iPhone 13",
    repairType: "Screen Replacement",
    price: 160,
    partsCost: 75,
  },
  {
    id: "p14",
    iPhoneModel: "iPhone 14",
    repairType: "Screen Replacement",
    price: 180,
    partsCost: 90,
  },
  {
    id: "p15",
    iPhoneModel: "iPhone 15",
    repairType: "Screen Replacement",
    price: 220,
    partsCost: 110,
  },
  {
    id: "p16",
    iPhoneModel: "iPhone 16",
    repairType: "Screen Replacement",
    price: 250,
    partsCost: 130,
  },
  {
    id: "p17",
    iPhoneModel: "iPhone 17",
    repairType: "Screen Replacement",
    price: 280,
    partsCost: 150,
  },
];

export const DEFAULT_STOCKS: StockItem[] = [
  { id: "s1", iPhoneModel: "iPhone 11", quantity: 6, costPerUnit: 45, lowStockThreshold: 3 },
  { id: "s2", iPhoneModel: "iPhone 12", quantity: 4, costPerUnit: 60, lowStockThreshold: 3 },
  { id: "s3", iPhoneModel: "iPhone 13", quantity: 3, costPerUnit: 75, lowStockThreshold: 3 },
  { id: "s4", iPhoneModel: "iPhone 14", quantity: 2, costPerUnit: 90, lowStockThreshold: 3 },
  { id: "s5", iPhoneModel: "iPhone 15", quantity: 1, costPerUnit: 110, lowStockThreshold: 2 },
];

export const DEFAULT_SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: "sms-confirmation",
    key: "confirmation",
    label: "Confirmation",
    body: "iFixOrlando:\nThank you for booking your repair {customerName}. Your {deviceModel} repair is confirmed and scheduled for {appointmentDate} at {startTime}.\n\nFor your convenience, we will notify you with updates regarding your appointment via sms text messages. Thank you for choosing us, and we look forward to seeing you soon!\n\n{signature}",
    sortOrder: 0,
  },
  {
    id: "sms-reminder",
    key: "reminder",
    label: "Reminder",
    body: "iFixOrlando:\nHello {customerName}. Just a friendly reminder about your scheduled {deviceModel} repair appointment for today at {startTime}.\n\nWe'll notify you as soon as your technician is en route.\n\n{signature}",
    sortOrder: 1,
  },
  {
    id: "sms-en-route",
    key: "en-route",
    label: "En Route",
    body: "iFixOrlando:\nGood news {customerName}! {technicianName} is currently en route to your location for your scheduled iPhone repair appointment.\n\nThe estimated time of arrival (ETA) is {startTime}. You will receive a notification once your technician arrives at your location.\n\n{signature}",
    sortOrder: 2,
  },
  {
    id: "sms-arrival",
    key: "arrival",
    label: "Arrival",
    body: "iFixOrlando:\n{technicianName} has arrived to repair your device.\n\nThank you for your business and for choosing iFixOrlando!\n\n{signature}",
    sortOrder: 3,
  },
  {
    id: "sms-appointment-delay",
    key: "appointment-delay",
    label: "Appointment Delay",
    body: "iFixOrlando:\nGood news {customerName}! {technicianName} is currently en route to your location for your scheduled iPhone repair appointment.\n\nPlease note the slight delay. The estimated time of arrival is between {startTime} and {endTime}. We apologize for the delay and look forward to seeing you shortly.\n\n{signature}",
    sortOrder: 4,
  },
  {
    id: "sms-reschedule-request",
    key: "reschedule-request",
    label: "Reschedule Request",
    body: "iFixOrlando:\nWe've successfully rescheduled your {deviceModel} repair appointment to today at {startTime}.\n\nIf you have any further questions or need assistance, feel free to reach out. We look forward to seeing you at {startTime} for your repair.\n\n{signature}",
    sortOrder: 5,
  },
  {
    id: "sms-cancellation",
    key: "cancellation",
    label: "Cancellation",
    body: "iFixOrlando:\nHello {customerName}. Per your request, your scheduled appointment has been canceled.\n\n{signature}",
    sortOrder: 6,
  },
  {
    id: "sms-no-answer",
    key: "no-answer",
    label: "No Answer",
    body: "iFixOrlando:\nHi {customerName}. We are calling regarding an appointment scheduled for an {deviceModel} repair. We are unable to reach you.\n\nPlease give us a call at your earliest opportunity. We look forward to hearing from you.\n\n{signature}",
    sortOrder: 7,
  },
];

export function loadStore(): RepairData {
  if (typeof window === "undefined") {
    return {
      appointments: [],
      stocks: DEFAULT_STOCKS,
      pricing: DEFAULT_PRICING,
      smsTemplates: DEFAULT_SMS_TEMPLATES,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        appointments: parsed.appointments || [],
        stocks: parsed.stocks || DEFAULT_STOCKS,
        pricing: parsed.pricing || DEFAULT_PRICING,
        smsTemplates: parsed.smsTemplates || DEFAULT_SMS_TEMPLATES,
      };
    }
  } catch {}
  return {
    appointments: [],
    stocks: DEFAULT_STOCKS,
    pricing: DEFAULT_PRICING,
    smsTemplates: DEFAULT_SMS_TEMPLATES,
  };
}

export function saveStore(data: RepairData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const RepairContext = createContext<RepairStore | null>(null);

export function useRepairStore(): RepairStore {
  const ctx = useContext(RepairContext);
  if (!ctx) throw new Error("useRepairStore must be used within RepairProvider");
  return ctx;
}
