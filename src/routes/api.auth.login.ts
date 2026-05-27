import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createSessionCookie, getConfiguredAdmin } from "@/lib/server/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = getConfiguredAdmin();

        if (!admin.configured) {
          return Response.json({ error: "Admin login is not configured" }, { status: 503 });
        }

        const parsed = loginSchema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json({ error: "Invalid login payload" }, { status: 400 });
        }

        const emailMatches = parsed.data.email.toLowerCase() === admin.email?.toLowerCase();
        const passwordMatches = parsed.data.password === admin.password;

        if (!emailMatches || !passwordMatches) {
          return Response.json({ error: "Invalid email or password" }, { status: 401 });
        }

        const cookie = await createSessionCookie(parsed.data.email, request);

        return Response.json(
          { authenticated: true, email: parsed.data.email },
          {
            headers: {
              "Set-Cookie": cookie,
            },
          },
        );
      },
    },
  },
});
