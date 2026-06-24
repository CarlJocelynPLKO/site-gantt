export function fileNameToCalendarName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim();
  return baseName || "Nouveau calendrier";
}
