import os, json, re
from collections import defaultdict
from dotenv import load_dotenv
load_dotenv()

VECTORS_PATH = os.getenv("VECTORS_PATH", "../data/vectors.json")

THEME_KEYWORDS = [
    "gold", "silver", "trade", "religion", "church", "mosque", "temple",
    "king", "queen", "emperor", "sultan", "dynasty", "empire",
    "ship", "voyage", "expedition", "war", "battle", "conquest",
    "art", "painting", "sculpture", "architecture", "calligraphy",
    "manuscript", "book", "text", "document", "letter",
    "africa", "europe", "asia", "arabia", "persia", "egypt", "india",
    "ottoman", "roman", "greek", "arabic", "latin",
    "silk", "spice", "market", "port", "city",
]

TYPE_COLORS = {
    "manuscript": "#f59e0b",
    "map":        "#14b8a6",
    "photograph": "#3b82f6",
    "photo":      "#3b82f6",
    "text":       "#64748b",
    "image":      "#8b5cf6",
    "sound":      "#ec4899",
    "video":      "#f43f5e",
}
DEFAULT_COLOR = "#94a3b8"

_graph_cache = None

def _decade(date_str):
    match = re.search(r"\b(\d{4})\b", date_str or "")
    if match:
        year = int(match.group(1))
        return f"{(year // 10) * 10}s"
    return None

def _keywords_in(text):
    lower = text.lower()
    return {kw for kw in THEME_KEYWORDS if kw in lower}

def _node_color(item_type):
    key = (item_type or "").lower().strip()
    for k, color in TYPE_COLORS.items():
        if k in key:
            return color
    return DEFAULT_COLOR

def build_graph() -> dict:
    global _graph_cache
    if _graph_cache is not None:
        return _graph_cache

    with open(VECTORS_PATH) as f:
        store = json.load(f)

    if not store:
        return {"nodes": [], "edges": [], "stats": {"total": 0, "by_type": {}}}

    nodes = []
    by_type = defaultdict(list)
    by_decade = defaultdict(list)
    keyword_map = {}

    for item in store:
        m = item["metadata"]
        item_type = (m.get("type") or m.get("query_tag") or "text").lower()
        date_str = m.get("date", "")
        title = m.get("title", "Untitled")
        description = m.get("description", "")

        by_type[item_type].append(item["id"])
        decade = _decade(date_str)
        if decade:
            by_decade[decade].append(item["id"])
        keyword_map[item["id"]] = _keywords_in(f"{title} {description}")

        nodes.append({
            "id": item["id"],
            "label": title[:60],
            "type": item_type,
            "color": _node_color(item_type),
            "image_url": m.get("image_url", ""),
            "source_url": m.get("source_url", ""),
            "date": date_str,
            "description": description[:200],
            "query_tag": m.get("query_tag", ""),
            "size": 6,
        })

    edges = []
    edge_set = set()
    connection_count = defaultdict(int)

    def add_edge(a, b, reason):
        key = frozenset({a, b})
        if key not in edge_set and a != b:
            edge_set.add(key)
            edges.append({"source": a, "target": b, "reason": reason})
            connection_count[a] += 1
            connection_count[b] += 1

    for item_type, members in by_type.items():
        for i, uid in enumerate(members):
            for other in members[i + 1: i + 4]:
                add_edge(uid, other, f"type:{item_type}")

    for decade, members in by_decade.items():
        for i, uid in enumerate(members):
            for other in members[i + 1: i + 3]:
                add_edge(uid, other, f"decade:{decade}")

    node_ids = list(keyword_map.keys())
    for i, uid_a in enumerate(node_ids):
        for uid_b in node_ids[i + 1: i + 6]:
            shared = keyword_map[uid_a] & keyword_map[uid_b]
            if len(shared) >= 2:
                add_edge(uid_a, uid_b, f"keywords:{','.join(list(shared)[:3])}")

    max_conn = max(connection_count.values(), default=1)
    size_map = {uid: 6 + round((count / max_conn) * 14) for uid, count in connection_count.items()}
    for node in nodes:
        node["size"] = size_map.get(node["id"], 6)

    _graph_cache = {
        "nodes": nodes,
        "edges": edges,
        "stats": {"total": len(store), "by_type": {k: len(v) for k, v in by_type.items()}}
    }
    return _graph_cache