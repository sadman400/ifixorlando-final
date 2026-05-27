import { createFileRoute } from "@tanstack/react-router";
import { createId } from "@/lib/id";
import { requireAuth } from "@/lib/server/auth";
import { requireR2 } from "@/lib/server/cloudflare";

const MAX_PHOTO_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

export const Route = createFileRoute("/api/photos")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await requireAuth(request);
        const bucket = requireR2();
        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
          return json({ error: "Missing photo file" }, { status: 400 });
        }

        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
          return json({ error: "Unsupported photo type" }, { status: 400 });
        }

        if (file.size > MAX_PHOTO_SIZE) {
          return json({ error: "Photo is too large" }, { status: 400 });
        }

        const extension = extensionForType(file.type);
        const key = `${createId("photo")}.${extension}`;

        await bucket.put(key, file, {
          httpMetadata: {
            contentType: file.type,
          },
        });

        return json({ url: `/api/photos/${encodeURIComponent(key)}` });
      },
    },
  },
});

function extensionForType(type: string) {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}
