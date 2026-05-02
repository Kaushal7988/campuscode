from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from database import get_db
from models import StartInterview, InterviewAnswer, InterviewSession
from auth_utils import get_current_user
from bson import ObjectId
from datetime import datetime
import httpx, json, tempfile, os

router = APIRouter()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

# ── Ollama helpers ────────────────────────────────────────────────────────────

async def ollama_generate(prompt: str) -> str:
    """Call local Ollama model."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
            )
            return resp.json().get("response", "").strip()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama unavailable: {e}")


async def generate_questions(company: str, role: str, resume_text: str = "") -> list:
    """Generate 5 interview questions using Ollama."""
    context = f"Resume highlights: {resume_text[:500]}" if resume_text else ""
    prompt = f"""
You are an expert interviewer at {company}.
Generate exactly 5 technical interview questions for a {role} candidate.
{context}
Return ONLY a JSON array of strings. No extra text. Example:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]
"""
    raw = await ollama_generate(prompt)
    # Strip markdown fences if present
    raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
    try:
        questions = json.loads(raw)
        return questions if isinstance(questions, list) else []
    except Exception:
        # Fallback questions
        return [
            f"Tell me about your experience relevant to a {role} role.",
            f"What is your strongest technical skill as a {role}?",
            f"Describe a challenging project you've worked on.",
            f"How do you approach problem-solving under pressure?",
            f"Why do you want to join {company}?"
        ]


async def evaluate_answer(company: str, role: str, question: str, answer: str) -> dict:
    """Evaluate a candidate's answer using Ollama."""
    prompt = f"""
You are a senior interviewer at {company} evaluating a {role} candidate.

Question: {question}
Candidate Answer: {answer}

Evaluate the answer and respond ONLY with valid JSON in this exact format:
{{
  "score": <integer 0-10>,
  "strengths": ["point1", "point2"],
  "improvements": ["improvement1", "improvement2"],
  "model_answer": "A brief ideal answer summary"
}}
"""
    raw = await ollama_generate(prompt)
    raw = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
    try:
        data = json.loads(raw)
        return {
            "score":       int(data.get("score", 5)),
            "strengths":   data.get("strengths", []),
            "improvements": data.get("improvements", []),
            "model_answer": data.get("model_answer", "")
        }
    except Exception:
        return {"score": 5, "strengths": ["Attempted the question"], "improvements": ["Be more specific"], "model_answer": ""}


# ── Whisper STT ───────────────────────────────────────────────────────────────

async def transcribe_audio(audio_path: str) -> str:
    """Transcribe audio file using OpenAI Whisper."""
    try:
        import whisper
        model = whisper.load_model("base")
        result = model.transcribe(audio_path)
        return result["text"].strip()
    except ImportError:
        raise HTTPException(status_code=503, detail="Whisper not installed. Run: pip install openai-whisper")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/start")
async def start_interview(body: StartInterview, current_user=Depends(get_current_user)):
    """Create a new interview session and generate questions."""
    db = get_db()

    questions = await generate_questions(body.company_id, body.role, body.resume_text)

    session = {
        "user_id":    str(current_user["_id"]),
        "company_id": body.company_id,
        "role":       body.role,
        "questions":  questions,
        "answers":    [],
        "feedback":   [],
        "status":     "active",
        "created_at": datetime.utcnow()
    }
    res = await db.interview_sessions.insert_one(session)
    return {
        "session_id": str(res.inserted_id),
        "questions":  questions,
        "company_id": body.company_id,
        "role":       body.role
    }


@router.post("/answer")
async def submit_answer(body: InterviewAnswer, current_user=Depends(get_current_user)):
    """Submit a text answer for a question and get AI feedback."""
    db = get_db()
    session = await db.interview_sessions.find_one({"_id": ObjectId(body.session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    question = session["questions"][int(body.question_id)]
    feedback = await evaluate_answer(session["company_id"], session["role"], question, body.answer_text)

    # Store answer + feedback in session
    await db.interview_sessions.update_one(
        {"_id": ObjectId(body.session_id)},
        {"$push": {
            "answers":  {"question_id": body.question_id, "answer": body.answer_text},
            "feedback": {"question_id": body.question_id, **feedback}
        }}
    )
    return {"question": question, "answer": body.answer_text, **feedback}


@router.post("/answer-voice")
async def submit_voice_answer(
    session_id:  str = Form(...),
    question_id: str = Form(...),
    audio:       UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    """Accept audio upload, transcribe via Whisper, then evaluate."""
    # Save audio temporarily
    suffix = os.path.splitext(audio.filename)[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        answer_text = await transcribe_audio(tmp_path)
    finally:
        os.unlink(tmp_path)

    # Reuse the text answer flow
    from models import InterviewAnswer as IA
    return await submit_answer(
        IA(session_id=session_id, question_id=question_id, answer_text=answer_text),
        current_user
    )


@router.post("/complete/{session_id}")
async def complete_interview(session_id: str, current_user=Depends(get_current_user)):
    """Mark session complete and compute overall score."""
    db = get_db()
    session = await db.interview_sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    feedbacks = session.get("feedback", [])
    if feedbacks:
        overall = round(sum(f["score"] for f in feedbacks) / len(feedbacks), 1)
    else:
        overall = 0.0

    await db.interview_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"status": "completed", "overall_score": overall}}
    )
    return {
        "session_id":    session_id,
        "overall_score": overall,
        "total_questions": len(session["questions"]),
        "answered":      len(feedbacks),
        "feedback":      feedbacks
    }


@router.get("/history")
async def interview_history(current_user=Depends(get_current_user)):
    """Get user's past interview sessions."""
    db   = get_db()
    docs = await db.interview_sessions.find(
        {"user_id": str(current_user["_id"]), "status": "completed"},
        {"questions": 0}          # exclude heavy field
    ).sort("created_at", -1).limit(20).to_list(length=20)

    for d in docs:
        d["id"] = str(d["_id"]); del d["_id"]
    return docs
