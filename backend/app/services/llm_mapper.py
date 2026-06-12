from __future__ import annotations

import json
from typing import Any

from openai import OpenAI

from app.config import get_settings
from app.models.schemas import ColumnMappingSuggestion
from app.services.heuristic_mapper import map_columns_heuristic


class LLMMapperError(Exception):
    pass


def map_columns_llm(columns: list[str], sample_rows: list[dict[str, Any]]) -> ColumnMappingSuggestion:
    settings = get_settings()
    if not settings.openai_api_key:
        raise LLMMapperError("OPENAI_API_KEY manquante pour le mode LLM.")

    client = OpenAI(api_key=settings.openai_api_key)
    prompt = _build_prompt(columns, sample_rows)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Tu identifies les colonnes d'un fichier projet pour un diagramme de Gantt. "
                        "Réponds uniquement en JSON avec les clés : task_column, start_column, "
                        "end_column, duration_column, confidence."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )
        content = response.choices[0].message.content or "{}"
        payload = json.loads(content)
    except Exception as exc:
        raise LLMMapperError("Échec de l'analyse LLM.") from exc

    return ColumnMappingSuggestion(
        task_column=_nullable(payload.get("task_column"), columns),
        start_column=_nullable(payload.get("start_column"), columns),
        end_column=_nullable(payload.get("end_column"), columns),
        duration_column=_nullable(payload.get("duration_column"), columns),
        confidence=min(max(float(payload.get("confidence", 0.5)), 0.0), 1.0),
        available_columns=columns,
    )


def _nullable(value: Any, columns: list[str]) -> str | None:
    if value in (None, "", "null"):
        return None
    value_str = str(value)
    return value_str if value_str in columns else None


def _build_prompt(columns: list[str], sample_rows: list[dict[str, Any]]) -> str:
    return (
        "Analyse ces données et identifie précisément quelle colonne correspond au nom de la tâche, "
        "laquelle représente la date de début, et laquelle indique la date de fin ou la durée.\n"
        f"Colonnes : {json.dumps(columns, ensure_ascii=False)}\n"
        f"Échantillon : {json.dumps(sample_rows, ensure_ascii=False, default=str)}"
    )


def map_columns_with_fallback(columns: list[str], sample_rows: list[dict[str, Any]]) -> ColumnMappingSuggestion:
    try:
        return map_columns_llm(columns, sample_rows)
    except LLMMapperError:
        return map_columns_heuristic(columns, sample_rows)
