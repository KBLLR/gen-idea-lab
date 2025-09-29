# Multi-Agent Systems in GenBooth Idea Lab: Current Capabilities and Unified Model Strategy

Author: GenBooth Idea Lab
Date: 2025-09-29

1) Executive summary
- Our system already implements an Orchestrator-led multi-agent pattern, with per-module assistants ("personalities") and a central chat.
- Providers supported: built-in Gemini (default), OpenAI, Anthropic (Claude), and local Ollama models, with session control, slash-commands, and basic web search and document creation hooks.
- Near-term opportunities: unify model abstraction, add tool-calling parity, enable capability discovery (ListModels), institute reliability primitives (fallback/route/retry), and connect agents with a shared memory layer (RAG) and workflows.

2) Quick inventory of what we have
- Orchestrator chat and sessioning
  - Central Orchestrator with slash commands: /invite, /search, /document.
  - Model selection UI with connected services (Gemini built-in, OpenAI, Claude, Ollama local), plus a robust runtime fallback to a default model when a selected model is unavailable.
  - Sessions: save, restore, clear; new-session workflow with predefined actions (Kickoff, Goals, Notebook, Search).
- Per-module assistants
  - Personalities per module (lib/assistant/personalities.js) and floating assistant chat.
  - Assistant response pipeline (lib/assistant.js) integrates per-module RAG retrieval (rag.js) for contextual answers.
- RAG infrastructure (client-side glue)
  - chunkText, upsertModuleChunks, queryModule with server endpoints (/api/rag/upsert, /api/rag/query) to persist and retrieve knowledge per module.
- Workflows and orchestration scaffolding
  - workflowTemplates (lib/workflows.js) include orchestrator workflows (project_kickoff, interdisciplinary_synthesis, learning_reflection) and module workflows (e.g., design_thinking_process, algorithm_design_process).
- Provider connectors (front-end configuration)
  - Connected services manager (store + actions) for openai/claude/ollama; chat endpoint (/api/chat) routes by model identifier on the server.

3) Multi-agent architectures: options for us
- Centralized Orchestrator (current) with tool-using sub-agents
  - Pros: simple mental model; control over quality, cost, and routing; good for UI-driven coordination.
  - Cons: Orchestrator becomes a bottleneck; less emergent collaboration.
- Blackboard architecture (shared state bus)
  - Agents post partial hypotheses/events to a shared blackboard (e.g., plan fragments, search results, code stubs). Orchestrator arbitrates and assigns tasks.
  - Pros: scalable, transparent trace; good for combining vision/design/SE/STS perspectives.
  - Cons: Requires structured event formats, commitment strategies, and conflict resolution.
- Planner/Executor with skills registry
  - Orchestrator plans with a tool inventory (search, codegen, RAG, file ops, workflow steps). Execution agents take steps, emit observations, planner replans.
  - Pros: better long-horizon performance; explicit planning helps stability.
  - Cons: Higher implementation complexity; need robust tool schemas and error handling.
- Decentralized auctions/contract-net (advanced)
  - Agents bid for tasks; Orchestrator assigns based on utility. Mostly overkill for our current scope.

4) Capabilities we can productize soon
- Consistency and self-checking loops
  - Add chain-of-thought-free critique passes (e.g., “critique” and “revise” roles) to reduce hallucinations and ensure alignment across agents.
- Tool-calling parity across providers
  - Normalize function-calling / tool use (OpenAI functions, Claude tools, Gemini function-calling) behind a common server schema.
- Long context and state
  - Adopt a session memory layer that aggregates orchestrator history, per-module RAG stores, and workflow artifacts (notes, documents, metrics).
- Structured workflows as agent chores
  - Convert workflow steps to explicit tool calls (chat, search, doc create, RAG insert, planner update) to make execution auditable and resumable.

5) Unifying model providers: a practical blueprint
- A. Standardize the provider interface (server-side)
  - Define a ChatModel interface with: generate(messages, tools?, systemPrompt?, metadata?) → { text, toolCalls?, citations?, usage }.
  - Add support for: streaming, function/tool calls, JSON-mode outputs, and safety signals.
  - Map provider-specific features (OpenAI function-calling, Claude tools, Gemini response schema) to a single normalized envelope.
- B. Capabilities registry + model metadata
  - Maintain a registry: id → { provider, type, supports: { tools, json, vision, images, audio }, cost, speed, maxTokens, contextWindow }.
  - Implement /api/models to list viable models dynamically (and hide unavailable ones). Use this for the model selector UI.
- C. Routing and fallback
  - Add policy-based routing: “fast”, “balanced”, “smartest”, “local” selectors that pick an appropriate model set.
  - Implement transparent fallback (already added in orchestrator action) and optional multi-shot verification (N-best consensus) for critical tasks.
- D. Tool schemas and adapters
  - Define provider-agnostic tool schema (name, description, json schema) and implement adapters:
    - OpenAI: tools/functions
    - Anthropic: tool_use schema
    - Gemini: function calling
  - Consolidate slash commands into server tools where possible.
- E. Safety, formatting, and determinism
  - Enforce consistent response formats (markdown or JSON) across providers with structured parsing and sanitizer.
  - Offer temperature/cost tiers by route and allow per-step overrides.
- F. Observability and metrics
  - Log per-call latency, cost, provider success rate, fallback triggers, and content blocks to guide routing policy.

6) How this maps to our code today
- Orchestrator (/api/chat) already abstracts the provider. Add /api/models and provider registry with capability metadata.
- We have session saving and now a fallback path for unsupported models.
- Per-module assistants already use RAG via lib/rag.js; replicate similar hooks for the Orchestrator to bring document/context into coordination tasks.
- Workflows are defined; mapping steps to tool calls gives us a Planner/Executor path with transparent state.

7) Proposed next steps (2–3 weeks)
Week 1: Provider unification foundation
- Server: define ChatModel interface and adapters for OpenAI, Claude, Gemini, Ollama, using unified request/response envelopes.
- Add /api/models and capabilities registry; update Orchestrator model selector to call it rather than static lists.
- Implement tool schema adapters for each provider; unify function-calling.

Week 2: Routing and memory
- Policy-based routing (+ fallback), configurable by user or task type.
- Extend Orchestrator to write high-signal snippets to RAG; enable “/context add” and “/context search” commands.
- Add session metadata: cost, provider, critical errors, and artifacts linked to Archiva entries.

Week 3: Workflows-as-tools and QA
- Convert selected orchestrator workflows to Planner/Executor steps with audit logs.
- Add a lightweight critique/revise pass for key outputs and reports.
- Instrument metrics and add a dashboard for provider performance and fallback rates.

8) Risks and mitigations
- Provider schema drift → Wrap adapters in contract tests and add a nightly “ListModels” smoke test.
- Cost blowups → Introduce soft budgets per request/session and auto-downgrade to cheaper routes.
- Hallucinations → RAG grounding, critique pass, and tool-validated outputs (schemas) for critical flows.
- UI complexity → Keep Orchestrator UX minimal; advanced options under settings.

9) Long-term outlook
- Multi-agent blackboard for module synthesis (SE/DS/STS) with explainable traces.
- Portfolio-grade artifact generation (Archiva integration) driven by workflows and validated by agents.
- Edge-friendly local inference routing (Ollama) for privacy-sensitive work with cloud escalation when needed.

Appendix: References and further reading
- Agent architectures: blackboard systems, contract-net protocols, planner/executor patterns.
- Tool calling and function-calling across providers (OpenAI, Anthropic, Gemini).
- RAG best practices for education and project coordination contexts.
