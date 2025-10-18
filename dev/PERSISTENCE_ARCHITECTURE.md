# Persistence Architecture & RAG Database Plan

**Status**: Proposal for Phase 4 Implementation
**Date**: 2025-10-18
**Context**: Post data-layer migration, ready for real persistence

---

## Current State Analysis

### What We Have ✅
- **MongoDB installed** (`mongodb@6.7.0`)
- **Basic connection helper** (`src/shared/lib/db.js`)
- **Minimal usage**: Only `module_assistant_chats` collection
- **Centralized API layer** (Phase 1-3 complete)
- **RAG client helpers** (`src/shared/lib/rag.js`)

### What's Missing ❌
- **No per-app databases** - Everything in one DB
- **No RAG vector storage** - Only text chunks
- **No persistence layer** - Apps use Zustand (in-memory only)
- **No data models/schemas** - Ad-hoc JSON documents
- **No AI agent state** - Agents are stateless

### Current Data Flow
```
Client (Zustand) → API endpoints → MongoDB (minimal) → Response
                ↓
         localStorage (persist middleware)
```

**Problem**: App state lives in browser localStorage. On logout/clear, all data is lost.

---

## Proposed Architecture

### 1. Database Structure

```
MongoDB Instance
├── genbooth_shared          # Shared/global data
│   ├── users                # User profiles
│   ├── sessions             # Auth sessions
│   ├── service_connections  # OAuth tokens
│   └── system_config        # Global settings
│
├── genbooth_archiva         # ArchivAI app database
│   ├── entries              # Documentation entries
│   ├── templates            # Custom templates
│   ├── workflows            # Workflow results
│   └── archiva_rag          # RAG embeddings collection
│       ├── text             # Document text
│       ├── embedding        # Vector (array of floats)
│       └── metadata         # {source, timestamp, tags}
│
├── genbooth_idealab         # IdeaLab app database
│   ├── modules              # Module configurations
│   ├── conversations        # Chat histories
│   ├── generated_ideas      # Saved ideas
│   └── idealab_rag          # Per-module knowledge base
│       └── {moduleId}_vectors
│
├── genbooth_planner         # Planner app database
│   ├── workflows            # Saved workflow graphs
│   ├── executions           # Execution logs
│   ├── nodes                # Custom node definitions
│   └── planner_rag          # Workflow context
│
├── genbooth_characterlab    # CharacterLab app database
│   ├── characters           # Character profiles
│   ├── rigging_tasks        # 3D rigging jobs
│   ├── gallery              # Model gallery
│   └── characterlab_rag     # Character backstories/lore
│
├── genbooth_empathylab      # EmpathyLab app database
│   ├── sessions             # Emotion analysis sessions
│   ├── insights             # Generated insights
│   └── empathylab_rag       # Emotional patterns knowledge
│
└── genbooth_calendarai      # CalendarAI app database
    ├── events               # Calendar event cache
    ├── schedules            # Generated schedules
    └── calendarai_rag       # Scheduling context/preferences
```

### 2. Per-App RAG Systems

Each app gets its **own AI agent** with dedicated knowledge base:

```javascript
// Example: ArchivAI RAG Agent
{
  appId: 'archiva',
  agent: {
    name: 'ArchivAI Assistant',
    model: 'gemini-2.5-flash',
    systemPrompt: 'You help organize and search documentation...',
    tools: ['search_docs', 'create_entry', 'tag_content']
  },
  ragConfig: {
    collection: 'archiva_rag',
    embeddingModel: 'text-embedding-004', // Gemini embeddings
    vectorDimension: 768,
    similarityMetric: 'cosine',
    topK: 5,
    minScore: 0.7
  }
}
```

**Per-App Agent Responsibilities**:
- **ArchivAI**: Document search, summarization, template suggestions
- **IdeaLab**: Module-specific context, research synthesis, idea generation
- **Planner**: Workflow optimization, node recommendations, execution insights
- **CharacterLab**: Character consistency, lore management, backstory generation
- **EmpathyLab**: Emotional pattern recognition, insight generation
- **CalendarAI**: Schedule optimization, conflict detection, preference learning

### 3. Data Models & Schemas

Create Zod schemas for type safety and validation:

