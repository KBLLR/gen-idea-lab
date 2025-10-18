# Research Papers Tool

**Last Updated**: 2025-10-01

Fetch academic papers and research resources from multiple sources and save them to your knowledge base.

---

## Overview

The `fetch_research_papers` tool searches across multiple academic and research platforms:
- **ArXiv** - Academic papers (physics, math, CS, etc.)
- **HuggingFace Papers** - ML/AI papers with code implementations
- **Semantic Scholar** - Comprehensive academic search
- **GitHub Awesome Lists** - Curated resource collections

Results can be automatically saved to your knowledge space for future reference.

---

## Usage

### Voice Commands

**Basic Search**:
- "Find papers about quantum computing"
- "Search for research on transformers"
- "Look up papers about reinforcement learning"

**With Specific Sources**:
- "Search ArXiv for papers on neural networks"
- "Find HuggingFace papers about diffusion models"

**Save to Knowledge Base**:
- "Find papers on graph theory and save them to my knowledge base"
- "Search for machine learning papers and add them to my notes"

### Programmatic Usage

```javascript
import { executeTool } from './lib/workflowTools.js';

const result = await executeTool('fetch_research_papers', {
  topic: 'quantum computing',
  sources: ['arxiv', 'semantic_scholar', 'huggingface'],
  max_results: 5,
  save_to_knowledge: true,
  module_id: 'SE_01'
});

console.log(result.papers); // Array of paper objects
console.log(result.resources); // Array of GitHub resources
console.log(result.total_found); // Total results found
```

### API Endpoint

**POST** `/api/tools/research-papers`

**Request Body**:
```json
{
  "topic": "transformer architecture",
  "sources": ["arxiv", "huggingface", "semantic_scholar", "github_awesome"],
  "max_results": 5,
  "save_to_knowledge": true,
  "module_id": "SE_01"
}
```

**Response**:
```json
{
  "papers": [
    {
      "source": "arxiv",
      "title": "Attention Is All You Need",
      "summary": "We propose a new simple network architecture...",
      "authors": ["Ashish Vaswani", "Noam Shazeer", "..."],
      "url": "http://arxiv.org/abs/1706.03762",
      "published": "2017-06-12"
    }
  ],
  "resources": [
    {
      "source": "github_awesome",
      "title": "awesome-transformers",
      "description": "A curated list of transformer resources",
      "url": "https://github.com/user/awesome-transformers",
      "stars": 1234,
      "updated": "2025-09-15T10:00:00Z"
    }
  ],
  "sources_searched": ["arxiv", "huggingface", "semantic_scholar", "github_awesome"],
  "total_found": 15,
  "saved_to_knowledge": true,
  "message": "Found 15 items on \"transformer architecture\""
}
```

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | string | ✅ Yes | - | Research topic or subject |
| `sources` | array | ❌ No | `['arxiv', 'huggingface', 'semantic_scholar']` | Sources to search |
| `max_results` | number | ❌ No | `5` | Max results per source |
| `save_to_knowledge` | boolean | ❌ No | `true` | Auto-save to knowledge base |
| `module_id` | string | ⚠️ Conditional | - | Required if `save_to_knowledge` is true |

### Available Sources

- `arxiv` - ArXiv academic papers
- `huggingface` - HuggingFace Papers (ML/AI focus)
- `semantic_scholar` - Semantic Scholar comprehensive search
- `github_awesome` - GitHub Awesome lists (curated resources)

---

## Response Format

### Paper Object

```javascript
{
  source: string,        // 'arxiv' | 'huggingface' | 'semantic_scholar'
  title: string,         // Paper title
  summary: string,       // Abstract or summary
  authors: string[],     // List of authors
  url: string,          // Direct link to paper
  published: string     // Publication date
}
```

### Resource Object (GitHub)

```javascript
{
  source: 'github_awesome',
  title: string,           // Repository full name
  description: string,     // Repository description
  url: string,            // GitHub URL
  stars: number,          // Star count
  updated: string         // Last updated timestamp
}
```

---

## Data Sources

### 1. ArXiv

**API**: `http://export.arxiv.org/api/query`

**Coverage**: Physics, Mathematics, Computer Science, Quantitative Biology, Quantitative Finance, Statistics, Electrical Engineering, Economics

