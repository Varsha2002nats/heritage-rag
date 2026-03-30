import json, os
from dotenv import load_dotenv
from openai import OpenAI
load_dotenv()

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# 10 sample questions with known relevant topics
TEST_QUESTIONS = [
    {"question": "What manuscripts exist from the Islamic medieval period?", "language": "English"},
    {"question": "Show me ancient maps of Africa", "language": "English"},
    {"question": "What Byzantine artifacts are in the archive?", "language": "English"},
    {"question": "Tell me about silk road trade artifacts", "language": "English"},
    {"question": "What colonial photographs exist in the collection?", "language": "English"},
    {"question": "Quels manuscrits anciens sont disponibles?", "language": "French"},
    {"question": "Montrez-moi des cartes historiques", "language": "French"},
    {"question": "What medieval European artifacts are available?", "language": "English"},
    {"question": "Show me artifacts related to ancient Egypt", "language": "English"},
    {"question": "What photographs from Africa exist in the archive?", "language": "English"},
]

from rag import query as rag_query

results = []

print("Running evaluation on 10 test questions...")
print("=" * 60)

for i, test in enumerate(TEST_QUESTIONS):
    print(f"\nQ{i+1}: {test['question']}")
    result = rag_query(test['question'], test['language'])
    
    answer = result['answer']
    sources = result['sources']
    
    # Metric 1: Context Recall — did we retrieve anything relevant?
    context_recall = 1.0 if len(sources) > 0 else 0.0
    
    # Metric 2: Source Coverage — how many of 5 slots were filled?
    source_coverage = len(sources) / 5.0
    
    # Metric 3: Faithfulness — ask GPT to score if answer is grounded in sources
    context_text = "\n".join([f"- {s['title']}: {s['description'][:200]}" for s in sources])
    
    faithfulness_prompt = f"""Rate how faithful this answer is to the provided sources.
Score from 0.0 to 1.0 where:
1.0 = answer only uses information from sources
0.5 = answer mostly uses sources but adds some outside info  
0.0 = answer ignores sources completely

Sources:
{context_text}

Answer:
{answer}

Reply with only a number between 0.0 and 1.0"""

    faith_response = client.chat.completions.create(
        model='gpt-4o',
        messages=[{'role': 'user', 'content': faithfulness_prompt}],
        temperature=0,
        max_tokens=10
    )
    
    try:
        faithfulness = float(faith_response.choices[0].message.content.strip())
    except:
        faithfulness = 0.5

    # Metric 4: Answer Relevancy — is the answer relevant to the question?
    relevancy_prompt = f"""Rate how relevant this answer is to the question.
Score from 0.0 to 1.0 where:
1.0 = directly and fully answers the question
0.5 = partially answers the question
0.0 = does not answer the question at all

Question: {test['question']}
Answer: {answer}

Reply with only a number between 0.0 and 1.0"""

    rel_response = client.chat.completions.create(
        model='gpt-4o',
        messages=[{'role': 'user', 'content': relevancy_prompt}],
        temperature=0,
        max_tokens=10
    )
    
    try:
        relevancy = float(rel_response.choices[0].message.content.strip())
    except:
        relevancy = 0.5

    result_entry = {
        'question': test['question'],
        'language': test['language'],
        'sources_retrieved': len(sources),
        'context_recall': context_recall,
        'source_coverage': round(source_coverage, 2),
        'faithfulness': round(faithfulness, 2),
        'answer_relevancy': round(relevancy, 2),
    }
    
    results.append(result_entry)
    print(f"  Sources: {len(sources)} | Faithfulness: {faithfulness:.2f} | Relevancy: {relevancy:.2f}")

# Summary
print("\n" + "=" * 60)
print("EVALUATION SUMMARY")
print("=" * 60)

avg_faithfulness = sum(r['faithfulness'] for r in results) / len(results)
avg_relevancy = sum(r['answer_relevancy'] for r in results) / len(results)
avg_coverage = sum(r['source_coverage'] for r in results) / len(results)
avg_recall = sum(r['context_recall'] for r in results) / len(results)

print(f"Context Recall:      {avg_recall:.2f} / 1.00")
print(f"Source Coverage:     {avg_coverage:.2f} / 1.00")
print(f"Faithfulness:        {avg_faithfulness:.2f} / 1.00")
print(f"Answer Relevancy:    {avg_relevancy:.2f} / 1.00")
print(f"Overall RAG Score:   {(avg_faithfulness + avg_relevancy + avg_coverage + avg_recall)/4:.2f} / 1.00")

with open('../data/evaluation_results.json', 'w') as f:
    json.dump({
        'results': results,
        'summary': {
            'context_recall': round(avg_recall, 3),
            'source_coverage': round(avg_coverage, 3),
            'faithfulness': round(avg_faithfulness, 3),
            'answer_relevancy': round(avg_relevancy, 3),
            'overall': round((avg_faithfulness + avg_relevancy + avg_coverage + avg_recall)/4, 3)
        }
    }, f, indent=2)

print("\nFull results saved to data/evaluation_results.json")