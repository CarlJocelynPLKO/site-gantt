import axios from "axios";
import type { AnalyzeResponse, ColumnSelection, GenerateResponse } from "../types/gantt";

const api = axios.create({
  baseURL: "",
});

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
  }
  return "Une erreur est survenue. Veuillez réessayer.";
}

export async function analyzeFile(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post<AnalyzeResponse>("/api/analyze", formData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function generateGantt(file: File, mapping: ColumnSelection): Promise<GenerateResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "mapping_json",
    JSON.stringify({
      task_column: mapping.taskColumn,
      start_column: mapping.startColumn,
      end_column: mapping.useDuration ? null : mapping.endColumn,
      duration_column: mapping.useDuration ? mapping.durationColumn : null,
      use_duration: mapping.useDuration,
    }),
  );

  try {
    const response = await api.post<GenerateResponse>("/api/generate", formData);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
