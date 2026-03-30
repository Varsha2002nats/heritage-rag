import os, json
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

with open('../data/items.json') as f:
    all_items = json.load(f)

try:
    with open('../data/vectors.json') as f:
        existing_vectors = json.load(f)
except:
    existing_vectors = []

existing_ids = {v['id'] for v in existing_vectors}
new_items = [i for i in all_items if i['id'] not in existing_ids]

print(f'New items to embed: {len(new_items)}')
results = list(existing_vectors)

for i, item in enumerate(new_items):
    try:
        text = f"{item['title']}. {item['description']}"
        emb = client.embeddings.create(
            input=[text], model='text-embedding-3-small'
        ).data[0].embedding
        results.append({
            'id': item['id'],
            'text': text,
            'embedding': emb,
            'metadata': {
                'title': item['title'],
                'description': item['description'],
                'image_url': item.get('image_url', ''),
                'source_url': item.get('source_url', ''),
                'type': item.get('type', ''),
                'language': item.get('language', 'en'),
                'date': item.get('date', ''),
                'query_tag': item.get('query_tag', '')
            }
        })
        if (i+1) % 20 == 0:
            with open('../data/vectors.json', 'w') as f:
                json.dump(results, f)
            print(f'  {i+1}/{len(new_items)} embedded...')
    except Exception as e:
        print(f'  Skip {i}: {e}')

with open('../data/vectors.json', 'w') as f:
    json.dump(results, f)

print(f'Done. Total vectors: {len(results)}')