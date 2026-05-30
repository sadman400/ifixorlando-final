import { z } from "zod";

export const appointmentStatusSchema = z.enum(["scheduled", "completed", "cancelled"]);

export const addOnSchema = z.object({
  name: z.string(),
  price: z.coerce.number().default(0),
});

export const appointmentSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  phone: z.string().default(""),
  email: z.string().default(""),
  address: z.string().default(""),
  zip: z.string().optional(),
  unit: z.string().optional(),
  iPhoneModel: z.string(),
  screenColor: z.string().optional(),
  description: z.string().default(""),
  technicianName: z.string().optional(),
  cost: z.coerce.number().default(0),
  charge: z.coerce.number().default(0),
  addOns: z.array(addOnSchema).default([]),
  coupon: z.coerce.number().default(0),
  couponCode: z.string().optional(),
  scheduledDate: z.string(),
  endDate: z.string().optional(),
  status: appointmentStatusSchema,
  photos: z.array(z.string()).default([]),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
});

export const stockItemSchema = z.object({
  id: z.string(),
  iPhoneModel: z.string(),
  screenColor: z.string().optional(),
  quantity: z.coerce.number().int().default(0),
  costPerUnit: z.coerce.number().default(0),
  lowStockThreshold: z.coerce.number().int().default(0),
  sortOrder: z.coerce.number().int().optional(),
});

export const pricingItemSchema = z.object({
  id: z.string(),
  iPhoneModel: z.string(),
  repairType: z.string(),
  price: z.coerce.number().default(0),
  partsCost: z.coerce.number().default(0),
  sortOrder: z.coerce.number().int().optional(),
});

export const repairDataSchema = z.object({
  appointments: z.array(appointmentSchema).default([]),
  stocks: z.array(stockItemSchema).default([]),
  pricing: z.array(pricingItemSchema).default([]),
});

export const zapierBookingSchema = z.record(z.unknown());
