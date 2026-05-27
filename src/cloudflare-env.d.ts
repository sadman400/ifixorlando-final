declare module "cloudflare:workers" {
  import type { CloudflareBindings } from "@/lib/cloudflare-types";

  export const env: CloudflareBindings;
  export function withEnv<T>(bindings: Partial<CloudflareBindings>, callback: () => T): T;
}