**Features**:
- Free, no API key required
- XML response format
- Full abstracts included

**Example Categories**:
- cs.AI - Artificial Intelligence
- cs.LG - Machine Learning
- cs.CV - Computer Vision
- math.CO - Combinatorics
- physics.atom-ph - Atomic Physics

### 2. HuggingFace Papers

**API**: `https://huggingface.co/api/papers`

**Coverage**: Machine Learning and AI papers with code implementations

**Features**:
- Papers with associated models/datasets
- Community discussions
- Code implementations available

**Focus Areas**:
- NLP (Transformers, LLMs)
- Computer Vision
- Diffusion Models
- Reinforcement Learning

### 3. Semantic Scholar

**API**: `https://api.semanticscholar.org/graph/v1`

**Coverage**: 200M+ papers across all academic fields

**Features**:
- Citation graphs
- Influential citations
- Paper recommendations
- Author information

**Fields Covered**:
- Computer Science
- Biology
- Medicine
- Chemistry
- All academic disciplines

### 4. GitHub Awesome Lists

**API**: GitHub Search API

**Coverage**: Curated lists of tools, papers, and resources

**Features**:
- Community-curated
- Star ratings
- Active maintenance tracking

**Search Format**: Finds repositories with "awesome" prefix matching your topic

---

## Knowledge Base Integration

When `save_to_knowledge` is `true`, each paper/resource is saved to the RAG system with:

**Saved Content**:
```
{title}

{summary/abstract/description}

Authors: {authors}
URL: {url}
```

**Metadata**:
```javascript
{
  type: 'research_paper',
  source: 'arxiv' | 'huggingface' | 'semantic_scholar' | 'github_awesome',
  title: string,
  authors: string[],
  url: string,
  published: string
}
```

This allows you to:
- Query papers later with `rag_query` tool
- Build a personalized research library
- Get paper recommendations based on similarity
- Track reading history per module

---

## Examples

### Example 1: Basic Research

```javascript
const result = await executeTool('fetch_research_papers', {
  topic: 'graph neural networks'
});

// Returns papers from ArXiv, HuggingFace, Semantic Scholar
console.log(result.papers.length); // e.g., 15 papers
```

### Example 2: ArXiv Only

```javascript
const result = await executeTool('fetch_research_papers', {
  topic: 'quantum entanglement',
  sources: ['arxiv'],
  max_results: 10
});

// Returns only ArXiv papers
```

### Example 3: Save to Knowledge Base

```javascript
const result = await executeTool('fetch_research_papers', {
  topic: 'deep reinforcement learning',
  sources: ['arxiv', 'huggingface'],
  max_results: 5,
  save_to_knowledge: true,
  module_id: 'SE_01'
});

// Papers are now queryable via RAG
const relatedPapers = await executeTool('rag_query', {
  query: 'policy gradient methods',
  module_id: 'SE_01'
});
```

### Example 4: GitHub Resources

```javascript
const result = await executeTool('fetch_research_papers', {
  topic: 'machine learning',
  sources: ['github_awesome'],
  max_results: 10
});

console.log(result.resources);
// Returns curated GitHub awesome lists
```

### Example 5: Comprehensive Search

```javascript
const result = await executeTool('fetch_research_papers', {
  topic: 'transformer models',
  sources: ['arxiv', 'huggingface', 'semantic_scholar', 'github_awesome'],
  max_results: 10,
  save_to_knowledge: true,
  module_id: 'SE_02'
});

console.log(`Found ${result.total_found} items from ${result.sources_searched.length} sources`);
console.log(`Saved to knowledge base: ${result.saved_to_knowledge}`);
```

---

## Voice Integration

The tool is automatically available in voice interactions:

**Example Conversation**:

**User**: "I'm interested in learning about diffusion models. Can you find some recent papers?"

**Orchestrator**: *calls `fetch_research_papers` tool*

**System**: Executes search across ArXiv, HuggingFace, Semantic Scholar

**Orchestrator**: "I found 15 papers on diffusion models! Here are the top results:
1. 'Denoising Diffusion Probabilistic Models' from ArXiv
2. 'Stable Diffusion' from HuggingFace
3. 'Diffusion Models Beat GANs' from Semantic Scholar

