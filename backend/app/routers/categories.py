"""Asset categories CRUD (Org Setup — Categories tab). Was missing entirely."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.rbac import require_role
from app.database import get_db
from app.models.asset_category import AssetCategory
from app.models.employee import Employee, Role
from app.models.enums import UserStatus
from app.schemas.category import CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(
    _: Employee = Depends(get_current_user), db: Session = Depends(get_db)
):
    return db.query(AssetCategory).order_by(AssetCategory.id).all()


@router.post(
    "",
    response_model=CategoryOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(Role.ADMIN, Role.ASSET_MANAGER))],
)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    cat = AssetCategory(
        name=payload.name,
        custom_fields=payload.custom_fields,
        status=UserStatus.ACTIVE.value,
    )
    db.add(cat)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A category with this name already exists.")
    db.refresh(cat)
    return cat
