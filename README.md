# GanttAI

Application web pour transformer des fichiers Excel/CSV en diagrammes de Gantt interactifs.

## Architecture

- **Frontend** : React + Vite + Frappe Gantt
- **Backend** : FastAPI (Python)

## Prérequis

- Python 3.11+
- Node.js 20+

## Installation

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

## Variables d'environnement

Fichier `backend/.env` :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `MAPPING_MODE` | `HEURISTIQUE` ou `LLM` | `HEURISTIQUE` |
| `OPENAI_API_KEY` | Clé API OpenAI (mode LLM) | vide |
| `CORS_ORIGINS` | Origines autorisées | `http://localhost:5173` |

## Mode LLM (post-MVP)

1. Définir `MAPPING_MODE=LLM` dans `backend/.env`
2. Renseigner `OPENAI_API_KEY`
3. Redémarrer le backend

Le frontend reste inchangé : le mapping est pré-rempli via l'API.

## API

- `GET /health` — statut du serveur
- `POST /api/analyze` — analyse d'un fichier (header + échantillon + mapping suggéré)
- `POST /api/generate` — génération des tâches Gantt normalisées

## Formats supportés

`.xlsx`, `.xls`, `.csv`, `.tsv`, `.ods`

## Confidentialité

Les fichiers sont traités en mémoire volatile côté backend. Aucune persistance disque ni base de données.