Would you like me to save these to your knowledge base?"

**User**: "Yes, save them to my AI module"

**Orchestrator**: *calls tool again with `save_to_knowledge: true`*

**System**: Saves all papers to knowledge base

**Orchestrator**: "Done! I've saved all 15 papers to your AI module. You can query them later with questions like 'explain DDPM training process'."

---

## Error Handling

The tool gracefully handles failures:

```javascript
// If ArXiv is down, other sources still return results
{
  papers: [...],  // From HuggingFace and Semantic Scholar
  sources_searched: ['huggingface', 'semantic_scholar'],
  total_found: 10
}
```

**Common Errors**:

| Error | Cause | Resolution |
|-------|-------|------------|
| `Missing "topic"` | No topic provided | Include `topic` parameter |
| `No results found` | Topic too specific or no matching papers | Try broader search terms |
| `API rate limit` | Too many requests | Wait 60 seconds and retry |
| `Knowledge save failed` | Invalid module_id | Verify module exists |

---

## Performance

**Typical Response Times**:
- ArXiv: 1-2 seconds
- HuggingFace: 500ms-1s
- Semantic Scholar: 500ms-1s
- GitHub: 1-2 seconds

**Concurrent Execution**: All sources are searched in parallel

**Total Time**: ~2-3 seconds for all sources

---

## Rate Limits

| Source | Rate Limit | Notes |
|--------|------------|-------|
| ArXiv | No official limit | Recommended: < 3 req/sec |
| HuggingFace | Unknown | No authentication required |
| Semantic Scholar | 100 req/5min | No API key required |
| GitHub | 60 req/hour (unauth) | Increase with GitHub token |

---

## Best Practices

### 1. Choose Appropriate Sources

```javascript
// For theoretical CS/Math
sources: ['arxiv', 'semantic_scholar']

// For practical ML/AI with code
sources: ['huggingface', 'arxiv']

// For curated lists and tools
sources: ['github_awesome']

// For comprehensive search
sources: ['arxiv', 'huggingface', 'semantic_scholar', 'github_awesome']
```

### 2. Optimize Results Count

```javascript
// Quick overview
max_results: 3

// Good balance
max_results: 5

// Deep dive
max_results: 10
```

### 3. Use Knowledge Base Wisely

```javascript
// DO: Save for long-term reference
save_to_knowledge: true,
module_id: 'research_project_01'

// DON'T: Save exploratory searches
save_to_knowledge: false  // For quick lookups
```

### 4. Specific Search Terms

**Good**:
- "attention mechanism in transformers"
- "graph convolutional networks"
- "variational autoencoders"

**Too Broad**:
- "AI"
- "machine learning"
- "programming"

---

## Troubleshooting

### No Results Returned

**Check**:
1. Topic is specific enough
2. Spelling is correct
3. Sources are available (check logs)

**Try**:
- Broader search terms
- Different sources
- Related keywords

### Incomplete Results

**Cause**: Some sources may fail silently

**Solution**: Check `sources_searched` in response
```javascript
if (result.sources_searched.length < result.sources.length) {
  console.log('Some sources failed');
}
```

### Knowledge Base Not Saving

**Check**:
1. `module_id` is provided
2. Module exists in system
3. User has write permissions

---

## Future Enhancements

### Planned Features

1. **Citation Analysis**
   - Most cited papers first
   - Citation graphs
   - Related paper recommendations

2. **PDF Download**
   - Automatic PDF fetching
   - Local storage integration

3. **Author Filtering**
   - Search by specific authors
   - Track favorite researchers

4. **Date Filtering**
   - Papers from last N months
   - Historical vs recent papers

5. **Smart Summaries**
   - AI-generated paper summaries
   - Key findings extraction

6. **Reading Lists**
   - Organize papers into collections
   - Track reading progress

---

## Related Tools

- **`rag_query`** - Query saved papers
- **`rag_upsert`** - Manually save notes
- **`web_search`** - General web search
- **`create_document`** - Create reading notes in ArchivAI

---

## Contributing

To add a new research source:

1. Add to `sources` enum in tool definition
2. Implement fetching logic in `server.js`
3. Parse response to standard paper format
4. Add to documentation
5. Test with various topics

---

**End of Research Papers Tool Documentation**
