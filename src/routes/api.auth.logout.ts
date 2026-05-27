import { createFileRoute } from "@tanstack/react-router";
import { clearSessionCookie } from "@/lib/server/auth";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async () => {
        return Response.json(
          { authenticated: false },
          {
            headers: {
              "Set-Cookie": clearSessionCookie(),
            },
          },
        );
      },
    },
  },
});
