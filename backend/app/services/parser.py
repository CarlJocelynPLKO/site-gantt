from __future__ import annotations

import io
from typing import Any

import pandas as pd

SUPPORTED_EXTENSIONS = {".xlsx", ".xls", ".csv", ".tsv", ".ods"}
SAMPLE_ROW_COUNT = 5


class ParseError(Exception):
    pass


def get_extension(filename: str) -> str:
    if not filename or "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()


def validate_extension(filename: str) -> str:
    ext = get_extension(filename)
    if f".{ext}" not in SUPPORTED_EXTENSIONS:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise ParseError(f"Format non supporté. Formats acceptés : {supported}")
    return ext


def _read_dataframe(content: bytes, ext: str) -> pd.DataFrame:
    buffer = io.BytesIO(content)

    try:
        if ext == "csv":
            df = pd.read_csv(buffer)
        elif ext == "tsv":
            df = pd.read_csv(buffer, sep="\t")
        elif ext == "xlsx":
            df = pd.read_excel(buffer, engine="openpyxl")
        elif ext == "xls":
            df = pd.read_excel(buffer, engine="xlrd")
        elif ext == "ods":
            df = pd.read_excel(buffer, engine="odf")
        else:
            raise ParseError(f"Extension .{ext} non prise en charge.")
    except ParseError:
        raise
    except Exception as exc:
        raise ParseError("Impossible de lire le fichier. Vérifiez qu'il n'est pas corrompu.") from exc

    if df.empty or len(df.columns) == 0:
        raise ParseError("Le fichier est vide ou ne contient aucune colonne.")

    df.columns = [str(col).strip() for col in df.columns]
    df = df.dropna(how="all").reset_index(drop=True)

    if df.empty:
        raise ParseError("Le fichier ne contient aucune ligne de données.")

    return df


def parse_file(content: bytes, filename: str) -> pd.DataFrame:
    ext = validate_extension(filename)
    return _read_dataframe(content, ext)


def extract_sample(content: bytes, filename: str) -> tuple[list[str], list[dict[str, Any]]]:
    df = parse_file(content, filename)
    columns = [str(col) for col in df.columns.tolist()]
    sample_df = df.head(SAMPLE_ROW_COUNT)
    sample_rows = [_serialize_row(row) for _, row in sample_df.iterrows()]
    return columns, sample_rows


def _serialize_row(row: pd.Series) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in row.items():
        if pd.isna(value):
            result[str(key)] = None
        elif hasattr(value, "isoformat"):
            result[str(key)] = value.isoformat()
        else:
            result[str(key)] = value
    return result
