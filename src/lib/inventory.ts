import type { Appointment, StockItem } from "@/lib/types";

export function cleanInventoryModel(value: string) {
  return value.replace(/\s+-?\s*(black|white)\s+screen\b/i, "").trim();
}

export function screenColorNameFromText(value: string) {
  const source = value.toLowerCase();
  if (/\bwhite\s+screen\b/.test(source)) return "White";
  if (/\bblack\s+screen\b/.test(source)) return "Black";

  return "";
}

export function screenColorNameFor(value: {
  iPhoneModel: string;
  screenColor?: string;
  description?: string;
}) {
  if (value.screenColor) return value.screenColor.replace(/\s+screen$/i, "");

  return screenColorNameFromText(`${value.iPhoneModel} ${value.description || ""}`);
}

export function screenColorLabelFor(value: {
  iPhoneModel: string;
  screenColor?: string;
  description?: string;
}) {
  const color = screenColorNameFor(value);
  return color ? `${color} Screen` : "";
}

export function appointmentLabel(appt: Appointment) {
  const screenColor = screenColorLabelFor(appt);

  return [
    cleanInventoryModel(appt.iPhoneModel),
    screenColor && `${screenColor.replace(/\s+screen$/i, "")} Screen`,
  ]
    .filter(Boolean)
    .join(" - ");
}

export function findStockForAppointment(stocks: StockItem[], appointment: Appointment) {
  const normalizedModel = normalize(cleanInventoryModel(appointment.iPhoneModel));
  const normalizedColor = normalize(screenColorNameFor(appointment));

  const sameModel = stocks.filter(
    (stock) => normalize(cleanInventoryModel(stock.iPhoneModel)) === normalizedModel,
  );

  if (normalizedColor) {
    const exactColor = sameModel.find(
      (stock) => normalize(screenColorNameFor(stock)) === normalizedColor,
    );

    if (exactColor) return exactColor;

    return sameModel.find((stock) => !normalize(screenColorNameFor(stock)));
  }

  return sameModel.find((stock) => !normalize(screenColorNameFor(stock))) ?? sameModel[0];
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
