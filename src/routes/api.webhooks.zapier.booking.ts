import { createFileRoute } from "@tanstack/react-router";
import { zapierBookingSchema } from "@/lib/schemas";
import { getCloudflareBindings, requireD1 } from "@/lib/server/cloudflare";
import { upsertAppointment } from "@/lib/server/repair-repository";
import { appointmentFromZapierPayload } from "@/lib/server/zapier";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

function isAuthorized(request: Request) {
  const configuredSecret = getCloudflareBindings().ZAPIER_WEBHOOK_SECRET;

  if (!configuredSecret) return true;

  const headerSecret = request.headers.get("x-zapier-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");

  return headerSecret === configuredSecret || querySecret === configuredSecret;
}

export const Route = createFileRoute("/api/webhooks/zapier/booking")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorized(request)) {
          return json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = requireD1();
        const body = await request.json();
        const parsed = zapierBookingSchema.safeParse(body);

        if (!parsed.success) {
          return json({ error: "Invalid Zapier payload" }, { status: 400 });
        }

        const appointment = appointmentFromZapierPayload(parsed.data);
        await upsertAppointment(db, appointment, "zapier");

        return json({
          ok: true,
          appointmentId: appointment.id,
        });
      },
    },
  },
});
