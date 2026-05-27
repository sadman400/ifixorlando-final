export function createId(prefix = "") {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10);

  return prefix ? `${prefix}_${id}` : id;
}
