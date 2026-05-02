from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum

# ─── ENUMS ───────────────────────────────────────────────────────────────────

class Difficulty(str, Enum):
    easy   = "Easy"
    medium = "Medium"
    hard   = "Hard"

class QuestionType(str, Enum):
    mcq    = "mcq"
    coding = "coding"

class TestCategory(str, Enum):
    verbal   = "Verbal Ability"
    quant    = "Quantitative Aptitude"
    logical  = "Logical Reasoning"
    coding   = "Coding Round"
    lp       = "Leadership Principles"
    hr       = "HR Round"

# ─── AUTH ─────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name:     str
    email:    EmailStr
    password: str

class UserLogin(BaseModel):
    email:    EmailStr
    password: str

class UserOut(BaseModel):
    id:    str
    name:  str
    email: str

class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut

# ─── COMPANY ──────────────────────────────────────────────────────────────────

class Company(BaseModel):
    id:         str
    name:       str
    logo:       str
    color:      str
    tag:        str
    difficulty: Difficulty
    tests:      int
    description: Optional[str] = ""

# ─── QUESTIONS ────────────────────────────────────────────────────────────────

class MCQQuestion(BaseModel):
    id:          Optional[str] = None
    company_id:  str
    test_id:     str
    type:        QuestionType = QuestionType.mcq
    category:    TestCategory
    difficulty:  Difficulty
    question:    str
    options:     List[str]
    correct:     int           # index of correct option
    explanation: str

class CodingQuestion(BaseModel):
    id:           Optional[str] = None
    company_id:   str
    test_id:      str
    type:         QuestionType = QuestionType.coding
    category:     TestCategory = TestCategory.coding
    difficulty:   Difficulty
    title:        str
    description:  str
    input_format: str
    output_format: str
    sample_input:  str
    sample_output: str
    constraints:   str

# ─── TESTS ────────────────────────────────────────────────────────────────────

class TestRound(BaseModel):
    id:         str
    company_id: str
    name:       str
    category:   TestCategory
    icon:       str
    desc:       str
    questions:  int
    time:       int            # seconds
    difficulty: Difficulty

class SubmitAnswer(BaseModel):
    question_id: str
    selected:    Optional[int] = None  # MCQ option index
    code:        Optional[str] = None  # coding answer

class SubmitTest(BaseModel):
    test_id:    str
    company_id: str
    answers:    List[SubmitAnswer]
    time_taken: int            # seconds

# ─── SESSION / RESULTS ───────────────────────────────────────────────────────

class QuestionResult(BaseModel):
    question_id:  str
    question:     str
    options:      Optional[List[str]] = None
    selected:     Optional[int]       = None
    correct:      Optional[int]       = None
    is_correct:   bool
    explanation:  str

class TestResult(BaseModel):
    id:           Optional[str] = None
    user_id:      str
    company_id:   str
    test_id:      str
    score:        int
    total:        int
    percentage:   float
    time_taken:   int
    results:      List[QuestionResult]
    created_at:   Optional[datetime] = None

# ─── INTERVIEW ────────────────────────────────────────────────────────────────

class StartInterview(BaseModel):
    company_id: str
    role:       str
    resume_text: Optional[str] = ""

class InterviewAnswer(BaseModel):
    session_id:  str
    question_id: str
    answer_text: str

class InterviewFeedback(BaseModel):
    question:       str
    answer:         str
    score:          int           # 0–10
    strengths:      List[str]
    improvements:   List[str]
    model_answer:   str

class InterviewSession(BaseModel):
    id:          Optional[str]   = None
    user_id:     str
    company_id:  str
    role:        str
    questions:   List[str]
    answers:     List[dict]      = []
    feedback:    List[dict]      = []
    overall_score: Optional[float] = None
    status:      str             = "active"  # active | completed
    created_at:  Optional[datetime] = None

# ─── ANALYTICS ───────────────────────────────────────────────────────────────

class UserStats(BaseModel):
    total_tests:       int
    total_interviews:  int
    avg_score:         float
    best_company:      Optional[str]
    weak_categories:   List[str]
    recent_results:    List[dict]
