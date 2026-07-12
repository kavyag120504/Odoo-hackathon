"""Auth/RBAC dependencies.

Commit 1 provides `get_current_user` (reads the session token from the
Authorization: Bearer header or the `session` cookie). The reusable role-gate
(`require_role`, dept-scoped checks) lands in Commit 2 and builds on this.
"""

import jwt
from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.employee import Employee

_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


def _extract_token(authorization: str | None, session: str | None) -> str:
    # Prefer the Authorization header (API clients / judges), fall back to cookie.
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    if session:
        return session
    raise _UNAUTHORIZED


def get_current_user(
    authorization: str | None = Header(default=None),
    session: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> Employee:
    token = _extract_token(authorization, session)
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise _UNAUTHORIZED

    user = db.get(Employee, user_id)
    if user is None:
        raise _UNAUTHORIZED
    return user
