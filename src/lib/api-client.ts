import { repairDataSchema } from "@/lib/schemas";
import type { RepairData } from "@/lib/repair-store";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchRepairData() {
  const data = await request<unknown>("/api/repair-data");
  return repairDataSchema.parse(data);
}

export async function saveRepairData(data: RepairData) {
  await request<{ ok: true }>("/api/repair-data", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function uploadPhoto(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/photos", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Photo upload failed: ${response.status}`);
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}
