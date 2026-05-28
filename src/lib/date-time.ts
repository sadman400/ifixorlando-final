export const BUSINESS_TIME_ZONE = "America/New_York";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
};

const explicitTimeZonePattern = /(?:z|[+-]\d{2}:?\d{2})$/i;

export function parseBusinessDateToIso(value: string, fallback = new Date().toISOString()) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  if (explicitTimeZonePattern.test(trimmed)) {
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
  }

  const parts = parseNaiveDateTime(trimmed);
  if (!parts) return fallback;

  return businessDateTimeToIso(parts);
}

export function businessDateTimeLocalToIso(value: string, fallback = new Date().toISOString()) {
  const parts = parseNaiveDateTime(value);
  return parts ? businessDateTimeToIso(parts) : fallback;
}

export function toBusinessDateTimeLocal(value: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = getParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function formatBusinessDateTime(value: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatBusinessDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatBusinessLongDate(value: string) {
  if (!value) return "[date]";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "[date]";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatBusinessTime(value: string) {
  if (!value) return "[time]";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "[time]";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function businessDateTimeToIso(parts: DateParts) {
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second ?? 0,
  );
  const firstOffset = getTimeZoneOffsetMs(new Date(utcGuess));
  const firstUtc = utcGuess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(new Date(firstUtc));

  return new Date(utcGuess - secondOffset).toISOString();
}

function parseNaiveDateTime(value: string): DateParts | null {
  const isoMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i,
  );

  if (isoMatch) {
    return normalizeParts({
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3]),
      hour: Number(isoMatch[4] ?? 0),
      minute: Number(isoMatch[5] ?? 0),
      second: Number(isoMatch[6] ?? 0),
      meridiem: isoMatch[7],
    });
  }

  const usMatch = value.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i,
  );

  if (usMatch) {
    return normalizeParts({
      year: Number(usMatch[3]),
      month: Number(usMatch[1]),
      day: Number(usMatch[2]),
      hour: Number(usMatch[4] ?? 0),
      minute: Number(usMatch[5] ?? 0),
      second: Number(usMatch[6] ?? 0),
      meridiem: usMatch[7],
    });
  }

  const monthNameMatch = value.match(
    /^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?/i,
  );

  if (monthNameMatch) {
    const month = MONTHS[monthNameMatch[1].toLowerCase()];

    if (month) {
      return normalizeParts({
        year: Number(monthNameMatch[3]),
        month,
        day: Number(monthNameMatch[2]),
        hour: Number(monthNameMatch[4] ?? 0),
        minute: Number(monthNameMatch[5] ?? 0),
        second: Number(monthNameMatch[6] ?? 0),
        meridiem: monthNameMatch[7],
      });
    }
  }

  const native = new Date(value);
  if (Number.isNaN(native.getTime())) return null;

  return {
    year: native.getUTCFullYear(),
    month: native.getUTCMonth() + 1,
    day: native.getUTCDate(),
    hour: native.getUTCHours(),
    minute: native.getUTCMinutes(),
    second: native.getUTCSeconds(),
  };
}

function normalizeParts(parts: DateParts & { meridiem?: string }): DateParts {
  let hour = parts.hour;
  const meridiem = parts.meridiem?.toUpperCase();

  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  return { ...parts, hour };
}

function getParts(date: Date): Required<DateParts> {
  const values = new Map(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.get("year")),
    month: Number(values.get("month")),
    day: Number(values.get("day")),
    hour: Number(values.get("hour")),
    minute: Number(values.get("minute")),
    second: Number(values.get("second")),
  };
}

function getTimeZoneOffsetMs(date: Date) {
  const parts = getParts(date);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - date.getTime();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};
