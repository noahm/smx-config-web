/**
 * Trigger a browser download of `json` as a file named `filename`.
 */
export function downloadJson(filename: string, json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Read a user-selected file as text. */
export function readJsonFile(file: File): Promise<string> {
  return file.text();
}

/** Turn a preset name into a filesystem-friendly filename stem. */
export function presetFilenameStem(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "preset";
}
