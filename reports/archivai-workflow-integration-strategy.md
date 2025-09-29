# ArchivAI-Workflow Integration Strategy
*Date: 2025-09-29 (Europe/Berlin)*

## Executive Summary

This document outlines the strategic plan for integrating ArchivAI documentation templates with the GenBooth workflow system, creating an automated documentation pipeline that transforms workflow execution results into professional, template-based documentation that feeds back into the module assistant knowledge base.

## Vision: The Complete Loop

```
Workflow Design → Execution → Documentation → Knowledge → Improved Workflows
     ↑                                                            ↓
     ←————————————————— Continuous Learning ←——————————————————————
```

**Goal**: Every workflow execution automatically generates structured documentation that becomes part of the assistant's knowledge, creating a self-improving system.

---

## Current State Analysis

### ✅ What's Working
1. **Planner Canvas**: ArchivAI template blocks can be dragged and configured
2. **Template Library**: 26+ templates organized by type (Reflective/Technical/Creative)
3. **Configuration Interface**: Users can select output format (MD/HTML) and preview fields
4. **Dynamic Model Selection**: Real-time fetching of available models from all services

### 🔧 What Needs Implementation

#### 1. **Robust Infrastructure** (from revise001.md)
- **Ollama Routing**: Implement `isOllamaModelId()` helper for reliable model detection
- **Error Handling**: Proper validation for missing models with helpful suggestions
- **Model Filtering**: Text-only models in `/api/models` (exclude vision/embedding)
- **Null Safety**: Prevent crashes when connections are incomplete

#### 2. **Template Rendering Engine** (from revise002.md)
- **Renderer System**: Core utilities for MD/HTML output with helpers for code, images, tables
- **Three Core Templates**: Process Journal, Experiment Report, Prompt Card
- **Deterministic Output**: No external dependencies, consistent formatting

#### 3. **Workflow-Template Bridge**
- **Data Mapping**: Transform workflow JSON → template fields
- **AI Population**: Use available models to intelligently fill template content
- **Context Awareness**: Templates understand their position in workflow chain

---

## Strategic Implementation Plan

### Phase 1: Foundation (Priority 1)
**Objective**: Stabilize the core infrastructure

#### 1.1 Server Infrastructure
```js
// Implement robust routing helper
function isOllamaModelId(model = '') {
  const prefixes = ['gemma','llama','qwen','mistral','phi','deepseek','gpt-oss'];
  return model.includes(':') || prefixes.some(p => model.startsWith(p));
}

// Add model validation
const validateModel = async (model, ollamaBase) => {
  const tagsResp = await fetch(`${ollamaBase}/api/tags`);
  if (tagsResp.ok) {
    const { models: installed = [] } = await tagsResp.json();
    const names = new Set(installed.map(m => m.name.toLowerCase()));
    if (!names.has(model.toLowerCase())) {
      throw new Error(`Model '${model}' not installed. Run: ollama pull ${model.split(':')[0]}`);
    }
  }
};
```

#### 1.2 Client Safety
```jsx
// Safe sparkles button
const { textModels } = useAvailableModels();
const modelOk = !!textModels.find(m => m.id === workflowAutoTitleModel);

<button
  disabled={!modelOk || isGeneratingTitle}
  title={!modelOk ? 'Selected model unavailable. Check Settings.' : 'Generate title'}
>
  ✨
</button>
```

### Phase 2: Template Engine (Priority 2)
**Objective**: Build the rendering infrastructure

