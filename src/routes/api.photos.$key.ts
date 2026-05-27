import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/server/auth";
import { requireR2 } from "@/lib/server/cloudflare";

export const Route = createFileRoute("/api/photos/$key")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        await requireAuth(request);
        const bucket = requireR2();
        const object = await bucket.get(params.key);

        if (!object?.body) {
          return Response.json({ error: "Photo not found" }, { status: 404 });
        }

        const headers = new Headers({
          "Cache-Control": "private, max-age=3600",
        });
        object.writeHttpMetadata(headers);

        return new Response(object.body, { headers });
      },
    },
  },
});
