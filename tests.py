from fastapi import APIRouter, HTTPException, Depends
from database import get_db
from models import SubmitTest, TestResult, QuestionResult
from auth_utils import get_current_user
from bson import ObjectId
from datetime import datetime
from typing import List

router = APIRouter()

# ── Test round definitions per company ──────────────────────────────────────

TESTS = {
    "tcs": [
        {"id": "tcs-verbal",  "company_id": "tcs", "name": "Verbal Ability",        "category": "Verbal Ability",        "icon": "📝", "desc": "English comprehension, grammar, vocabulary", "questions": 10, "time": 600,  "difficulty": "Medium"},
        {"id": "tcs-quant",   "company_id": "tcs", "name": "Quantitative Aptitude",  "category": "Quantitative Aptitude", "icon": "🔢", "desc": "Arithmetic, algebra, data interpretation",   "questions": 10, "time": 600,  "difficulty": "Medium"},
        {"id": "tcs-logical", "company_id": "tcs", "name": "Logical Reasoning",      "category": "Logical Reasoning",     "icon": "🧠", "desc": "Patterns, sequences, critical thinking",      "questions": 10, "time": 600,  "difficulty": "Medium"},
        {"id": "tcs-coding",  "company_id": "tcs", "name": "Coding Round",           "category": "Coding Round",          "icon": "💻", "desc": "Data structures, algorithms",                 "questions": 5,  "time": 900,  "difficulty": "Hard"},
    ],
    "amazon": [
        {"id": "amz-verbal",  "company_id": "amazon", "name": "Verbal Ability",       "category": "Verbal Ability",        "icon": "📝", "desc": "English comprehension & grammar",             "questions": 10, "time": 600,  "difficulty": "Medium"},
        {"id": "amz-quant",   "company_id": "amazon", "name": "Quantitative Aptitude","category": "Quantitative Aptitude", "icon": "🔢", "desc": "Math & analytical reasoning",                 "questions": 10, "time": 600,  "difficulty": "Hard"},
        {"id": "amz-logical", "company_id": "amazon", "name": "Logical Reasoning",    "category": "Logical Reasoning",     "icon": "🧠", "desc": "Critical thinking & patterns",                "questions": 10, "time": 600,  "difficulty": "Hard"},
        {"id": "amz-coding",  "company_id": "amazon", "name": "Coding Round",         "category": "Coding Round",          "icon": "💻", "desc": "OOP, DSA & system design basics",             "questions": 5,  "time": 900,  "difficulty": "Hard"},
        {"id": "amz-lp",      "company_id": "amazon", "name": "Leadership Principles","category": "HR Round",              "icon": "🏆", "desc": "Amazon-specific behavioral questions",        "questions": 10, "time": 600,  "difficulty": "Medium"},
    ],
    "google": [
        {"id": "ggl-coding1", "company_id": "google", "name": "Coding Round 1",       "category": "Coding Round",          "icon": "💻", "desc": "Arrays, strings, hash maps",                  "questions": 5,  "time": 1800, "difficulty": "Hard"},
        {"id": "ggl-coding2", "company_id": "google", "name": "Coding Round 2",       "category": "Coding Round",          "icon": "💻", "desc": "Trees, graphs, dynamic programming",          "questions": 5,  "time": 1800, "difficulty": "Hard"},
        {"id": "ggl-sys",     "company_id": "google", "name": "System Design",        "category": "HR Round",              "icon": "🏗️", "desc": "Scalable system architecture",               "questions": 3,  "time": 2700, "difficulty": "Hard"},
        {"id": "ggl-behav",   "company_id": "google", "name": "Behavioral Round",     "category": "HR Round",              "icon": "🤝", "desc": "Googleyness & leadership",                    "questions": 5,  "time": 600,  "difficulty": "Medium"},
        {"id": "ggl-quant",   "company_id": "google", "name": "Quantitative Aptitude","category": "Quantitative Aptitude", "icon": "🔢", "desc": "Math & analytical reasoning",                 "questions": 10, "time": 600,  "difficulty": "Hard"},
    ],
}

# Fallback: generate generic tests for companies not explicitly listed
def get_default_tests(company_id: str):
    return [
        {"id": f"{company_id}-verbal",  "company_id": company_id, "name": "Verbal Ability",       "category": "Verbal Ability",        "icon": "📝", "desc": "English comprehension & grammar",          "questions": 10, "time": 600, "difficulty": "Medium"},
        {"id": f"{company_id}-quant",   "company_id": company_id, "name": "Quantitative Aptitude","category": "Quantitative Aptitude", "icon": "🔢", "desc": "Arithmetic & data interpretation",         "questions": 10, "time": 600, "difficulty": "Medium"},
        {"id": f"{company_id}-logical", "company_id": company_id, "name": "Logical Reasoning",    "category": "Logical Reasoning",     "icon": "🧠", "desc": "Patterns, sequences, reasoning",           "questions": 10, "time": 600, "difficulty": "Medium"},
    ]


