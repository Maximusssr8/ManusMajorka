---
name: rag-patterns
description: Production RAG patterns — chunking, embeddings, hybrid retrieval (BM25 + vector), agentic RAG with LangGraph, reranking. Use for semantic product search and "find similar products" features.
---

# Production RAG Patterns (from production-agentic-rag-course)

Pipeline: Documents → Chunk → Embed → Index → Retrieve (hybrid BM25 + vector) → Grade → Rewrite → Generate. OpenSearch + Jina Embeddings + LangGraph agentic routing.

## 1. Chunking Strategy

Hybrid section-based chunking:
- Sections 100-800 words: single chunk (with title prefix)
- Sections <100 words: combine with adjacent
- Sections >800 words: split with 100-word overlap
- Default: 600 words/chunk

**For Majorka products (50-200 words):** Single chunk per product, enriched with metadata:
```
"{title}. {description}. Price: ${price_aud}. Tags: {tags}. {trend_reason}"
```

## 2. Embedding Pipeline

Course: Jina v3 (1024d). **For Majorka: OpenAI text-embedding-3-small (1536d)**

```typescript
import OpenAI from 'openai';
const openai = new OpenAI();

async function embedProduct(p: { title: string; description: string; price: number }) {
  const text = `${p.title}. ${p.description}. Price: $${p.price} AUD`;
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text });
  return res.data[0].embedding; // float[1536]
}

// Batch (up to 2048 inputs)
async function embedAll(products: Product[]) {
  const texts = products.map(p => `${p.title}. ${p.description}. Price: $${p.price} AUD`);
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: texts });
  return res.data.map(d => d.embedding);
}
```

## 3. Hybrid Retrieval (BM25 + Vector)

### Vector Index (HNSW)
```sql
-- Supabase pgvector
ALTER TABLE trend_signals ADD COLUMN embedding vector(1536);
CREATE INDEX ON trend_signals USING hnsw (embedding vector_cosine_ops);
```

### Semantic Search
```sql
SELECT *, 1 - (embedding <=> query_embedding) AS similarity
FROM trend_signals
WHERE 1 - (embedding <=> query_embedding) > 0.7
ORDER BY embedding <=> query_embedding
LIMIT 10;
```

### BM25 with Field Boosting
```python
{"multi_match": {
    "query": user_query,
    "fields": ["chunk_text^3", "title^2", "abstract^1"],
    "type": "best_fields", "fuzziness": "AUTO"
}}
```

### RRF Fusion
```
Score = sum(1 / (60 + rank_in_each_list))
# Combines BM25 keyword match + vector semantic match
```

## 4. Agentic RAG (LangGraph)

```python
workflow = StateGraph(AgentState)
workflow.add_node("guardrail", guardrail_step)       # scope check (0-100 score)
workflow.add_node("retrieve", retrieve_step)          # fetch documents
workflow.add_node("grade_documents", grade_step)      # LLM binary relevance
workflow.add_node("rewrite_query", rewrite_step)      # improve query
workflow.add_node("generate_answer", generate_step)   # final answer

# Flow: guardrail → retrieve → grade → (generate OR rewrite → retrieve)
# Max 2 retrieval attempts before fallback
```

**Guardrail:** LLM scores query relevance 0-100. Below 60 = out of scope.
**Grading:** LLM binary yes/no on retrieved docs. No = rewrite query and retry.
**Rewriting:** LLM rewrites query with better keywords. Fallback: append generic terms.

## 5. Caching

```python
# Redis exact-match: SHA256(query + model + top_k) → cached response
# O(1) lookup, configurable TTL
```

## Majorka Application

### "Find Products Like This"

```typescript
// API: GET /api/products/similar?id=123
async function findSimilar(productId: string) {
  const { data: source } = await supabase
    .from('trend_signals').select('embedding').eq('id', productId).single();

  const { data: similar } = await supabase.rpc('match_products', {
    query_embedding: source.embedding,
    match_threshold: 0.7,
    match_count: 10,
  });
  return similar;
}
```

### pgvector RPC Function

```sql
CREATE OR REPLACE FUNCTION match_products(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint, product_title text, description text,
  avg_unit_price_aud numeric, ai_score integer, similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT ts.id, ts.product_title, ts.description, ts.avg_unit_price_aud, ts.ai_score,
    1 - (ts.embedding <=> query_embedding) AS similarity
  FROM trend_signals ts
  WHERE 1 - (ts.embedding <=> query_embedding) > match_threshold
  ORDER BY ts.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### Implementation Path

1. Enable pgvector in Supabase (already available)
2. `ALTER TABLE trend_signals ADD COLUMN embedding vector(1536)`
3. Generate embeddings for existing 50+ products
4. Add embedding step to `scripts/refresh-products.mjs`
5. `GET /api/products/search?q=...` — hybrid search endpoint
6. `GET /api/products/similar?id=...` — vector similarity endpoint
7. Replace keyword filter in UI with semantic search

## Key Patterns

| Pattern | When to Use |
|---------|-------------|
| Single-chunk products | Short content (<500 words) |
| Hybrid BM25 + Vector | Keywords AND concepts search |
| RRF fusion | Combine rankings without weight tuning |
| LLM grading | Precision reranking |
| Query rewriting | Poor initial retrieval |
| Attempt limiting | Max 2 retrieval loops |
| Exact-match cache | Repeated queries (Redis) |
