from fastapi import FastAPI
from server.routers import rag
from server.routers import users
from fastapi.middleware.cors import CORSMiddleware
from server.database import database, Base, engine


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specific origins if necessary
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await database.connect()
    Base.metadata.create_all(bind=engine)  # Ensure tables are created

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()



# Include the RAG router
app.include_router(rag.router)
app.include_router(users.router, prefix="/users", tags=["users"])
# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
