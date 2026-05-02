# CampusCode — Backend

FastAPI backend with MongoDB, JWT auth, Ollama AI, and Whisper STT.

## Setup

```bash
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # Fill in your values
python seed.py              # Seed questions into MongoDB
uvicorn main:app --reload   # Start server on :8000
```

## Docs

Swagger UI → http://localhost:8000/docs
ReDoc     → http://localhost:8000/redoc

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `DB_NAME` | `campuscode` | Database name |
| `SECRET_KEY` | — | JWT signing secret (change in production) |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3` | LLM model to use |

## Routes

| File | Prefix | Endpoints |
|------|--------|-----------|
| `routes/auth.py` | `/auth` | register, login, me |
| `routes/companies.py` | `/companies` | list, get by id |
| `routes/tests.py` | `/tests` | rounds, questions, submit |
| `routes/interview.py` | `/interview` | start, answer, voice, complete, history |
| `routes/analytics.py` | `/analytics` | dashboard, leaderboard |
