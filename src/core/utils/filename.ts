export function sanitizeFilename(
  input: string,
  opts?: { separator?: "-" | "_"; maxLength?: number },
): string {
  const sep = opts?.separator ?? "-";
  const max = opts?.maxLength ?? 50;
  return input
    .toLowerCase()
    .replace(sep === "-" ? /[^a-z0-9]+/g : /[^a-z0-9_-]+/g, sep)
    .replace(new RegExp(`^\\${sep}|\\${sep}$`, "g"), "")
    .substring(0, max);
}
