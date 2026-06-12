from typing import Any, Literal

from pydantic import BaseModel, Field


class ColumnMappingSuggestion(BaseModel):
    task_column: str | None = None
    start_column: str | None = None
    end_column: str | None = None
    duration_column: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    available_columns: list[str]


class AnalyzeResponse(BaseModel):
    columns: list[str]
    sample_rows: list[dict[str, Any]]
    mapping: ColumnMappingSuggestion
    mapping_mode: str


class GenerateRequest(BaseModel):
    task_column: str
    start_column: str
    end_column: str | None = None
    duration_column: str | None = None
    use_duration: bool = False


class GanttTask(BaseModel):
    id: str
    name: str
    start: str
    end: str
    progress: int = 0


class GenerateResponse(BaseModel):
    tasks: list[GanttTask]
    warnings: list[str]
    skipped_rows: int = 0


class ErrorResponse(BaseModel):
    detail: str
