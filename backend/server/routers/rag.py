from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from RAG.rag import Assistant  # Import your RAG application
from server.auth.auth import get_current_user

router = APIRouter()

# Initialize the Assistant class
try:
    assistant = Assistant()

except:
    pass

class QueryPayload(BaseModel):
    query: str

@router.websocket("/ws/generate_stream")
async def websocket_generate_stream(websocket: WebSocket):
    
     # Create knowledge base and chat engine   
    await websocket.accept()
    assistant._create_chat_engine()
    while True:
        try:
            data = await websocket.receive_text()
            # Use assistant to interact with LLM and stream responses
            response_stream = assistant.interact_with_llm(data)
            full_text = ""
            await websocket.send_json(response_stream)
        except WebSocketDisconnect:
            print("WebSocket connection closed by client.")
            break
        except Exception as e:
            await websocket.send_json({"error": str(e)})

@router.post("/query")
async def query(payload: QueryPayload,token: str = Depends(get_current_user)):
    assistant._create_chat_engine()
    try:
        response = assistant.interact_with_llm(payload.query)
        return JSONResponse(content={"response": response})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
