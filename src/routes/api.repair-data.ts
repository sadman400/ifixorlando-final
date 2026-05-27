import { createFileRoute } from "@tanstack/react-router";
import { repairDataSchema } from "@/lib/schemas";
import { requireAuth } from "@/lib/server/auth";
import { requireD1 } from "@/lib/server/cloudflare";
import { getRepairData, replaceRepairData } from "@/lib/server/repair-repository";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

export const Route = createFileRoute("/api/repair-data")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        await requireAuth(request);
        const db = requireD1();
        const data = await getRepairData(db);

        return json(data);
      },
      PUT: async ({ request }) => {
        await requireAuth(request);
        const db = requireD1();
        const body = await request.json();
        const parsed = repairDataSchema.safeParse(body);

        if (!parsed.success) {
          return json(
            { error: "Invalid repair data", details: parsed.error.flatten() },
            { status: 400 },
          );
        }

        await replaceRepairData(db, parsed.data);

        return json({ ok: true });
      },
    },
  },
});
