from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timedelta
import logging
from logging.handlers import RotatingFileHandler
import uvicorn
from typing import Optional

from database import get_db, engine
from models import Base, User, Conversation, Message
from schemas import (
    UserCreate, UserResponse, Token, ConversationCreate, ConversationResponse,
    ConversationList, MessageResponse, MessageList, ChatRequest, ChatResponse
)
from auth import (
    get_current_active_user, authenticate_user, create_access_token,
    get_password_hash, rate_limiter
)
from ai_assistant import EnhancedAssistant

# Create database tables
Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    handlers=[RotatingFileHandler('app.log', maxBytes=100000, backupCount=5)],
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CuisineRAG API",
    description="API for Moroccan recipe recommendations and culinary assistance",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize the assistant
assistant = EnhancedAssistant()

# Authentication endpoints
@app.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    logger.info(f"Incoming registration request: {user}")
    try:
        # Check if username exists
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            logger.warning(f"Username already registered: {user.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        
        # Check if email exists
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            logger.warning(f"Email already registered: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"User registered successfully: {user.username}")
        return db_user
    
    except HTTPException as e:
        logger.error(f"HTTPException during registration: {e}")
        raise
    except Exception as e:
        logger.error(f"Database error during user registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not register user"
        )

@app.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login to get access token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

# Conversation endpoints
@app.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conv: ConversationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new conversation."""
    try:
        db_conversation = Conversation(
            user_id=current_user.id,
            title=conv.title or "New Conversation"
        )
        
        db.add(db_conversation)
        db.commit()
        db.refresh(db_conversation)
        return db_conversation
    
    except Exception as e:
        logger.error(f"Database error creating conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create conversation"
        )


# @app.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_conversation(
#     conversation_id: int,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """Delete a specific conversation."""
#     conversation = db.query(Conversation).filter(
#         Conversation.id == conversation_id,
#         Conversation.user_id == current_user.id
#     ).first()
    
#     if not conversation:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Conversation not found"
#         )
    
#     try:
#         # Delete all messages in the conversation
#         db.query(Message).filter(
#             Message.conversation_id == conversation_id
#         ).delete()
        
#         # Delete the conversation
#         db.delete(conversation)
#         db.commit()
        
#         return JSONResponse(status_code=status.HTTP_204_NO_CONTENT)
    
#     except Exception as e:
#         logger.error(f"Error deleting conversation: {e}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Could not delete conversation"
#         )

@app.get("/conversations", response_model=ConversationList)
async def list_conversations(
    page: int = 1,
    page_size: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List user's conversations."""
    total = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).count()
    
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(
        Conversation.last_activity.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "conversations": conversations,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@app.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific conversation."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation

@app.get("/conversations/{conversation_id}/messages", response_model=MessageList)
async def list_messages(
    conversation_id: int,
    page: int = 1,
    page_size: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List messages in a conversation."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    total = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).count()
    
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(
        Message.created_at.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "messages": messages,
        "total": total,
        "page": page,
        "page_size": page_size
    }

# Chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a message and get a response."""
    # Rate limiting
    if not rate_limiter.is_allowed(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded"
        )
    
    try:
        # Get or create conversation
        if chat_request.conversation_id:
            conversation = db.query(Conversation).filter(
                Conversation.id == chat_request.conversation_id,
                Conversation.user_id == current_user.id
            ).first()
            
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
        else:
            conversation = Conversation(
                user_id=current_user.id,
                title="New Conversation"
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
        
        # Save user message
        user_message = Message(
            conversation_id=conversation.id,
            content=chat_request.message,
            is_user=True,
            search_mode="real_time" if chat_request.use_real_time else "knowledge_base"
        )
        db.add(user_message)
        
        # Get assistant response
        assistant.use_real_time_search = chat_request.use_real_time
        response_text = await assistant.chat(chat_request.message)
        
        # Save assistant response
        assistant_message = Message(
            conversation_id=conversation.id,
            content=response_text,
            is_user=False,
            search_mode="real_time" if chat_request.use_real_time else "knowledge_base"
        )
        db.add(assistant_message)
        
        # Update conversation last activity
        conversation.last_activity = datetime.utcnow()
        
        db.commit()
        db.refresh(assistant_message)
        db.refresh(conversation)
        
        return {
            "message": assistant_message,
            "conversation": conversation
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Check if the API is running."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
