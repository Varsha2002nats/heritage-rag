import os, json, numpy as np
from dotenv import load_dotenv
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
VECTORS_PATH = os.getenv("VECTORS_PATH", "../data/vectors.json")
EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o"
TOP_K = 5

openai_client = OpenAI(api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = """You are a cultural heritage assistant for the Heritage Archive Explorer.

Your rules:
1. Answer ONLY using the artifacts provided in the context below.
2. Always answer in {language}.
3. Cite every artifact you reference by its title and ID, using the format: [Title](ID).
4. If the context does not contain enough information to answer, say so clearly — never fabricate.
5. Be informative, precise, and engaging. Your audience values historical accuracy.
6. Structure your answer with clear paragraphs. Keep it under 400 words."""

_store = None

def load_store():
    global _store
    if _store is None:
        with open(VECTORS_PATH) as f:
            _store = json.load(f)
    return _store

def cosine_similarity(a, b):
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
def _embed_question(question: str) -> list[float]:
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL, input=[question]
    )
    return response.data[0].embedding

def retrieve(question: str, top_k: int = TOP_K) -> list[dict]:
    store = load_store()
    embedding = _embed_question(question)
    scored = sorted(
        [(cosine_similarity(embedding, item["embedding"]), item) for item in store],
        key=lambda x: x[0], reverse=True
    )
    sources = []
    for score, item in scored[:top_k]:
        m = item["metadata"]
        sources.append({
            "id": item["id"],
            "title": m.get("title", "Untitled"),
            "description": m.get("description", ""),
            "image_url": m.get("image_url", ""),
            "source_url": m.get("source_url", ""),
            "type": m.get("type", ""),
            "date": m.get("date", ""),
            "language": m.get("language", ""),
            "similarity": round(score, 4),
        })
    return sources

def _build_context(sources: list[dict]) -> str:
    lines = []
    for i, src in enumerate(sources, 1):
        lines.append(
            f"[{i}] ID: {src['id']}\n"
            f"    Title: {src['title']}\n"
            f"    Type: {src['type']}\n"
            f"    Date: {src['date']}\n"
            f"    Description: {src['description'][:500]}\n"
        )
    return "\n".join(lines)

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=15))
def _generate_answer(question: str, context: str, language: str) -> str:
    system = SYSTEM_PROMPT.format(language=language)
    response = openai_client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": f"Context artifacts:\n{context}\n\nQuestion: {question}"}
        ],
        temperature=0.3,
        max_tokens=600,
    )
    return response.choices[0].message.content.strip()

def query(question: str, language: str = "English") -> dict:
    sources = retrieve(question)
    if not sources:
        fallback = "Aucun artefact pertinent trouvé." if language == "French" else "No relevant artifacts found."
        return {"answer": fallback, "sources": []}
    context = _build_context(sources)
    answer = _generate_answer(question, context, language)
    return {"answer": answer, "sources": sources}