#### 2.1 Core Renderer (`src/lib/archiva/renderer.js`)
```js
export const helpers = {
  // Code blocks with syntax highlighting hints
  code(lang, body, format='md') {
    return format === 'html'
      ? `<pre><code class="language-${lang}">${escapeHtml(body)}</code></pre>`
      : `\`\`\`${lang}\n${body}\n\`\`\``;
  },

  // Images with proper figure wrapping
  img(src, alt = '', format='md') {
    return format === 'html'
      ? `<figure><img src="${src}" alt="${escapeAttr(alt)}"/></figure>`
      : `![${alt}](${src})`;
  },

  // Tables with responsive design
  tbl(rows, format='md') {
    // Implementation for both MD and HTML table generation
  },

  // Time range calculations
  timeRange(start, end) {
    const duration = Math.round((new Date(end) - new Date(start)) / 60000);
    return `${start} → ${end} (${duration} min)`;
  }
};
```

#### 2.2 Template Implementations
Three core templates to start:

1. **Process Journal**: Workflow progress documentation
2. **Experiment Report**: Scientific-style experiment documentation
3. **Prompt Card**: AI interaction documentation

### Phase 3: ArchivAI App Enhancement (Priority 3)
**Objective**: Transform ArchivAI into a preview and export system

#### 3.1 Preview System
```jsx
// ArchivAI app shows live preview of rendered templates
const TemplatePreview = ({ template, format, data }) => {
  const rendered = renderTemplate(template.id, format, data);

  return (
    <div className="template-preview">
      <div className="preview-header">
        <h3>{template.name}</h3>
        <div className="format-toggle">
          <button active={format === 'md'}>Markdown</button>
          <button active={format === 'html'}>HTML</button>
        </div>
      </div>
      <div className="preview-content">
        {format === 'html' ?
          <div dangerouslySetInnerHTML={{__html: rendered}} /> :
          <ReactMarkdown>{rendered}</ReactMarkdown>
        }
      </div>
    </div>
  );
};
```

#### 3.2 Export System
```jsx
const ExportOptions = ({ template, data }) => (
  <div className="export-options">
    <button onClick={() => downloadFile(renderMD(data), `${template.id}.md`)}>
      📄 Download Markdown
    </button>
    <button onClick={() => downloadFile(renderHTML(data), `${template.id}.html`)}>
      🌐 Download HTML
    </button>
    <button onClick={() => copyToClipboard(renderMD(data))}>
      📋 Copy to Clipboard
    </button>
  </div>
);
```

### Phase 4: Workflow Integration (Priority 4)
**Objective**: Connect workflow execution to template population

#### 4.1 Data Flow Architecture
```
Workflow Execution Result
         ↓
   [JSON Transformation]
         ↓
   Template Field Mapping
         ↓
   AI Content Enhancement
         ↓
   Rendered Documentation
         ↓
   Module Assistant Archive
