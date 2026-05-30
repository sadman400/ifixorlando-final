export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface AddOn {
  name: string;
  price: number;
}

export interface Appointment {
  id: string;
  // Customer
  customerName: string;
  phone: string;
  email: string;
  address: string;
  zip?: string;
  unit?: string;
  // Device / job
  iPhoneModel: string;
  screenColor?: string;
  description: string;
  technicianName?: string;
  // Pricing
  cost: number; // parts cost (what we paid)
  charge: number; // base service charge
  addOns: AddOn[];
  coupon: number; // discount amount
  couponCode?: string;
  // Scheduling
  scheduledDate: string; // ISO
  endDate?: string;
  status: AppointmentStatus;
  photos: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface StockItem {
  id: string;
  iPhoneModel: string;
  screenColor?: string;
  quantity: number;
  costPerUnit: number;
  lowStockThreshold: number;
  sortOrder?: number;
}

export interface PricingItem {
  id: string;
  iPhoneModel: string;
  repairType: string;
  price: number; // retail
  partsCost: number; // our cost
  sortOrder?: number;
}

export function appointmentTotal(a: Appointment): number {
  const addOnsTotal = a.addOns.reduce((s, x) => s + x.price, 0);
  return Math.max(0, a.charge + addOnsTotal - a.coupon);
}

export function appointmentProfit(a: Appointment): number {
  return appointmentTotal(a) - a.cost;
}
