from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.schemas import MeOut, TokenOut
from app.security import create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.login == form.username))
    if user is None or not user.is_active or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Невірний логін або пароль")
    return TokenOut(access_token=create_access_token(user))


@router.get("/me", response_model=MeOut)
def me(user: User = Depends(get_current_user)):
    return user
