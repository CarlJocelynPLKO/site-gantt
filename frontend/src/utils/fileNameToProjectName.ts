export function fileNameToProjectName(filename: string): string {
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  const cleaned = withoutExtension.replace(/[_-]+/g, " ").trim();
  return cleaned || "Nouveau projet";
}
