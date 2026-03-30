import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from rag import query as rag_query, load_store
from graph import build_graph
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading vector store...")
    try:
        load_store()
        print("Vector store ready.")
    except Exception as e:
        print(f"[WARN] Could not pre-load store: {e}")
    yield
    print("Shutting down.")

app = FastAPI(title="Heritage Archive RAG API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=500)
    language: str = Field(default="English", pattern="^(English|French)$")

@app.get("/api/health")
async def health():
    try:
        store = load_store()
        return {"status": "ok", "archive_items": len(store)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/graph")
async def get_graph():
    try:
        return build_graph()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/query")
async def query_archive(body: QueryRequest):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty.")
    try:
        return rag_query(question=body.question.strip(), language=body.language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))