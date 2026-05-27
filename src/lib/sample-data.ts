import type { Appointment } from './types';
import { DEFAULT_PRICING, DEFAULT_STOCKS, type RepairData } from './repair-store';

const FIRST = ['Maria', 'James', 'Sofia', 'Carlos', 'Aisha', 'Liam', 'Olivia', 'Noah', 'Emma', 'Lucas'];
const LAST = ['Garcia', 'Smith', 'Johnson', 'Rodriguez', 'Patel', 'Nguyen', 'Brown', 'Davis', 'Martinez', 'Lee'];
const MODELS = ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 14 Pro', 'iPhone 15'];
const ISSUES = [
  'Cracked screen, touch still responsive',
  'Screen black after drop',
  'Battery drains within 2 hours',
  'Charging port loose',
  'Front camera not focusing',
  'Speaker distorted',
];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function id() { return Math.random().toString(36).slice(2, 10); }

export function generateSampleData(): RepairData {
  const now = new Date();
  const appts: Appointment[] = [];

  // Spread across the past 8 months + upcoming
  for (let i = 0; i < 24; i++) {
    const monthOffset = Math.floor(Math.random() * 9) - 1; // -1 (next month) to 7 months ago
    const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, Math.floor(Math.random() * 27) + 1);
    const model = rand(MODELS);
    const charge = 100 + Math.floor(Math.random() * 150);
    const cost = Math.round(charge * (0.35 + Math.random() * 0.2));
    const isPast = date.getTime() < now.getTime();
    const status: Appointment['status'] = isPast
      ? (Math.random() < 0.85 ? 'completed' : 'cancelled')
      : 'scheduled';

    const first = rand(FIRST);
    const last = rand(LAST);
    appts.push({
      id: id(),
      customerName: `${first} ${last}`,
      phone: `407-${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      address: `${100 + Math.floor(Math.random() * 9000)} Orange Ave, Orlando FL`,
      iPhoneModel: model,
      description: rand(ISSUES),
      cost,
      charge,
      addOns: Math.random() < 0.3 ? [{ name: 'Tempered glass', price: 15 }] : [],
      coupon: Math.random() < 0.2 ? 10 : 0,
      scheduledDate: date.toISOString(),
      status,
      photos: [],
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
      completedAt: status === 'completed' ? date.toISOString() : undefined,
    });
  }

  return {
    appointments: appts.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()),
    stocks: DEFAULT_STOCKS,
    pricing: DEFAULT_PRICING,
  };
}
