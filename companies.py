from fastapi import APIRouter, HTTPException
from database import get_db
from typing import List

router = APIRouter()

# Seeded company data — in production this lives in MongoDB
COMPANIES = [
    {"id": "tcs",       "name": "TCS",        "logo": "🔷", "color": "#0051A2", "tag": "IT Services",       "difficulty": "Medium", "tests": 4, "description": "Tata Consultancy Services hiring pattern focuses on aptitude, coding, and technical rounds."},
    {"id": "infosys",   "name": "Infosys",    "logo": "🟦", "color": "#007CC3", "tag": "IT Consulting",     "difficulty": "Medium", "tests": 3, "description": "Infosys assessments cover verbal, quant, logical, and coding."},
    {"id": "wipro",     "name": "Wipro",      "logo": "🟣", "color": "#7B2D8B", "tag": "Technology",        "difficulty": "Easy",   "tests": 3, "description": "Wipro NLTH exam includes aptitude and written communication."},
    {"id": "amazon",    "name": "Amazon",     "logo": "🟠", "color": "#FF9900", "tag": "E-Commerce/Cloud",  "difficulty": "Hard",   "tests": 5, "description": "Amazon focuses on Leadership Principles alongside DSA and system design."},
    {"id": "google",    "name": "Google",     "logo": "🔴", "color": "#EA4335", "tag": "Tech Giant",        "difficulty": "Hard",   "tests": 5, "description": "Google interviews emphasize algorithms, data structures, and system design."},
    {"id": "microsoft", "name": "Microsoft",  "logo": "🪟", "color": "#00A4EF", "tag": "Software/Cloud",    "difficulty": "Hard",   "tests": 4, "description": "Microsoft tests problem-solving, OOP, and behavioral competency."},
    {"id": "accenture", "name": "Accenture",  "logo": "🟪", "color": "#A100FF", "tag": "Consulting",        "difficulty": "Easy",   "tests": 3, "description": "Accenture Cognitive & Technical Assessment + communication skills."},
    {"id": "cognizant", "name": "Cognizant",  "logo": "🔵", "color": "#1C4DA1", "tag": "IT Services",       "difficulty": "Medium", "tests": 3, "description": "Cognizant GenC exam includes aptitude, coding, and reasoning."},
    {"id": "hcl",       "name": "HCL",        "logo": "🟩", "color": "#009943", "tag": "IT Services",       "difficulty": "Easy",   "tests": 3, "description": "HCL TechBee focuses on aptitude and technical understanding."},
    {"id": "capgemini", "name": "Capgemini",  "logo": "🟤", "color": "#0070AD", "tag": "Consulting",        "difficulty": "Medium", "tests": 3, "description": "Capgemini Game-Based Assessment + technical and behavioral rounds."},
]

@router.get("/")
async def list_companies():
    return COMPANIES

@router.get("/{company_id}")
async def get_company(company_id: str):
    c = next((c for c in COMPANIES if c["id"] == company_id), None)
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    return c
