export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (import.meta.env.PROD) {
    return "/_/backend";
  }

  return "";
}
