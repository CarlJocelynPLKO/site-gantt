from __future__ import annotations

import re
import unicodedata
from typing import Any

from app.models.schemas import ColumnMappingSuggestion

TASK_KEYWORDS = [
    "task",
    "tache",
    "tâche",
    "libelle",
    "libellé",
    "nom",
    "name",
    "wbs",
    "livrable",
    "activity",
    "activite",
    "activité",
    "description",
    "titre",
    "title",
    "phase",
    "etape",
    "étape",
]

START_KEYWORDS = [
    "start",
    "debut",
    "début",
    "begin",
    "date debut",
    "date début",
    "date de debut",
    "date de début",
    "date lancement",
    "lancement",
    "created",
    "creation",
    "création",
    "commence",
    "start date",
]

END_KEYWORDS = [
    "end",
    "fin",
    "finish",
    "date fin",
    "date de fin",
    "echeance",
    "échéance",
    "deadline",
    "due",
    "end date",
    "terminaison",
    "cloture",
    "clôture",
]

DURATION_KEYWORDS = [
    "duration",
    "duree",
    "durée",
    "days",
    "day",
    "jours",
    "jour",
    "semaines",
    "semaine",
    "weeks",
    "week",
    "d",
]


def _normalize(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text.lower())
    normalized = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return normalized.strip()


def _score_column(column: str, keywords: list[str]) -> float:
    normalized_column = _normalize(column)
    if not normalized_column:
        return 0.0

    best = 0.0
    for keyword in keywords:
        normalized_keyword = _normalize(keyword)
        if not normalized_keyword:
            continue
        if normalized_column == normalized_keyword:
            best = max(best, 1.0)
        elif normalized_keyword in normalized_column.split():
            best = max(best, 0.9)
        elif normalized_keyword in normalized_column:
            best = max(best, 0.75)
    return best


def _pick_best(columns: list[str], keywords: list[str], excluded: set[str]) -> tuple[str | None, float]:
    best_column: str | None = None
    best_score = 0.0
    for column in columns:
        if column in excluded:
            continue
        score = _score_column(column, keywords)
        if score > best_score:
            best_score = score
            best_column = column
    return best_column, best_score


def map_columns_heuristic(columns: list[str], sample_rows: list[dict[str, Any]]) -> ColumnMappingSuggestion:
    del sample_rows  # reserved for future LLM / richer heuristics

    task_column, task_score = _pick_best(columns, TASK_KEYWORDS, set())
    excluded = {task_column} if task_column else set()
    start_column, start_score = _pick_best(columns, START_KEYWORDS, excluded)

    if start_column:
        excluded.add(start_column)
    end_column, end_score = _pick_best(columns, END_KEYWORDS, excluded)

    if end_column:
        excluded.add(end_column)
    duration_column, duration_score = _pick_best(columns, DURATION_KEYWORDS, excluded)

    if end_score >= duration_score and end_column:
        duration_column = None
        duration_score = 0.0
    elif duration_score > end_score and duration_column:
        end_column = None
        end_score = 0.0

    scores = [task_score, start_score, max(end_score, duration_score)]
    confidence = sum(scores) / len(scores) if scores else 0.0

    if not task_column or not start_column:
        confidence = min(confidence, 0.45)
    if not end_column and not duration_column:
        confidence = min(confidence, 0.45)

    return ColumnMappingSuggestion(
        task_column=task_column,
        start_column=start_column,
        end_column=end_column,
        duration_column=duration_column,
        confidence=round(confidence, 2),
        available_columns=columns,
    )
