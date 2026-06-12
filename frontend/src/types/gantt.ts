export interface ColumnMappingSuggestion {
  task_column: string | null;
  start_column: string | null;
  end_column: string | null;
  duration_column: string | null;
  confidence: number;
  available_columns: string[];
}

export interface AnalyzeResponse {
  columns: string[];
  sample_rows: Record<string, unknown>[];
  mapping: ColumnMappingSuggestion;
  mapping_mode: string;
}

export interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
}

export interface GenerateResponse {
  tasks: GanttTask[];
  warnings: string[];
  skipped_rows: number;
}

export interface ColumnSelection {
  taskColumn: string;
  startColumn: string;
  endColumn: string;
  durationColumn: string;
  useDuration: boolean;
}

export const SUPPORTED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".tsv", ".ods"];

export function isSupportedFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}
