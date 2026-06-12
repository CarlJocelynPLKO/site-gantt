from __future__ import annotations

import json
import re
from datetime import datetime, timedelta
from typing import Any

import pandas as pd
from dateutil import parser as date_parser

from app.models.schemas import GanttTask, GenerateRequest

DURATION_UNITS = {
    "jour": 1,
    "jours": 1,
    "day": 1,
    "days": 1,
    "d": 1,
    "semaine": 7,
    "semaines": 7,
    "week": 7,
    "weeks": 7,
    "w": 7,
}


def normalize_to_gantt(df: pd.DataFrame, mapping: GenerateRequest) -> tuple[list[GanttTask], list[str], int]:
    warnings: list[str] = []
    skipped_rows = 0
    tasks: list[GanttTask] = []

    required = [mapping.task_column, mapping.start_column]
    if mapping.use_duration:
        required.append(mapping.duration_column)
    else:
        required.append(mapping.end_column)

    for column in required:
        if column and column not in df.columns:
            raise ValueError(f"Colonne introuvable : {column}")

    for index, row in df.iterrows():
        task_name = _clean_text(row.get(mapping.task_column))
        start_date = _parse_date(row.get(mapping.start_column))

        if not task_name or start_date is None:
            skipped_rows += 1
            continue

        if mapping.use_duration:
            duration_days = _parse_duration(row.get(mapping.duration_column))
            if duration_days is None:
                skipped_rows += 1
                continue
            end_date = start_date + timedelta(days=duration_days)
        else:
            end_date = _parse_date(row.get(mapping.end_column))
            if end_date is None:
                skipped_rows += 1
                continue
            if end_date < start_date:
                warnings.append(f"Ligne {index + 2} : date de fin antérieure au début, dates inversées.")
                start_date, end_date = end_date, start_date

        tasks.append(
            GanttTask(
                id=str(len(tasks) + 1),
                name=task_name,
                start=start_date.date().isoformat(),
                end=end_date.date().isoformat(),
                progress=0,
            )
        )

    if not tasks:
        raise ValueError("Aucune tâche valide n'a pu être générée. Vérifiez vos colonnes et vos données.")

    if skipped_rows:
        warnings.append(f"{skipped_rows} ligne(s) ignorée(s) en raison de données invalides.")

    return tasks, warnings, skipped_rows


def _clean_text(value: Any) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    text = str(value).strip()
    return text or None


def _parse_date(value: Any) -> datetime | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, pd.Timestamp):
        return value.to_pydatetime()

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if 20000 <= float(value) <= 60000:
            origin = datetime(1899, 12, 30)
            return origin + timedelta(days=float(value))
        return None

    text = str(value).strip()
    if not text:
        return None

    try:
        return date_parser.parse(text, dayfirst=True)
    except (ValueError, OverflowError, TypeError):
        return None


def _parse_duration(value: Any) -> int | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        days = int(round(float(value)))
        return days if days > 0 else None

    text = str(value).strip().lower()
    if not text:
        return None

    match = re.search(r"(\d+(?:[.,]\d+)?)\s*([a-zéèê]+)?", text)
    if not match:
        return None

    amount = float(match.group(1).replace(",", "."))
    unit = match.group(2) or "jours"
    multiplier = DURATION_UNITS.get(unit, 1)
    days = int(round(amount * multiplier))
    return days if days > 0 else None
