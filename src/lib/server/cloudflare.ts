import { env as workerEnv } from "cloudflare:workers";
import type { CloudflareBindings, D1Database, R2Bucket } from "@/lib/cloudflare-types";

type GlobalWithBindings = typeof globalThis & {
  DB?: D1Database;
  PHOTOS?: R2Bucket;
  ZAPIER_WEBHOOK_SECRET?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  AUTH_SECRET?: string;
  __env?: CloudflareBindings;
};

export function getCloudflareBindings(): CloudflareBindings {
  const globalBindings = globalThis as GlobalWithBindings;

  return {
    DB: workerEnv.DB ?? globalBindings.__env?.DB ?? globalBindings.DB,
    PHOTOS: workerEnv.PHOTOS ?? globalBindings.__env?.PHOTOS ?? globalBindings.PHOTOS,
    ZAPIER_WEBHOOK_SECRET:
      workerEnv.ZAPIER_WEBHOOK_SECRET ??
      globalBindings.__env?.ZAPIER_WEBHOOK_SECRET ??
      globalBindings.ZAPIER_WEBHOOK_SECRET ??
      process.env.ZAPIER_WEBHOOK_SECRET,
    ADMIN_EMAIL:
      workerEnv.ADMIN_EMAIL ??
      globalBindings.__env?.ADMIN_EMAIL ??
      globalBindings.ADMIN_EMAIL ??
      process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD:
      workerEnv.ADMIN_PASSWORD ??
      globalBindings.__env?.ADMIN_PASSWORD ??
      globalBindings.ADMIN_PASSWORD ??
      process.env.ADMIN_PASSWORD,
    AUTH_SECRET:
      workerEnv.AUTH_SECRET ??
      globalBindings.__env?.AUTH_SECRET ??
      globalBindings.AUTH_SECRET ??
      process.env.AUTH_SECRET,
  };
}

export function requireD1() {
  const { DB } = getCloudflareBindings();

  if (!DB) {
    throw new Response(
      JSON.stringify({
        error:
          "Cloudflare D1 binding DB is not available. Configure wrangler.jsonc and run this API on Cloudflare.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return DB;
}

export function requireR2() {
  const { PHOTOS } = getCloudflareBindings();

  if (!PHOTOS) {
    throw new Response(
      JSON.stringify({
        error:
          "Cloudflare R2 binding PHOTOS is not available. Configure wrangler.jsonc and deploy with an R2 bucket binding.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return PHOTOS;
}
