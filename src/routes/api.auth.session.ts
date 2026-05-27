import { createFileRoute } from "@tanstack/react-router";
import { getSession } from "@/lib/server/auth";

export const Route = createFileRoute("/api/auth/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await getSession(request);

        return Response.json({
          authenticated: Boolean(session),
          email: session?.email ?? null,
        });
      },
    },
  },
});
