"""
Run once to seed questions into MongoDB:
    python seed.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb://localhost:27017"
DB_NAME   = "campuscode"

QUESTIONS = [
    # ── TCS Quantitative ─────────────────────────────────────────────────────
    {"company_id": "tcs", "test_id": "tcs-quant", "type": "mcq", "category": "Quantitative Aptitude", "difficulty": "Medium",
     "question": "A train travels 360 km in 4 hours. What is its average speed?",
     "options": ["80 km/h","90 km/h","100 km/h","110 km/h"], "correct": 1, "explanation": "Speed = Distance/Time = 360/4 = 90 km/h"},

    {"company_id": "tcs", "test_id": "tcs-quant", "type": "mcq", "category": "Quantitative Aptitude", "difficulty": "Medium",
     "question": "A shop gives 20% discount on an item marked ₹500. Selling price?",
     "options": ["₹350","₹380","₹400","₹420"], "correct": 2, "explanation": "500 - 20% of 500 = 400"},

    {"company_id": "tcs", "test_id": "tcs-quant", "type": "mcq", "category": "Quantitative Aptitude", "difficulty": "Medium",
     "question": "If P is 60% of Q, Q is what percent of P?",
     "options": ["150%","166.67%","140%","180%"], "correct": 1, "explanation": "Q = P/0.6 ≈ 166.67% of P"},

    # ── TCS Verbal ───────────────────────────────────────────────────────────
    {"company_id": "tcs", "test_id": "tcs-verbal", "type": "mcq", "category": "Verbal Ability", "difficulty": "Medium",
     "question": "Choose the word most similar in meaning to 'ELOQUENT':",
     "options": ["Silent","Fluent","Confused","Rude"], "correct": 1, "explanation": "Eloquent means fluent or persuasive."},

    {"company_id": "tcs", "test_id": "tcs-verbal", "type": "mcq", "category": "Verbal Ability", "difficulty": "Easy",
     "question": "Identify the grammatically correct sentence:",
     "options": ["He don't know the answer","She doesn't knows the answer","They doesn't know it","He doesn't know the answer"],
     "correct": 3, "explanation": "Third person singular uses 'doesn't' + base form."},

    # ── TCS Logical ──────────────────────────────────────────────────────────
    {"company_id": "tcs", "test_id": "tcs-logical", "type": "mcq", "category": "Logical Reasoning", "difficulty": "Medium",
     "question": "Find the next number in the series: 2, 6, 12, 20, 30, ?",
     "options": ["40","42","44","46"], "correct": 1, "explanation": "Differences: 4,6,8,10,12 → 30+12=42"},

    {"company_id": "tcs", "test_id": "tcs-logical", "type": "mcq", "category": "Logical Reasoning", "difficulty": "Medium",
     "question": "All cats are animals. Some animals are dogs. Which conclusion is valid?",
     "options": ["Some cats are dogs","Some dogs are cats","Some animals are cats","All animals are cats"],
     "correct": 2, "explanation": "Since all cats are animals, some animals (the cats) are cats."},

    # ── TCS Coding ───────────────────────────────────────────────────────────
    {"company_id": "tcs", "test_id": "tcs-coding", "type": "mcq", "category": "Coding Round", "difficulty": "Medium",
     "question": "What is the time complexity of binary search?",
     "options": ["O(n)","O(n²)","O(log n)","O(1)"], "correct": 2, "explanation": "Binary search halves search space → O(log n)"},

    {"company_id": "tcs", "test_id": "tcs-coding", "type": "mcq", "category": "Coding Round", "difficulty": "Hard",
     "question": "Which data structure uses LIFO principle?",
     "options": ["Queue","Array","Stack","Linked List"], "correct": 2, "explanation": "Stack follows LIFO."},

    {"company_id": "tcs", "test_id": "tcs-coding", "type": "mcq", "category": "Coding Round", "difficulty": "Medium",
     "question": "Which sort has best average time complexity?",
     "options": ["Bubble Sort","Selection Sort","Merge Sort","Insertion Sort"],
     "correct": 2, "explanation": "Merge Sort: O(n log n) average."},

    # ── Amazon Leadership ─────────────────────────────────────────────────────
    {"company_id": "amazon", "test_id": "amz-lp", "type": "mcq", "category": "HR Round", "difficulty": "Medium",
     "question": "Which Amazon Leadership Principle relates to making decisions with incomplete information?",
     "options": ["Deliver Results","Bias for Action","Are Right A Lot","Think Big"],
     "correct": 1, "explanation": "Bias for Action: speed matters, many decisions are reversible."},

    {"company_id": "amazon", "test_id": "amz-lp", "type": "mcq", "category": "HR Round", "difficulty": "Medium",
     "question": "Amazon's 'Customer Obsession' principle means:",
     "options": ["Focusing only on profit","Starting with the customer and working backwards","Treating customers as data points","Reducing customer support costs"],
     "correct": 1, "explanation": "Amazon starts with the customer experience and works backwards to the technology."},

    # ── General CS ───────────────────────────────────────────────────────────
    {"company_id": "google", "test_id": "ggl-coding1", "type": "mcq", "category": "Coding Round", "difficulty": "Hard",
     "question": "What is the space complexity of merge sort?",
     "options": ["O(1)","O(log n)","O(n)","O(n log n)"], "correct": 2, "explanation": "Merge sort requires O(n) auxiliary space for merging."},

    {"company_id": "google", "test_id": "ggl-quant", "type": "mcq", "category": "Quantitative Aptitude", "difficulty": "Hard",
     "question": "How many ways can 4 people sit in a row?",
     "options": ["12","16","24","32"], "correct": 2, "explanation": "4! = 4×3×2×1 = 24"},

    {"company_id": "microsoft", "test_id": "microsoft-coding", "type": "mcq", "category": "Coding Round", "difficulty": "Hard",
     "question": "In OOP, which principle states that a child class can be used in place of its parent class?",
     "options": ["Encapsulation","Abstraction","Liskov Substitution","Open/Closed"],
     "correct": 2, "explanation": "Liskov Substitution Principle (LSP) from SOLID."},
]

async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db     = client[DB_NAME]

    # Clear existing
    await db.questions.delete_many({})
    await db.users.create_index("email", unique=True)
    await db.test_results.create_index([("user_id", 1), ("company_id", 1)])
    await db.interview_sessions.create_index([("user_id", 1), ("status", 1)])

    result = await db.questions.insert_many(QUESTIONS)
    print(f"✅ Seeded {len(result.inserted_ids)} questions into MongoDB '{DB_NAME}'")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
