import type { ProjectDocument } from "../types/gantt";

export function mapDocumentsFromRow(raw: unknown): ProjectDocument[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const doc = item as Record<string, unknown>;
      if (
        typeof doc.id !== "string" ||
        typeof doc.name !== "string" ||
        typeof doc.path !== "string"
      ) {
        return null;
      }
      return {
        id: doc.id,
        name: doc.name,
        path: doc.path,
        mimeType: typeof doc.mimeType === "string" ? doc.mimeType : "application/octet-stream",
        size: typeof doc.size === "number" ? doc.size : 0,
        uploadedAt: typeof doc.uploadedAt === "string" ? doc.uploadedAt : new Date().toISOString(),
      };
    })
    .filter((item): item is ProjectDocument => item !== null);
}
