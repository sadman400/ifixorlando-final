import type { D1Database } from "@/lib/cloudflare-types";
import { createId } from "@/lib/id";
import { DEFAULT_PRICING, DEFAULT_STOCKS, type RepairData } from "@/lib/repair-store";
import type { AddOn, Appointment, PricingItem, StockItem } from "@/lib/types";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface AppointmentRow {
  id: string;
  customer_id: string;
  iphone_model: string;
  description: string;
  cost: number;
  charge: number;
  coupon: number;
  scheduled_date: string;
  status: Appointment["status"];
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface AddOnRow {
  appointment_id: string;
  name: string;
  price: number;
}

interface PhotoRow {
  appointment_id: string;
  url: string;
}

interface StockRow {
  id: string;
  iphone_model: string;
  quantity: number;
  cost_per_unit: number;
  low_stock_threshold: number;
}

interface PricingRow {
  id: string;
  iphone_model: string;
  repair_type: string;
  price: number;
  parts_cost: number;
}

function rows<T>(result: { results?: T[] }) {
  return result.results ?? [];
}

export async function getRepairData(db: D1Database): Promise<RepairData> {
  const [customerResult, appointmentResult, addOnResult, photoResult, stockResult, pricingResult] =
    await Promise.all([
      db.prepare("SELECT id, name, phone, email, address FROM customers").all<CustomerRow>(),
      db
        .prepare(
          `SELECT id, customer_id, iphone_model, description, cost, charge, coupon, scheduled_date,
            status, notes, created_at, updated_at, completed_at
           FROM appointments
           ORDER BY scheduled_date DESC`,
        )
        .all<AppointmentRow>(),
      db.prepare("SELECT appointment_id, name, price FROM appointment_addons").all<AddOnRow>(),
      db.prepare("SELECT appointment_id, url FROM appointment_photos").all<PhotoRow>(),
      db
        .prepare(
          `SELECT id, iphone_model, quantity, cost_per_unit, low_stock_threshold
           FROM stock_items
           ORDER BY iphone_model`,
        )
        .all<StockRow>(),
      db
        .prepare(
          `SELECT id, iphone_model, repair_type, price, parts_cost
           FROM pricing_items
           WHERE active = 1
           ORDER BY iphone_model, repair_type`,
        )
        .all<PricingRow>(),
    ]);

  const customers = new Map(rows(customerResult).map((customer) => [customer.id, customer]));

  const addOnsByAppointment = new Map<string, AddOn[]>();
  for (const addOn of rows(addOnResult)) {
    const list = addOnsByAppointment.get(addOn.appointment_id) ?? [];
    list.push({ name: addOn.name, price: Number(addOn.price) || 0 });
    addOnsByAppointment.set(addOn.appointment_id, list);
  }

  const photosByAppointment = new Map<string, string[]>();
  for (const photo of rows(photoResult)) {
    const list = photosByAppointment.get(photo.appointment_id) ?? [];
    list.push(photo.url);
    photosByAppointment.set(photo.appointment_id, list);
  }

  const appointments: Appointment[] = rows(appointmentResult).map((appointment) => {
    const customer = customers.get(appointment.customer_id);

    return {
      id: appointment.id,
      customerName: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      address: customer?.address ?? "",
      iPhoneModel: appointment.iphone_model,
      description: appointment.description,
      cost: Number(appointment.cost) || 0,
      charge: Number(appointment.charge) || 0,
      addOns: addOnsByAppointment.get(appointment.id) ?? [],
      coupon: Number(appointment.coupon) || 0,
      scheduledDate: appointment.scheduled_date,
      status: appointment.status,
      photos: photosByAppointment.get(appointment.id) ?? [],
      notes: appointment.notes ?? undefined,
      createdAt: appointment.created_at,
      updatedAt: appointment.updated_at,
      completedAt: appointment.completed_at ?? undefined,
    };
  });

  const stocks: StockItem[] = rows(stockResult).map((stock) => ({
    id: stock.id,
    iPhoneModel: stock.iphone_model,
    quantity: Number(stock.quantity) || 0,
    costPerUnit: Number(stock.cost_per_unit) || 0,
    lowStockThreshold: Number(stock.low_stock_threshold) || 0,
  }));

  const pricing: PricingItem[] = rows(pricingResult).map((item) => ({
    id: item.id,
    iPhoneModel: item.iphone_model,
    repairType: item.repair_type,
    price: Number(item.price) || 0,
    partsCost: Number(item.parts_cost) || 0,
  }));

  return {
    appointments,
    stocks: stocks.length > 0 ? stocks : DEFAULT_STOCKS,
    pricing: pricing.length > 0 ? pricing : DEFAULT_PRICING,
  };
}

export async function replaceRepairData(db: D1Database, data: RepairData) {
  await db.batch([
    db.prepare("DELETE FROM appointment_photos"),
    db.prepare("DELETE FROM appointment_addons"),
    db.prepare("DELETE FROM appointments"),
    db.prepare("DELETE FROM customers"),
    db.prepare("DELETE FROM stock_items"),
    db.prepare("DELETE FROM pricing_items"),
  ]);

  for (const appointment of data.appointments) {
    await upsertAppointment(db, appointment, "admin-sync");
  }

  if (data.stocks.length > 0) {
    await db.batch(
      data.stocks.map((stock) =>
        db
          .prepare(
            `INSERT INTO stock_items (id, iphone_model, quantity, cost_per_unit, low_stock_threshold)
             VALUES (?1, ?2, ?3, ?4, ?5)`,
          )
          .bind(
            stock.id,
            stock.iPhoneModel,
            stock.quantity,
            stock.costPerUnit,
            stock.lowStockThreshold,
          ),
      ),
    );
  }

  if (data.pricing.length > 0) {
    await db.batch(
      data.pricing.map((item) =>
        db
          .prepare(
            `INSERT INTO pricing_items (id, iphone_model, repair_type, price, parts_cost, active)
             VALUES (?1, ?2, ?3, ?4, ?5, 1)`,
          )
          .bind(item.id, item.iPhoneModel, item.repairType, item.price, item.partsCost),
      ),
    );
  }
}

export async function upsertAppointment(
  db: D1Database,
  appointment: Appointment,
  source = "admin",
) {
  const now = new Date().toISOString();
  const customerId = await getOrCreateCustomer(db, appointment, now);

  await db
    .prepare(
      `INSERT INTO appointments (
        id, customer_id, iphone_model, description, cost, charge, coupon, scheduled_date,
        status, notes, source, created_at, updated_at, completed_at
      )
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
      ON CONFLICT(id) DO UPDATE SET
        customer_id = excluded.customer_id,
        iphone_model = excluded.iphone_model,
        description = excluded.description,
        cost = excluded.cost,
        charge = excluded.charge,
        coupon = excluded.coupon,
        scheduled_date = excluded.scheduled_date,
        status = excluded.status,
        notes = excluded.notes,
        source = excluded.source,
        updated_at = excluded.updated_at,
        completed_at = excluded.completed_at`,
    )
    .bind(
      appointment.id,
      customerId,
      appointment.iPhoneModel,
      appointment.description,
      appointment.cost,
      appointment.charge,
      appointment.coupon,
      appointment.scheduledDate,
      appointment.status,
      appointment.notes ?? null,
      source,
      appointment.createdAt || now,
      appointment.updatedAt || now,
      appointment.completedAt ?? null,
    )
    .run();

  await db
    .prepare("DELETE FROM appointment_addons WHERE appointment_id = ?1")
    .bind(appointment.id)
    .run();
  if (appointment.addOns.length > 0) {
    await db.batch(
      appointment.addOns.map((addOn) =>
        db
          .prepare(
            `INSERT INTO appointment_addons (id, appointment_id, name, price)
             VALUES (?1, ?2, ?3, ?4)`,
          )
          .bind(createId("addon"), appointment.id, addOn.name, addOn.price),
      ),
    );
  }

  await db
    .prepare("DELETE FROM appointment_photos WHERE appointment_id = ?1")
    .bind(appointment.id)
    .run();
  if (appointment.photos.length > 0) {
    await db.batch(
      appointment.photos.map((photoUrl) =>
        db
          .prepare(
            `INSERT INTO appointment_photos (id, appointment_id, storage_key, url, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5)`,
          )
          .bind(createId("photo"), appointment.id, storageKeyFromPhotoUrl(photoUrl), photoUrl, now),
      ),
    );
  }
}

function storageKeyFromPhotoUrl(photoUrl: string) {
  const marker = "/api/photos/";
  const markerIndex = photoUrl.indexOf(marker);

  if (markerIndex >= 0) {
    return decodeURIComponent(photoUrl.slice(markerIndex + marker.length));
  }

  return photoUrl.slice(0, 256);
}

async function getOrCreateCustomer(db: D1Database, appointment: Appointment, now: string) {
  const existing = await db
    .prepare(
      `SELECT id FROM customers
       WHERE (phone != '' AND phone = ?1)
          OR (email != '' AND lower(email) = lower(?2))
       LIMIT 1`,
    )
    .bind(appointment.phone, appointment.email)
    .first<{ id: string }>();

  const id = existing?.id ?? createId("customer");

  await db
    .prepare(
      `INSERT INTO customers (id, name, phone, email, address, zip, unit_floor, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, '', '', ?6, ?7)
       ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        phone = excluded.phone,
        email = excluded.email,
        address = excluded.address,
        updated_at = excluded.updated_at`,
    )
    .bind(
      id,
      appointment.customerName,
      appointment.phone,
      appointment.email,
      appointment.address,
      now,
      now,
    )
    .run();

  return id;
}
