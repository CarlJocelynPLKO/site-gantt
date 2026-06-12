from __future__ import annotations

from typing import Any, Callable

from app.config import get_settings
from app.models.schemas import ColumnMappingSuggestion
from app.services.heuristic_mapper import map_columns_heuristic
from app.services.llm_mapper import map_columns_llm


def get_column_mapper() -> Callable[[list[str], list[dict[str, Any]]], ColumnMappingSuggestion]:
    settings = get_settings()
    if settings.mapping_mode == "LLM":
        return map_columns_llm
    return map_columns_heuristic