```javascript
// shared/schemas/archivaSchemas.js
import { z } from 'zod';

export const ArchivaEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  title: z.string().min(1).max(200),
  content: z.string(),
  templateId: z.string().optional(),
  tags: z.array(z.string()),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.object({
    wordCount: z.number(),
    lastModifiedBy: z.string(),
    version: z.number()
  })
});

export const ArchivaRAGVectorSchema = z.object({
  id: z.string().uuid(),
  entryId: z.string().uuid(),
  text: z.string(),
  embedding: z.array(z.number()).length(768), // Gemini embedding size
  metadata: z.object({
    source: z.string(),
    chunkIndex: z.number(),
    timestamp: z.date(),
    tags: z.array(z.string())
  })
});
```

### 4. Enhanced Data Layer Integration

Update `endpoints.js` with persistence-aware CRUD:

```javascript
// endpoints.js additions
export const api = {
  // ... existing endpoints

  /**
   * Archiva persistence endpoints
   */
  archiva: {
    // Entries CRUD
    entries: {
      list: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await fetch(`/api/archiva/entries?${params}`);
        return parseResponse(response);
      },

      get: async (entryId) => {
        const response = await fetch(`/api/archiva/entries/${entryId}`);
        return parseResponse(response);
      },

      create: async (payload) => {
        const response = await fetch('/api/archiva/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return parseResponse(response);
      },

      update: async (entryId, updates) => {
        const response = await fetch(`/api/archiva/entries/${entryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        return parseResponse(response);
      },

      delete: async (entryId) => {
        const response = await fetch(`/api/archiva/entries/${entryId}`, {
          method: 'DELETE',
        });
        return parseResponse(response);
      }
    },

    // RAG operations
    rag: {
      index: async (entryId, content) => {
        // Index document content into RAG
        const response = await fetch('/api/archiva/rag/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryId, content }),
        });
        return parseResponse(response);
      },

      search: async (query, options = {}) => {
        // Semantic search across all documents
        const response = await fetch('/api/archiva/rag/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, ...options }),
        });
        return parseResponse(response);
      },

      ask: async (question, context = {}) => {
        // Ask AI agent with RAG context
        const response = await fetch('/api/archiva/rag/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, context }),
        });
        return parseResponse(response);
      }
    }
  }
};
```

### 5. Server-Side Implementation

```javascript
// server/services/RAGService.js
import { getDb } from '../../src/shared/lib/db.js';

export class RAGService {
  constructor(appId, config = {}) {
    this.appId = appId;
    this.collection = config.collection || `${appId}_rag`;
    this.embeddingModel = config.embeddingModel || 'text-embedding-004';
  }

  async upsert(text, metadata = {}) {
    const db = await getDb();

    // Generate embedding via Gemini
    const embedding = await this.generateEmbedding(text);

    const document = {
      text,
      embedding,
      metadata: {
        ...metadata,
        timestamp: new Date(),
        appId: this.appId
      }
    };

    const result = await db.collection(this.collection).insertOne(document);
    return { id: result.insertedId, ...document };
  }

  async search(query, options = {}) {
    const { topK = 5, minScore = 0.7, filter = {} } = options;
    const db = await getDb();

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query);

    // Vector search using $vectorSearch (MongoDB Atlas) or cosine similarity
    const results = await db.collection(this.collection).aggregate([
      {
        $vectorSearch: {
          queryVector: queryEmbedding,
          path: 'embedding',
          numCandidates: topK * 10,
          limit: topK,
          index: `${this.collection}_vector_index`
        }
      },
      {
        $match: filter // Additional filters
      },
      {
        $project: {
          text: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]).toArray();

    return results.filter(r => r.score >= minScore);
  }

  async generateEmbedding(text) {
    // Call Gemini API for embeddings
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${this.embeddingModel}:embedContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          content: { parts: [{ text }] }
        })
      }
    );

    const data = await response.json();
    return data.embedding.values; // Float array
  }
}

// server/routes/archiva.js
import { RAGService } from '../services/RAGService.js';

const archivaRAG = new RAGService('archiva', {
  collection: 'archiva_rag',
  embeddingModel: 'text-embedding-004'
});

