import { getSupabase } from "../supabaseClient";
import type { Project } from "../types/gantt";
import { fetchProjectById } from "./calendarService";

const BUCKET = "project-assets";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_DOC_BYTES = 20 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, "_").trim() || "fichier";
}

function extensionFromName(name: string): string {
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "bin";
}

export function getProjectAssetPublicUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function getUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) {
    throw new Error("Vous devez être connecté pour gérer les fichiers du projet.");
  }
  return data.user.id;
}

async function uploadFile(path: string, file: File): Promise<void> {
  const { error } = await getSupabase().storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function removeFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) {
    return;
  }

  const { error } = await getSupabase().storage.from(BUCKET).remove(paths);
  if (error) {
    throw new Error(error.message);
  }
}

export async function uploadProjectCover(projectId: string, file: File): Promise<Project> {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("Formats acceptés : JPG, PNG, WebP ou GIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("L'image ne doit pas dépasser 8 Mo.");
  }

  const userId = await getUserId();
  const ext = extensionFromName(file.name);
  const path = `${userId}/${projectId}/cover.${ext}`;

  const existing = await fetchProjectById(projectId);
  if (existing.coverImagePath && existing.coverImagePath !== path) {
    await removeFiles([existing.coverImagePath]);
  }

  await uploadFile(path, file);

  const { error } = await getSupabase()
    .from("tasks")
    .update({ cover_image_path: path })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  return fetchProjectById(projectId);
}

export async function removeProjectCover(projectId: string): Promise<Project> {
  const existing = await fetchProjectById(projectId);
  if (existing.coverImagePath) {
    await removeFiles([existing.coverImagePath]);
  }

  const { error } = await getSupabase()
    .from("tasks")
    .update({ cover_image_path: null })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  return fetchProjectById(projectId);
}

export async function uploadProjectDocument(projectId: string, file: File): Promise<Project> {
  if (file.size > MAX_DOC_BYTES) {
    throw new Error("Le document ne doit pas dépasser 20 Mo.");
  }

  const userId = await getUserId();
  const docId = crypto.randomUUID();
  const safeName = sanitizeFileName(file.name);
  const path = `${userId}/${projectId}/docs/${docId}-${safeName}`;

  await uploadFile(path, file);

  const existing = await fetchProjectById(projectId);
  const documents = [...(existing.documents ?? [])];
  documents.push({
    id: docId,
    name: file.name,
    path,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    uploadedAt: new Date().toISOString(),
  });

  const { error } = await getSupabase()
    .from("tasks")
    .update({ documents })
    .eq("id", projectId);

  if (error) {
    await removeFiles([path]);
    throw new Error(error.message);
  }

  return fetchProjectById(projectId);
}

export async function removeProjectDocument(projectId: string, documentId: string): Promise<Project> {
  const existing = await fetchProjectById(projectId);
  const target = existing.documents?.find((doc) => doc.id === documentId);
  if (!target) {
    return existing;
  }

  await removeFiles([target.path]);

  const documents = (existing.documents ?? []).filter((doc) => doc.id !== documentId);

  const { error } = await getSupabase()
    .from("tasks")
    .update({ documents })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  return fetchProjectById(projectId);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
