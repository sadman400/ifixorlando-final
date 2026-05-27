import { getCloudflareBindings } from "@/lib/server/cloudflare";

const COOKIE_NAME = "ifixorlando_session";
const SESSION_SECONDS = 60 * 60 * 12;

interface SessionPayload {
  email: string;
  exp: number;
}

function base64UrlEncode(value: string | ArrayBuffer) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));

  return base64UrlEncode(signature);
}

function parseCookies(request: Request) {
  const header = request.headers.get("cookie") ?? "";
  const cookies = new Map<string, string>();

  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name) cookies.set(name, rest.join("="));
  }

  return cookies;
}

export async function createSessionCookie(email: string, request: Request) {
  const { AUTH_SECRET } = getCloudflareBindings();

  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET is not configured");
  }

  const payload: SessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(encodedPayload, AUTH_SECRET);
  const secure = new URL(request.url).protocol === "https:" ? " Secure;" : "";

  return `${COOKIE_NAME}=${encodedPayload}.${signature}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function getSession(request: Request): Promise<SessionPayload | null> {
  const { AUTH_SECRET } = getCloudflareBindings();
  const token = parseCookies(request).get(COOKIE_NAME);

  if (!AUTH_SECRET || !token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await sign(encodedPayload, AUTH_SECRET);
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;

    if (!payload.email || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request) {
  const session = await getSession(request);

  if (!session) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return session;
}

export function getConfiguredAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_SECRET } = getCloudflareBindings();

  return {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    configured: Boolean(ADMIN_EMAIL && ADMIN_PASSWORD && AUTH_SECRET),
  };
}
