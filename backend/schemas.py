from pydantic import BaseModel, EmailStr, constr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: constr(min_length=3, max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    password: constr(min_length=8)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Message schemas
class MessageBase(BaseModel):
    content: str
    search_mode: Optional[str] = "knowledge_base"

class MessageCreate(MessageBase):
    conversation_id: int

class MessageResponse(MessageBase):
    id: int
    conversation_id: int
    is_user: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Conversation schemas
class ConversationBase(BaseModel):
    title: Optional[str] = None

class ConversationCreate(ConversationBase):
    pass

class ConversationUpdate(ConversationBase):
    is_active: Optional[bool] = None

class ConversationResponse(ConversationBase):
    id: int
    session_id: str
    user_id: int
    created_at: datetime
    last_activity: datetime
    is_active: bool
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True

# Chat schemas
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    use_real_time: Optional[bool] = False

class ChatResponse(BaseModel):
    message: MessageResponse
    conversation: ConversationResponse

# List response schemas
class ConversationList(BaseModel):
    conversations: List[ConversationResponse]
    total: int
    page: int
    page_size: int

class MessageList(BaseModel):
    messages: List[MessageResponse]
    total: int
    page: int
    page_size: int
