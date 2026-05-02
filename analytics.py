from fastapi import APIRouter, Depends
from database import get_db
from auth_utils import get_current_user
from collections import defaultdict

router = APIRouter()

@router.get("/dashboard")
async def dashboard(current_user=Depends(get_current_user)):
    """Full analytics for the logged-in user."""
    db      = get_db()
    user_id = str(current_user["_id"])

    # ── Test results ─────────────────────────────────────────────────────────
    test_docs = await db.test_results.find(
        {"user_id": user_id}
    ).sort("created_at", -1).to_list(length=100)

    total_tests  = len(test_docs)
    avg_score    = round(sum(d["percentage"] for d in test_docs) / total_tests, 1) if test_docs else 0

    # Best company (highest avg %)
    company_scores = defaultdict(list)
    for d in test_docs:
        company_scores[d["company_id"]].append(d["percentage"])
    best_company = max(company_scores, key=lambda k: sum(company_scores[k]) / len(company_scores[k])) if company_scores else None

    # Score trend (last 7 tests)
    trend = [{"test_id": d["test_id"], "company": d["company_id"], "score": d["percentage"],
               "date": d["created_at"].isoformat() if d.get("created_at") else ""} for d in test_docs[:7]]

    # Weak categories: find categories where avg < 60%
    cat_scores = defaultdict(list)
    for d in test_docs:
        # Infer category from test_id suffix
        tid = d["test_id"]
        if "verbal"  in tid: cat = "Verbal"
        elif "quant" in tid: cat = "Quantitative"
        elif "logical" in tid: cat = "Logical"
        elif "coding" in tid: cat = "Coding"
        else:                  cat = "Other"
        cat_scores[cat].append(d["percentage"])

    weak_categories = [
        cat for cat, scores in cat_scores.items()
        if (sum(scores) / len(scores)) < 60
    ]

    # Per-company breakdown
    company_breakdown = [
        {
            "company": company,
            "tests_taken": len(scores),
            "avg_score": round(sum(scores) / len(scores), 1),
            "best_score": max(scores)
        }
        for company, scores in company_scores.items()
    ]

    # ── Interview results ────────────────────────────────────────────────────
    interview_docs = await db.interview_sessions.find(
        {"user_id": user_id, "status": "completed"}
    ).sort("created_at", -1).to_list(length=50)

    total_interviews = len(interview_docs)
    avg_interview    = round(
        sum(d.get("overall_score", 0) for d in interview_docs) / total_interviews, 1
    ) if total_interviews else 0

    recent_interviews = [
        {
            "id":       str(d["_id"]),
            "company":  d["company_id"],
            "role":     d["role"],
            "score":    d.get("overall_score", 0),
            "date":     d["created_at"].isoformat() if d.get("created_at") else ""
        }
        for d in interview_docs[:5]
    ]

    return {
        "tests": {
            "total":             total_tests,
            "avg_score":         avg_score,
            "best_company":      best_company,
            "weak_categories":   weak_categories,
            "trend":             trend,
            "company_breakdown": company_breakdown
        },
        "interviews": {
            "total":   total_interviews,
            "avg_score": avg_interview,
            "recent":  recent_interviews
        }
    }


@router.get("/leaderboard/{company_id}")
async def leaderboard(company_id: str):
    """Top 10 users for a given company."""
    db = get_db()
    pipeline = [
        {"$match": {"company_id": company_id}},
        {"$group": {
            "_id":       "$user_id",
            "avg_score": {"$avg": "$percentage"},
            "tests":     {"$sum": 1},
            "best":      {"$max": "$percentage"}
        }},
        {"$sort": {"avg_score": -1}},
        {"$limit": 10},
        {"$lookup": {
            "from":         "users",
            "localField":   "_id",
            "foreignField": "_id",  # Note: won't match string vs ObjectId in practice
            "as":           "user"
        }}
    ]
    docs = await db.test_results.aggregate(pipeline).to_list(length=10)
    return [
        {
            "rank":      i + 1,
            "user_id":   str(d["_id"]),
            "avg_score": round(d["avg_score"], 1),
            "tests":     d["tests"],
            "best_score": round(d["best"], 1)
        }
        for i, d in enumerate(docs)
    ]