@router.get("/{company_id}")
async def get_tests(company_id: str):
    return TESTS.get(company_id, get_default_tests(company_id))


@router.get("/{company_id}/{test_id}/questions")
async def get_questions(company_id: str, test_id: str):
    db   = get_db()
    docs = await db.questions.find(
        {"company_id": company_id, "test_id": test_id}
    ).to_list(length=50)

    if not docs:
        # Return a sample set when DB is empty (development fallback)
        return _sample_questions(company_id, test_id)

    for d in docs:
        d["id"] = str(d["_id"]); del d["_id"]
    return docs


@router.post("/submit", dependencies=[Depends(get_current_user)])
async def submit_test(body: SubmitTest, current_user=Depends(get_current_user)):
    db = get_db()

    # Fetch questions for scoring
    question_ids = [a.question_id for a in body.answers]
    docs = await db.questions.find(
        {"company_id": body.company_id, "test_id": body.test_id}
    ).to_list(length=100)

    q_map = {str(d["_id"]): d for d in docs}
    results = []
    score   = 0

    for ans in body.answers:
        q = q_map.get(ans.question_id)
        if not q:
            continue
        correct    = q["correct"]
        is_correct = ans.selected == correct
        if is_correct: score += 1
        results.append(QuestionResult(
            question_id  = ans.question_id,
            question     = q["question"],
            options      = q.get("options"),
            selected     = ans.selected,
            correct      = correct,
            is_correct   = is_correct,
            explanation  = q.get("explanation", "")
        ).dict())

    total      = len(body.answers)
    percentage = round((score / total) * 100, 1) if total else 0

    record = {
        "user_id":    str(current_user["_id"]),
        "company_id": body.company_id,
        "test_id":    body.test_id,
        "score":      score,
        "total":      total,
        "percentage": percentage,
        "time_taken": body.time_taken,
        "results":    results,
        "created_at": datetime.utcnow()
    }
    res = await db.test_results.insert_one(record)
    return {"id": str(res.inserted_id), "score": score, "total": total, "percentage": percentage, "results": results}


# ── Sample question fallback (dev only) ─────────────────────────────────────

def _sample_questions(company_id: str, test_id: str):
    return [
        {"id": f"q{i}", "company_id": company_id, "test_id": test_id, "type": "mcq",
         "question": q["question"], "options": q["options"], "correct": q["correct"],
         "explanation": q["explanation"]}
        for i, q in enumerate([
            {"question": "A train travels 360 km in 4 hours. What is its average speed?",
             "options": ["80 km/h","90 km/h","100 km/h","110 km/h"], "correct": 1, "explanation": "Speed = 360/4 = 90 km/h"},
            {"question": "Choose the word most similar to 'ELOQUENT':",
             "options": ["Silent","Fluent","Confused","Rude"], "correct": 1, "explanation": "Eloquent means fluent or persuasive."},
            {"question": "Which data structure uses LIFO principle?",
             "options": ["Queue","Array","Stack","Linked List"], "correct": 2, "explanation": "Stack uses LIFO."},
            {"question": "Find next in series: 2, 6, 12, 20, 30, ?",
             "options": ["40","42","44","46"], "correct": 1, "explanation": "Differences: 4,6,8,10,12 → 30+12=42"},
            {"question": "Time complexity of binary search?",
             "options": ["O(n)","O(n²)","O(log n)","O(1)"], "correct": 2, "explanation": "Binary search halves space each step."},
            {"question": "20% discount on ₹500 item. Selling price?",
             "options": ["₹350","₹380","₹400","₹420"], "correct": 2, "explanation": "500 - 20% = 500 - 100 = ₹400"},
            {"question": "Which is NOT a valid JavaScript data type?",
             "options": ["undefined","boolean","character","symbol"], "correct": 2, "explanation": "No 'character' type in JavaScript."},
            {"question": "What does HTTP stand for?",
             "options": ["HyperText Transfer Protocol","High Tech Transfer Protocol","HyperText Transmission Protocol","High Text Transfer Protocol"], "correct": 0, "explanation": "HTTP = HyperText Transfer Protocol."},
            {"question": "If P is 60% of Q, Q is what percent of P?",
             "options": ["150%","166.67%","140%","180%"], "correct": 1, "explanation": "Q = P/0.6 ≈ 166.67% of P"},
            {"question": "Which sort has best average time complexity?",
             "options": ["Bubble Sort","Selection Sort","Merge Sort","Insertion Sort"], "correct": 2, "explanation": "Merge Sort: O(n log n) on average."},
        ])
    ]
