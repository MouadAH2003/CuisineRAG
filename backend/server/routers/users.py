from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from server.schemas import Token
from functools import wraps


from server.auth.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    verify_token,
    create_user
)
from datetime import timedelta
from server.models import User as UserModel
from server.database import database
from server.schemas import UserBase,UserCreate
router = APIRouter()

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=15)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserBase)
async def get_me(current_user: UserModel = Depends(get_current_user)):
    return current_user



@router.post("/validate-token")
async def validate_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing")
    
    token = authorization.split(" ")[1] if authorization.startswith("Bearer ") else authorization
    verify_token(token)
    return {"detail": "Token is valid"}

def require_admin():
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, current_user: UserModel = Depends(get_current_user), **kwargs):
            if not current_user.is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions",
                )
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator
@router.get("/protected")
async def protected_route(current_user: UserModel = Depends(get_current_user)):
    return {"message": f"Hello, {current_user.username}! This is a protected route."}

@router.get("/admin-only")
@require_admin()
async def admin_only_route(current_user: UserModel = Depends(get_current_user)):
    import logging
    logging.info(f"Accessing admin-only route by user: {current_user.username}")
    return {"message": f"Hello, {current_user.username}! This is an admin-only route."}


@router.post("/add-user", response_model=UserBase)
async def create_new_user(user: UserCreate):
    new_user = await create_user(user.username, user.password, user.is_admin)
    return new_user