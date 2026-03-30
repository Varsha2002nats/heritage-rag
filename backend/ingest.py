import os
import time
import hashlib
from dotenv import load_dotenv
import httpx
import chromadb
from chromadb.config import Settings
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EUROPEANA_API_KEY = os.getenv("EUROPEANA_API_KEY")
CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "../data/chroma_db")
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "heritage_archive")

EUROPEANA_BASE = "https://api.europeana.eu/record/v2/search.json"
EMBEDDING_MODEL = "text-embedding-3-small"
BATCH_SIZE = 20  # items per embedding batch

QUERIES = [
    "manuscript",
    "ancient map",
    "islamic art",
    "african heritage",
    "medieval",
    "byzantine",
    "silk road",
    "colonial photograph",
]

openai_client = OpenAI(api_key=OPENAI_API_KEY)


# ---------------------------------------------------------------------------
# Europeana fetch
# ---------------------------------------------------------------------------

def fetch_europeana(query: str, rows: int = 40) -> list[dict]:
    """Fetch items from Europeana for a single query string."""
    params = {
        "wskey": EUROPEANA_API_KEY,
        "query": query,
        "rows": rows,
        "profile": "rich",
        "media": "true",
    }
    try:
        with httpx.Client(timeout=20) as client:
            resp = client.get(EUROPEANA_BASE, params=params)
            resp.raise_for_status()
            data = resp.json()
            return data.get("items", [])
    except Exception as e:
        print(f"  [WARN] Europeana fetch failed for '{query}': {e}")
        return []


def parse_item(raw: dict, query: str) -> dict | None:
    """Extract and normalise fields from a raw Europeana item."""
    def first(val):
        if isinstance(val, list):
            return val[0] if val else ""
        return val or ""

    title = first(raw.get("title"))
    description = first(raw.get("dcDescription") or raw.get("dcDescriptionLangAware", {}).get("en") or [])
    image_url = first(raw.get("edmPreview"))
    source_url = first(raw.get("guid") or raw.get("link") or [])
    item_type = first(raw.get("type") or raw.get("dcType") or [query])
    language = first(raw.get("language"))
    date = first(raw.get("year") or raw.get("dcDate") or [])
    europeana_id = raw.get("id", "")

    if not title:
        return None

    # Stable deterministic ID so re-ingestion is idempotent
    uid = hashlib.md5(f"{europeana_id}{title}".encode()).hexdigest()

    return {
        "uid": uid,
        "title": title,
        "description": description[:800] if description else "",
        "image_url": image_url,
        "source_url": source_url,
        "type": item_type.lower() if item_type else query,
        "language": language,
        "date": str(date),
        "europeana_id": europeana_id,
        "query_tag": query,
    }


# ---------------------------------------------------------------------------
# Embedding
# ---------------------------------------------------------------------------

@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, min=2, max=20))
def embed_batch(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts using OpenAI text-embedding-3-small."""
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


# ---------------------------------------------------------------------------
# ChromaDB setup
# ---------------------------------------------------------------------------

def get_collection():
    client = chromadb.PersistentClient(
        path=CHROMA_DB_PATH,
        settings=Settings(anonymized_telemetry=False),
    )
    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )
    return collection


# ---------------------------------------------------------------------------
# Main ingest pipeline
# ---------------------------------------------------------------------------

def ingest():
    print("=" * 60)
    print("Heritage Archive Ingest")
    print("=" * 60)

    collection = get_collection()
    existing_ids = set(collection.get(include=[])["ids"])
    print(f"Existing items in ChromaDB: {len(existing_ids)}\n")

    all_items: list[dict] = []

    # --- Step 1: Fetch from Europeana ---
    for query in QUERIES:
        print(f"Fetching Europeana: '{query}' ...", end=" ", flush=True)
        raw_items = fetch_europeana(query, rows=40)
        parsed = [parse_item(r, query) for r in raw_items]
        parsed = [p for p in parsed if p is not None]
        print(f"{len(parsed)} items")
        all_items.extend(parsed)
        time.sleep(0.3)  # polite rate limiting

    # Deduplicate by uid
    seen = set()
    unique_items = []
    for item in all_items:
        if item["uid"] not in seen:
            seen.add(item["uid"])
            unique_items.append(item)

    print(f"\nTotal unique items fetched: {len(unique_items)}")

    # Filter out items already in ChromaDB
    new_items = [i for i in unique_items if i["uid"] not in existing_ids]
    print(f"New items to embed and store: {len(new_items)}\n")

    if not new_items:
        print("Nothing new to ingest. Done.")
        return

    # --- Step 2: Embed in batches ---
    total_batches = (len(new_items) + BATCH_SIZE - 1) // BATCH_SIZE
    stored = 0

    for batch_idx in range(total_batches):
        batch = new_items[batch_idx * BATCH_SIZE : (batch_idx + 1) * BATCH_SIZE]

        texts = [
            f"{item['title']}. {item['description']}" for item in batch
        ]

        print(
            f"Embedding batch {batch_idx + 1}/{total_batches} "
            f"({len(batch)} items) ...",
            end=" ",
            flush=True,
        )

        try:
            embeddings = embed_batch(texts)
        except Exception as e:
            print(f"FAILED ({e}), skipping batch.")
            continue

        # --- Step 3: Store in ChromaDB ---
        ids = [item["uid"] for item in batch]
        documents = texts
        metadatas = [
            {
                "title": item["title"],
                "description": item["description"],
                "image_url": item["image_url"] or "",
                "source_url": item["source_url"] or "",
                "type": item["type"],
                "language": item["language"] or "",
                "date": item["date"],
                "europeana_id": item["europeana_id"],
                "query_tag": item["query_tag"],
            }
            for item in batch
        ]

        batch_stored = 0
        for i in range(len(ids)):
            try:
                collection.add(
                    documents=[documents[i]],
                    embeddings=[embeddings[i]],
                    ids=[ids[i]],
                    metadatas=[metadatas[i]],
                )
                batch_stored += 1
            except Exception as e:
                print(f"  Skipping {ids[i]}: {e}")

        stored += batch_stored
        print(f"stored {batch_stored}/{len(ids)}. (total so far: {stored})")
        time.sleep(0.1)

    print(f"\nIngest complete. {stored} new items added to ChromaDB.")
    print(f"Collection now has {collection.count()} total items.")


if __name__ == "__main__":
    ingest()
