import json
from urllib.parse import quote

with open('../data/items.json') as f:
    items = json.load(f)

fixed = 0
for item in items:
    title = item.get('title', '')
    query_tag = item.get('query_tag', '')
    search_term = quote(title[:50]) if title else quote(query_tag)
    item['source_url'] = f'https://www.europeana.eu/en/search?query={search_term}'
    fixed += 1

with open('../data/items.json', 'w') as f:
    json.dump(items, f)

print(f'Fixed {fixed} items in items.json')

with open('../data/vectors.json') as f:
    vectors = json.load(f)

for v in vectors:
    title = v['metadata'].get('title', '')
    query_tag = v['metadata'].get('query_tag', '')
    search_term = quote(title[:50]) if title else quote(query_tag)
    v['metadata']['source_url'] = f'https://www.europeana.eu/en/search?query={search_term}'

with open('../data/vectors.json', 'w') as f:
    json.dump(vectors, f)

print(f'Fixed {len(vectors)} vectors in vectors.json')
print('Sample URL:', vectors[0]['metadata']['source_url'])