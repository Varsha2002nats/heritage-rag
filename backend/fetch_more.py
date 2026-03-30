import os, json, hashlib, httpx
from dotenv import load_dotenv
load_dotenv()

EUROPEANA_API_KEY = os.getenv('EUROPEANA_API_KEY')

EXTRA_QUERIES = [
    'ancient egypt', 'greek antiquity', 'roman empire',
    'ottoman empire', 'persian art', 'chinese scroll',
    'buddhist manuscript', 'aztec', 'indigenous art',
    'renaissance painting', 'arabic calligraphy', 'viking',
    'hindu temple', 'african mask', 'colonial archive',
    'world war photograph', 'trade route', 'ancient coin',
    'illuminated manuscript', 'cartography'
]

with open('../data/items.json') as f:
    existing = json.load(f)

existing_titles = {i['title'] for i in existing}
new_items = []

for q in EXTRA_QUERIES:
    try:
        r = httpx.get(
            'https://api.europeana.eu/record/v2/search.json',
            params={'wskey': EUROPEANA_API_KEY, 'query': q,
                    'rows': 40, 'profile': 'rich', 'media': 'true'},
            timeout=20
        )
        raw = r.json().get('items', [])
        for item in raw:
            title = (item.get('title') or [''])[0]
            if title and title not in existing_titles:
                existing_titles.add(title)
                new_items.append({
                    'id': hashlib.md5(title.encode()).hexdigest(),
                    'title': title,
                    'description': ((item.get('dcDescription') or ['']))[0][:500] if item.get('dcDescription') else '',
                    'image_url': (item.get('edmPreview') or [''])[0],
                    'source_url': item.get('guid') or item.get('link') or '',
                    'type': (item.get('type') or [q])[0].lower(),
                    'language': (item.get('language') or ['en'])[0],
                    'date': str((item.get('year') or [''])[0]),
                    'query_tag': q
                })
        print(f"{q}: {len(raw)} items")
    except Exception as e:
        print(f"Failed {q}: {e}")

all_items = existing + new_items
with open('../data/items.json', 'w') as f:
    json.dump(all_items, f)

print(f'\nAdded {len(new_items)} new items. Total: {len(all_items)}')