```

#### 4.2 Mapping System
```js
// Map workflow JSON to template fields
const mapWorkflowToTemplate = (workflowResult, templateId) => {
  const mappers = {
    process_journal: {
      title: (w) => w.title || `Workflow: ${w.workflow_id}`,
      started_at: (w) => w.started_at,
      ended_at: (w) => w.ended_at,
      context: (w) => w.meta?.description || generateContext(w),
      method: (w) => generateMethodDescription(w.steps),
      findings: (w) => extractFindings(w.steps),
      next_steps: (w) => generateNextSteps(w.results)
    },
    experiment_report: {
      title: (w) => w.title || `Experiment: ${w.workflow_id}`,
      hypothesis: (w) => w.meta?.hypothesis || generateHypothesis(w),
      setup: (w) => w.inputs,
      results: (w) => w.steps.map(step => step.metrics),
      discussion: (w) => generateDiscussion(w.results)
    }
  };

  return mappers[templateId]?.(workflowResult) || {};
};
```

#### 4.3 AI Enhancement
```js
// Use available models to enhance template content
const enhanceTemplateContent = async (templateData, model) => {
  const prompt = `
    Analyze this workflow data and enhance the documentation:
    ${JSON.stringify(templateData, null, 2)}

    Provide insights for:
    - Key findings and patterns
    - Potential improvements
    - Next experimental directions
    - Technical observations
  `;

  const enhancement = await callModel(model, prompt);
  return { ...templateData, aiInsights: enhancement };
};
```

### Phase 5: Knowledge Integration (Priority 5)
**Objective**: Feed documentation back into assistant knowledge

#### 5.1 Module Assistant Archive
```js
// Add generated docs to assistant's knowledge base
const integrateToAssistant = async (moduleId, documentation) => {
  await fetch('/api/rag/upsert', {
    method: 'POST',
    body: JSON.stringify({
      moduleId,
      chunks: [
        {
          id: `doc-${Date.now()}`,
          text: documentation.content,
          metadata: {
            type: 'workflow_documentation',
            template: documentation.template,
            workflow_id: documentation.workflow_id,
            created_at: new Date().toISOString()
          }
        }
      ]
    })
  });
};
```

#### 5.2 Contextual Retrieval
```js
// Assistant can now reference previous workflow docs
const searchRelevantDocs = async (moduleId, query) => {
  const results = await fetch('/api/rag/query', {
    method: 'POST',
    body: JSON.stringify({
      moduleId,
      query,
      topK: 5
    })
  });

  return results.json();
};
```

---

## Content Strategy by Template Type

### Reflective Templates
**Focus**: Learning, insights, process improvement
- **Study Archive**: Consolidate learning outcomes from workflow experiments
- **Process Journal**: Document iteration cycles and methodology evolution
- **Learning Lab**: Structure mini-experiments within larger workflows

**AI Enhancement**: Pattern recognition, insight extraction, learning recommendations

### Technical Templates
**Focus**: Code, experiments, reproducibility
- **Experiments**: Scientific method applied to AI/ML workflows
- **Dev Diaries**: Technical progress and debugging narratives
- **Code Studies**: Analysis of implementation approaches

**AI Enhancement**: Code analysis, performance insights, optimization suggestions

### Creative Templates
**Focus**: Exploration, prototyping, innovation
- **Studio Scraps**: Capture creative process and iterations
- **Visual Experiments**: Document design and creative workflows
- **WIP**: Track work-in-progress across creative projects

**AI Enhancement**: Creative connections, aesthetic analysis, style evolution

---

## Success Metrics

### Technical Metrics
- **Template Coverage**: All 26+ templates have rendering implementations
- **Reliability**: 99%+ successful workflow→documentation pipeline
- **Performance**: <500ms template rendering time
- **Model Compatibility**: Works with all connected AI services

### User Experience Metrics
- **Adoption**: % of workflows that include documentation blocks
- **Export Usage**: Downloads and shares of generated documentation
- **Knowledge Retrieval**: Assistant successfully references past documentation
- **Time Savings**: Reduced manual documentation time

### Knowledge Quality Metrics
- **Searchability**: Assistant can find relevant past experiments
- **Learning Transfer**: Insights from docs improve future workflows
- **Documentation Quality**: Generated docs meet professional standards
- **Context Preservation**: Critical workflow context captured and retrievable

---

## Implementation Priority Matrix

| Phase | Component | Effort | Impact | Priority |
|-------|-----------|--------|---------|----------|
| 1 | Ollama Routing Fix | Low | High | **P0** |
| 1 | Model Validation | Low | High | **P0** |
| 2 | Core Renderer | Medium | High | **P1** |
| 2 | Three Templates | Medium | High | **P1** |
| 3 | Preview System | Medium | Medium | **P2** |
| 4 | Workflow Mapping | High | High | **P1** |
| 4 | AI Enhancement | Medium | Medium | **P2** |
| 5 | Knowledge Integration | Medium | High | **P1** |

---

## Next Actions

### Immediate (Next Session)
1. **Fix Ollama routing** with `isOllamaModelId()` helper
2. **Implement core renderer** with `helpers` utilities
3. **Create Process Journal template** as proof of concept

### Short Term (This Week)
1. **Add Experiment Report and Prompt Card** templates
2. **Build workflow→template mapping** system
3. **Create ArchivAI preview** interface

### Medium Term (Next Week)
1. **Integrate AI enhancement** for template content
2. **Connect to module assistant** knowledge base
3. **Add export functionality** for all formats

This strategy creates a complete documentation automation pipeline that learns from every workflow execution, making the entire system more intelligent over time.