router.post('/archiva/rag/search', async (req, res) => {
  const { query, topK, minScore } = req.body;
  const results = await archivaRAG.search(query, { topK, minScore });
  res.json({ results });
});
```

---

## Migration Plan

### Phase 4.1: Database Setup (Week 1)
- [ ] Create database structure (per-app DBs)
- [ ] Set up MongoDB Atlas vector search indexes
- [ ] Create Zod schemas for all apps
- [ ] Implement base `RAGService` class
- [ ] Add migration scripts for existing data

### Phase 4.2: ArchivAI Migration (Week 2)
- [ ] Implement Archiva persistence endpoints
- [ ] Migrate from Zustand to DB storage
- [ ] Set up ArchivAI RAG system
- [ ] Index existing templates/docs
- [ ] Test semantic search

### Phase 4.3: IdeaLab Migration (Week 3)
- [ ] Per-module RAG databases
- [ ] Conversation persistence
- [ ] Module-specific AI agents
- [ ] Knowledge base migration

### Phase 4.4: Planner Migration (Week 4)
- [ ] Workflow persistence
- [ ] Execution history
- [ ] Node library storage
- [ ] Workflow RAG for suggestions

### Phase 4.5: Remaining Apps (Week 5)
- [ ] CharacterLab persistence
- [ ] EmpathyLab sessions
- [ ] CalendarAI caching
- [ ] Cross-app data sync

### Phase 4.6: TanStack Query Integration (Week 6)
- [ ] Replace manual fetch with useQuery
- [ ] Add useMutation for writes
- [ ] Optimistic updates
- [ ] Background refetching

---

## Benefits of This Architecture

### 1. Data Sovereignty
- Each app owns its data
- Clear boundaries and isolation
- Easy to backup/restore per-app

### 2. Intelligent Search
- Semantic search within app context
- AI agents with app-specific knowledge
- Better relevance than keyword search

### 3. Scalability
- Independent scaling per app
- Horizontal sharding by app
- Can split to microservices later

### 4. Developer Experience
- Type-safe schemas (Zod)
- Centralized endpoints (already done!)
- Clear data models
- Easy testing

### 5. User Experience
- Persistent data (no loss on logout)
- Fast semantic search
- Context-aware AI assistants
- Cross-device sync ready

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Database** | MongoDB Atlas | Document storage + vector search |
| **Vector Search** | Atlas Vector Search | Semantic similarity |
| **Embeddings** | Gemini text-embedding-004 | 768-dim vectors |
| **Validation** | Zod | Schema validation |
| **ORM/ODM** | Native MongoDB driver | Direct control |
| **Caching** | TanStack Query | Client-side cache |
| **State** | Zustand (UI only) | Transient UI state |
| **Persistence** | MongoDB (source of truth) | Permanent storage |

---

## Example: ArchivAI Full Flow

### 1. User Creates Document
```javascript
// Client
const { mutate: createEntry } = useMutation({
  mutationFn: (entry) => api.archiva.entries.create(entry),
  onSuccess: (data) => {
    queryClient.invalidateQueries(['archiva', 'entries']);
    showToast('Document created!');
  }
});

createEntry({
  title: 'My Research Notes',
  content: 'Large markdown document...',
  tags: ['research', 'ai'],
  status: 'draft'
});
```

### 2. Server Stores + Indexes
```javascript
// server/routes/archiva.js
router.post('/archiva/entries', async (req, res) => {
  const { title, content, tags, status } = req.body;
  const db = await getDb('genbooth_archiva');

  // Validate with Zod
  const entry = ArchivaEntrySchema.parse({
    id: crypto.randomUUID(),
    userId: req.user.id,
    title,
    content,
    tags,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      wordCount: content.split(/\s+/).length,
      lastModifiedBy: req.user.id,
      version: 1
    }
  });

  // Save to DB
  await db.collection('entries').insertOne(entry);

  // Index in RAG (async, non-blocking)
  archivaRAG.upsert(content, {
    entryId: entry.id,
    title: entry.title,
    tags: entry.tags
  }).catch(console.error);

  res.json({ success: true, entry });
});
```

### 3. User Searches Semantically
```javascript
// Client
const { data: searchResults } = useQuery({
  queryKey: ['archiva', 'search', searchQuery],
  queryFn: () => api.archiva.rag.search(searchQuery, { topK: 10 }),
  enabled: searchQuery.length > 2
});

// Returns semantically similar documents, not just keyword matches
```

---

## Next Steps

1. **Review this proposal** - Does this architecture align with your vision?
2. **Prioritize apps** - Which app should get persistence first?
3. **Choose vector DB** - MongoDB Atlas Vector Search vs. Pinecone vs. Weaviate?
4. **Start Phase 4.1** - Set up database structure and schemas

**Question for you**: Should we start with ArchivAI (most document-heavy) or IdeaLab (most AI-heavy)?
