from fastapi import APIRouter, HTTPException, status
from database import get_db
from models import UserRegister, UserLogin, Token, UserOut
from auth_utils import hash_password, verify_password, create_token

router = APIRouter()

@router.post("/register", response_model=Token, status_code=201)
async def register(body: UserRegister):
    db = get_db()
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = {
        "name":     body.name,
        "email":    body.email,
        "password": hash_password(body.password),
        "created_at": __import__("datetime").datetime.utcnow()
    }
    result  = await db.users.insert_one(user)
    user_id = str(result.inserted_id)

    token = create_token({"sub": user_id})
    return Token(
        access_token=token,
        user=UserOut(id=user_id, name=body.name, email=body.email)
    )


@router.post("/login", response_model=Token)
async def login(body: UserLogin):
    db   = get_db()
    user = await db.users.find_one({"email": body.email})

    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token   = create_token({"sub": user_id})
    return Token(
        access_token=token,
        user=UserOut(id=user_id, name=user["name"], email=user["email"])
    )


@router.get("/me", response_model=UserOut)
async def me(current_user=__import__("fastapi").Depends(__import__("auth_utils").get_current_user)):
    return UserOut(
        id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"]
    )
