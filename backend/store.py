import os, json, numpy as np
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

with open('../data/items.json') as f:
    items = json.load(f)

print(f'Embedding {len(items)} items...')
results = []

for i, item in enumerate(items):
    try:
        text = f"{item['title']}. {item['description']}"
        emb = client.embeddings.create(
            input=[text], 
            model='text-embedding-3-small'
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
        if (i+1) % 10 == 0:
            print(f'  {i+1}/{len(items)} embedded...')
            # Save progress every 10 items
            with open('../data/vectors.json', 'w') as f:
                json.dump(results, f)
    except Exception as e:
        print(f'  Skip {i}: {e}')

with open('../data/vectors.json', 'w') as f:
    json.dump(results, f)

print(f'Done. {len(results)} vectors saved to data/vectors.json')