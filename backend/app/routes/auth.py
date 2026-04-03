from fastapi import APIRouter, HTTPException, status
from app.schemas import LoginRequest, LoginResponse
from app.auth import authenticate_admin, create_access_token

router = APIRouter(tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest):
    """Authenticate admin user and return JWT token."""
    if not authenticate_admin(data.username, data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(data={"sub": data.username})
    return LoginResponse(access_token=token)
