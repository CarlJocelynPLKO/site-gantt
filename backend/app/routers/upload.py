import json

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import get_settings
from app.models.schemas import AnalyzeResponse, GenerateRequest, GenerateResponse
from app.services.mapper_factory import get_column_mapper
from app.services.normalizer import normalize_to_gantt
from app.services.parser import ParseError, extract_sample, parse_file

router = APIRouter(prefix="/api", tags=["gantt"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_file(file: UploadFile = File(...)) -> AnalyzeResponse:
    if not file.filename:
        raise HTTPException(status_code=422, detail="Aucun fichier fourni.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=422, detail="Le fichier est vide.")

    try:
        columns, sample_rows = extract_sample(content, file.filename)
        mapper = get_column_mapper()
        mapping = mapper(columns, sample_rows)
    except ParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Impossible d'analyser le fichier.") from exc

    settings = get_settings()
    return AnalyzeResponse(
        columns=columns,
        sample_rows=sample_rows,
        mapping=mapping,
        mapping_mode=settings.mapping_mode,
    )


@router.post("/generate", response_model=GenerateResponse)
async def generate_gantt(
    file: UploadFile = File(...),
    mapping_json: str = Form(...),
) -> GenerateResponse:
    if not file.filename:
        raise HTTPException(status_code=422, detail="Aucun fichier fourni.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=422, detail="Le fichier est vide.")

    try:
        mapping = GenerateRequest.model_validate(json.loads(mapping_json))
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Configuration de colonnes invalide.") from exc

    if mapping.use_duration and not mapping.duration_column:
        raise HTTPException(status_code=422, detail="Sélectionnez une colonne Durée.")
    if not mapping.use_duration and not mapping.end_column:
        raise HTTPException(status_code=422, detail="Sélectionnez une colonne Fin.")

    try:
        df = parse_file(content, file.filename)
        tasks, warnings, skipped_rows = normalize_to_gantt(df, mapping)
    except ParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Impossible de générer le diagramme.") from exc

    return GenerateResponse(tasks=tasks, warnings=warnings, skipped_rows=skipped_rows)
