from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, companies, tests, interview, analytics
from database import connect_db, disconnect_db

app = FastAPI(title="CampusCode API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup(): await connect_db()

@app.on_event("shutdown")
async def shutdown(): await disconnect_db()

app.include_router(auth.router,       prefix="/auth",       tags=["Auth"])
app.include_router(companies.router,  prefix="/companies",  tags=["Companies"])
app.include_router(tests.router,      prefix="/tests",      tags=["Tests"])
app.include_router(interview.router,  prefix="/interview",  tags=["Interview"])
app.include_router(analytics.router,  prefix="/analytics",  tags=["Analytics"])

@app.get("/")
def root(): return {"message": "CampusCode API running ✅"}