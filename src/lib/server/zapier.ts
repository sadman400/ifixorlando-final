import { createId } from "@/lib/id";
import type { AddOn, Appointment } from "@/lib/types";

function pick(payload: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

function money(value: string) {
  const normalized = value.replace(/[$,]/g, "").trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function parseAddOns(value: string): AddOn[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((name) => ({ name, price: 0 }));
}

export function appointmentFromZapierPayload(payload: Record<string, unknown>): Appointment {
  const now = new Date().toISOString();
  const addOns = parseAddOns(pick(payload, "Add Ons", "add_ons", "addons"));
  const servicesCost = money(pick(payload, "Services Cost", "Service Cost", "services_cost"));
  const servicesCharge = money(
    pick(payload, "Services Charge", "Service Charge", "services_charge", "charge", "price"),
  );
  const couponValue = pick(
    payload,
    "Consumers Additional Fields Coupon",
    "Additional Fields Coupon",
    "consumers_additionalFields_Coupon Code:",
    "consumers_additionalFields_Coupon Code",
    "consumers_additional_fields_coupon",
    "coupon",
  );
  const couponAmount = money(couponValue);
  const description = pick(
    payload,
    "Services Descriptions",
    "Services Description",
    "services_descriptions",
    "services_description",
    "service_description",
    "description",
  );

  return {
    id: createId("appointment"),
    customerName: pick(
      payload,
      "Consumers Name",
      "Consumer Name",
      "consumers_name",
      "customer_name",
      "name",
    ),
    phone: pick(
      payload,
      "Consumers Mobile",
      "Consumer Mobile",
      "consumers_mobile",
      "phone",
      "mobile",
    ),
    email: pick(
      payload,
      "Consumers Email",
      "Consumer Email",
      "consumers_email",
      "email",
    ),
    address: pick(
      payload,
      "Consumers Address Line 1",
      "consumers_address_line1",
      "consumers_address_line_1",
      "address",
      "address_line_1",
    ),
    iPhoneModel: pick(
      payload,
      "Services Title",
      "Service Title",
      "services_title",
      "service_title",
      "device_model",
      "iphone_model",
    ),
    description,
    cost: money(pick(payload, "Parts Cost", "parts_cost", "internal_cost")),
    charge: servicesCharge || servicesCost,
    addOns,
    coupon: couponAmount,
    scheduledDate: parseDate(pick(payload, "Start", "start", "scheduled_start", "scheduledDate")),
    status: "scheduled",
    photos: [],
    notes: [
      pick(payload, "Consumers Address Zip", "consumers_address_zip", "zip") &&
        `ZIP: ${pick(payload, "Consumers Address Zip", "consumers_address_zip", "zip")}`,
      pick(payload, "Consumers Unit Floor", "consumers_unit_floor", "unit_floor") &&
        `Unit/Floor: ${pick(payload, "Consumers Unit Floor", "consumers_unit_floor", "unit_floor")}`,
      pick(payload, "Technician Notes", "technician_notes") &&
        `Technician Notes: ${pick(payload, "Technician Notes", "technician_notes")}`,
      couponValue && !couponAmount && `Coupon Code: ${couponValue}`,
      pick(payload, "End", "end", "scheduled_end") &&
        `End: ${pick(payload, "End", "end", "scheduled_end")}`,
    ]
      .filter(Boolean)
      .join("\n"),
    createdAt: now,
    updatedAt: now,
  };
}
