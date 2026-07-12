from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.employee import Employee, Role
from app.schemas.auth import LoginIn, SignupIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_session(response: Response, user: Employee) -> TokenOut:
    token = create_access_token(user.id, user.role)
    # httponly session cookie for the browser; body token for API clients.
    response.set_cookie(
        key="session",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/signup", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupIn, response: Response, db: Session = Depends(get_db)):
    # role is NOT taken from the payload — always Employee. Any injected role
    # was already dropped by the schema; we hard-set it here as a second guard.
    user = Employee(
        name=payload.name,
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=Role.EMPLOYEE.value,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Duplicate email hits the DB-level unique constraint -> clean 409, not 500.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    db.refresh(user)
    return _issue_session(response, user)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.query(Employee).filter(Employee.email == payload.email.lower()).first()
    # Same error whether the email is unknown or the password is wrong (no user enum).
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    return _issue_session(response, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response):
    response.delete_cookie("session")


@router.get("/me", response_model=UserOut)
def me(current: Employee = Depends(get_current_user)):
    return current


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(email: str):
    # Stub per plan. Always returns 202 so we don't leak which emails exist.
    return {"detail": "If that account exists, a reset link has been sent."}
