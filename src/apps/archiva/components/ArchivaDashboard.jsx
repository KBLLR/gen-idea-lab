

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MIGRATED: Now uses centralized API endpoints
*/
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import useStore from '@store';
import { templates } from '@apps/archiva/lib/templates.js';
import BoothHeader from '@components/ui/organisms/BoothHeader.jsx';
import { Panel } from '@ui';
import { api } from '@shared/lib/dataLayer/endpoints.js';
import { render as renderProcessJournal } from '@apps/archiva/lib/process_journal.js';
import { render as renderExperimentReport } from '@apps/archiva/lib/experiment_report.js';
import { render as renderPromptCard } from '@apps/archiva/lib/prompt_card.js';
import {
  renderGenericTemplate,
  renderStudyArchive,
  renderLearningLab,
  renderCodeNotebook,
  renderDesignSketchbook,
  renderExperiments
} from '@apps/archiva/lib/generic_renderer.js';
import {
  generateWorkflowDocumentation,
  downloadDocumentation,
  copyToClipboard,
  createSampleWorkflow,
  formatWorkflowMetrics
} from '@apps/archiva/lib/workflow-service.js';
import { createArchivaEntry, updateArchivaEntry, setActiveEntryId } from '@shared/lib/actions/archivaActions.js';

// Template renderers mapping - using template keys from templates.js
const templateRenderers = {
  // Specific renderers (legacy) - wrap to handle 3-param calling pattern
  'Process_Journal': (format, data, templateDef) => renderProcessJournal(format, data),
  'Experiments': (format, data, templateDef) => renderExperimentReport(format, data),
  'prompt_card': (format, data, templateDef) => renderPromptCard(format, data),

  // All templates now use generic renderer
  'Study_Archive': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Learning_Lab': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Code_Notebook': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Design_Sketchbook': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Practice_Log': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Field_Notes': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Explorations': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Research_and_Prototypes': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Sandbox': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Dev_Diaries': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Prototypes': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Code_Studies': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Playground': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Snippets_and_Sketches': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Iterations': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Studio_Scraps': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'WIP_Work_In_Progress': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Things_I_Tried': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'The_Backroom': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Visual_Experiments': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Digital_Messbook': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),
  'Unpolished': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format),

  // Generic fallback for any other templates
  'generic': (format, data, templateDef) => renderGenericTemplate(templateDef, data, format)
};

// Sample workflow data for preview - structured for template fields
const sampleWorkflowData = {
  workflow_id: "wf_sample_2025",
  run_id: "run_001",
  title: "AI Model Comparison Experiment",
  started_at: "2025-01-15T10:00:00Z",
  ended_at: "2025-01-15T10:15:00Z",
  meta: {
    description: "Multi-model text generation comparison experiment"
  },
  steps: [
    {
      name: "Test Claude 3.5 Sonnet",
      model: "claude-3-5-sonnet",
      request: { prompt: "Generate a creative story about AI collaboration" },
      response: "A collaborative AI narrative demonstrating analytical reasoning...",
      metrics: { latency_ms: 2100, tokens_in: 45, tokens_out: 350 }
    },
    {
      name: "Test GPT-4o",
      model: "gpt-4o",
      request: { prompt: "Generate a creative story about AI collaboration" },
      response: "A balanced creative story showing consistent quality...",
      metrics: { latency_ms: 1200, tokens_in: 45, tokens_out: 320 }
    },
    {
      name: "Test Gemini 2.0",
      model: "gemini-2.0",
      request: { prompt: "Generate a creative story about AI collaboration" },
      response: "A uniquely creative narrative with innovative storytelling...",
      metrics: { latency_ms: 1350, tokens_in: 45, tokens_out: 380 }
    }
  ],
  tags: ["AI models", "comparison", "text generation"],
  values: {
    title: "AI Model Comparison Experiment",
    date: "2025-01-15",
    experiment_name: "Multi-Model Text Generation Comparison",
    hypothesis: "Different AI models will show distinct strengths in creative vs analytical tasks",
    setup: "Sequential testing with standardized prompts across multiple model providers:\n\n- Claude 3.5 Sonnet\n- GPT-4o\n- Gemini 2.0\n\nEach model tested with identical creative writing prompts.",
    code_execution: `# Model initialization and testing
models = ['claude-3-5-sonnet', 'gpt-4o', 'gemini-2.0']
prompt = "Generate a creative story about AI collaboration"

for model in models:
    start_time = time.time()
    response = call_model(model, prompt)
    latency = time.time() - start_time

    results[model] = {
        'response': response,
        'latency_ms': latency * 1000,
        'tokens': count_tokens(response)
    }`,
    results: `## Model Performance Results

**Claude 3.5 Sonnet:**
- Best reasoning capabilities
- Latency: 2100ms
- Most structured responses

**GPT-4o:**
- Fastest response times (1200ms)
- Consistent quality
- Good balance of creativity/accuracy

**Gemini 2.0:**
- Most creative outputs
- Unique storytelling approach
- Slightly higher latency`,
    analysis: "Results confirm our hypothesis with clear performance patterns emerging across different AI models. Each model demonstrated distinct strengths that align with their training approaches.",
    next_iterations: `- Implement parallel testing for better comparison
- Add cost analysis metrics
- Test with domain-specific prompts
- Expand to larger sample sizes`,
    tags_keywords: "AI models, comparison, text generation, performance testing"
  }
};

export default function ArchivaDashboard() {
  const [previewFormat, setPreviewFormat] = useState('md');
  const [renderedContent, setRenderedContent] = useState({ md: '', html: '' });
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUsingRealWorkflow, setIsUsingRealWorkflow] = useState(false);
  const [currentWorkflowData, setCurrentWorkflowData] = useState(sampleWorkflowData);

  // Get selected template from store
  const selectedTemplate = useStore.use.selectedTemplateForPreview();

  // Get template info
  const templateInfo = selectedTemplate ? templates[selectedTemplate] : null;
  const hasRenderer = templateInfo && (templateRenderers[selectedTemplate] || templateRenderers.generic);

  // Safe HTML conversion with marked and DOMPurify
  const markdownToHtml = (mdContent) => {
    if (!mdContent) return '';
    const rawHtml = marked(mdContent);
    return DOMPurify.sanitize(rawHtml);
  };

  useEffect(() => {
    if (hasRenderer && templateInfo) {
      const renderer = templateRenderers[selectedTemplate] || templateRenderers.generic;

      let mdContent, htmlContent;

      // All renderers now follow the same pattern (format, data, templateDef)
      mdContent = renderer('md', currentWorkflowData, templateInfo);
      htmlContent = renderer('html', currentWorkflowData, templateInfo);

      // For markdown content, also generate HTML using marked + DOMPurify
      const convertedHtml = markdownToHtml(mdContent);

      setRenderedContent({
        md: mdContent,
        html: htmlContent || convertedHtml
      });
    }
  }, [selectedTemplate, hasRenderer, currentWorkflowData, templateInfo]);

  // Generate mock data with AI for the selected template
  const handleGenerateWithAI = async () => {
    if (!hasRenderer || !templateInfo) return;

    setIsGenerating(true);
    try {
      // Build field descriptions for AI prompt
      const fieldDescriptions = templateInfo.fields.map(f =>
        `- ${f.field_key} (${f.field_type}): ${f.label}`
      ).join('\n');

      // Load the template example markdown file
      const templateFileName = selectedTemplate.toLowerCase().replace(/_/g, '_');
      let exampleTemplate = '';

      try {
        exampleTemplate = await api.archiva.loadTemplateExample(templateFileName);
      } catch (err) {
        console.warn('Could not load template example file:', err);
      }

      const exampleSection = exampleTemplate ? `
Here's an example template showing the expected format and style:

\`\`\`markdown
${exampleTemplate}
\`\`\`

Use this as a reference for the style, depth, and format of content to generate.
` : '';

      // Call AI to generate realistic mock data
      const data = await api.chat.complete({
        model: 'gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Generate realistic mock data for a "${templateInfo.name}" template with the following fields:

${fieldDescriptions}

Template Purpose: ${templateInfo.purpose}
Template Type: ${templateInfo.type}
${exampleSection}

Create realistic, detailed content that would be typical for a ${templateInfo.type.toLowerCase()} document. For markdown fields, use proper markdown formatting with headings, lists, and emphasis. For code fields, include realistic, working code snippets with comments. Use today's date (${new Date().toISOString().split('T')[0]}) for the date field.

Return a JSON object with sample values for each field listed above. Return ONLY valid JSON, no additional text or markdown code blocks.`
          }]
      });

      let generatedData;

      try {
        // Try to parse the AI response as JSON
        const cleanedResponse = data.response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        generatedData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response:', data.response);
        throw new Error('AI returned invalid JSON');
      }

      // Create workflow-compatible data structure
      const mockWorkflowData = {
        workflow_id: `mock_${Date.now()}`,
        run_id: `run_${Date.now()}`,
        title: generatedData.title || generatedData.experiment_name || generatedData.concept_focus || generatedData.challenge || 'Mock Entry',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        meta: { description: templateInfo.purpose },
        steps: [{
          name: 'Mock Generation',
          model: 'gemini-2.5-flash',
          response: 'AI-generated mock data',
          metrics: { latency_ms: 100, tokens_in: 50, tokens_out: 200 }
        }],
        tags: generatedData.tags_keywords?.split(',').map(t => t.trim()) || [templateInfo.type],
        values: generatedData
      };

      setCurrentWorkflowData(mockWorkflowData);
      console.log('[ArchivAI] Generated mock data:', mockWorkflowData);

    } catch (error) {
      console.error('AI generation failed:', error);
      alert(`Failed to generate mock data: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Test with real workflow data
  const handleTestRealWorkflow = () => {
    const realWorkflow = createSampleWorkflow('experiment');
    setCurrentWorkflowData(realWorkflow);
    setIsUsingRealWorkflow(true);
  };

  // Save current rendered output and values to server mock dir, and create an Archiva entry
  const handleSaveMock = async () => {
    if (!hasRenderer || !templateInfo) return;
    try {
      const payload = {
        templateKey: selectedTemplate,
        templateName: templateInfo.name,
        title: currentWorkflowData?.values?.title || currentWorkflowData?.title || templateInfo.name,
        values: currentWorkflowData?.values || {},
        md: renderedContent.md,
        html: renderedContent.html,
        meta: {
          workflow_id: currentWorkflowData?.workflow_id || null,
          run_id: currentWorkflowData?.run_id || null
        }
      };
      const { id } = await api.archiva.saveMock(payload);
      console.log('[ArchivAI] Saved mock to data/archivai-mock:', id);

      // Create an Archiva entry in local state for editing/testing
      const newId = createArchivaEntry(selectedTemplate);
      if (newId) {
        const values = currentWorkflowData?.values || {};
        Object.entries(values).forEach(([k, v]) => updateArchivaEntry(newId, k, v));
        setActiveEntryId(newId);
      }
    } catch (err) {
      console.error('Save mock failed:', err);
      alert(`Save failed: ${err.message}`);
    }
  };

  // Download handlers
  const handleDownloadMD = () => {
    const filename = `${templateInfo?.name?.replace(/\s+/g, '_')}_${Date.now()}`;
    downloadDocumentation(renderedContent.md, filename, 'md');
  };

  const handleDownloadHTML = () => {
    const filename = `${templateInfo?.name?.replace(/\s+/g, '_')}_${Date.now()}`;
    downloadDocumentation(renderedContent.html, filename, 'html');
  };

  // Copy to clipboard
  const handleCopyToClipboard = async (format) => {
    const content = format === 'md' ? renderedContent.md : renderedContent.html;
    const success = await copyToClipboard(content);
    if (success) {
      // Could add a toast notification here
      console.log(`${format.toUpperCase()} copied to clipboard`);
    }
  };

  // Sample template data for gallery (can be made dynamic later)
  useEffect(() => {
    setSavedTemplates([
      {
        id: 1,
        template: 'Process_Journal',
        title: 'ML Pipeline Optimization',
        date: '2025-01-14',
        preview: 'Optimized data preprocessing pipeline, reduced training time by 40%...',
        values: {
          title: 'ML Pipeline Optimization',
          date: '2025-01-14',
          session: 'Week 3 Sprint',
          summary_of_progress: 'Refactored data preprocessing pipeline, implemented caching layer, optimized batch processing',
          iteration_notes: 'Moved from sequential to parallel processing, reduced memory footprint by 60%',
          critique_feedback: 'Initial benchmarks show 40% improvement in training time',
          tags_keywords: 'machine-learning, pipeline, optimization, performance'
        }
      },
      {
        id: 2,
        template: 'Experiments',
        title: 'React State Management Comparison',
        date: '2025-01-13',
        preview: 'Compared Zustand vs Redux Toolkit performance in large applications...',
        values: {
          title: 'React State Management Comparison',
          date: '2025-01-13',
          experiment_name: 'State Management Performance Analysis',
          hypothesis: 'Zustand will provide better performance than Redux Toolkit in large applications',
          setup: 'Created test applications with 1000+ components, complex state interactions',
          results: 'Zustand showed 25% better rendering performance, 40% smaller bundle size',
          analysis: 'Zustand\'s simplified approach reduces boilerplate and improves developer experience',
          tags_keywords: 'react, state-management, performance, zustand, redux'
        }
      },
      {
        id: 3,
        template: 'Code_Studies',
        title: 'Three.js Animation Patterns',
        date: '2025-01-12',
        preview: 'Deep dive into requestAnimationFrame optimization and performance...',
        values: {
          title: 'Three.js Animation Patterns',
          date: '2025-01-12',
          subject: 'WebGL Animation Optimization',
          overview_purpose: 'Study modern animation patterns for high-performance 3D web experiences',
          structure_analysis: 'Analyzed render loop optimization, GPU utilization strategies',
          key_patterns_architectures: 'Frame-rate independent animations, object pooling, efficient matrix operations',
          takeaways_applications: 'Implementing delta-time based animations, using instancedMesh for performance',
          tags_keywords: 'threejs, webgl, animation, performance, 3d'
        }
      },
      {
        id: 4,
        template: 'Design_Sketchbook',
        title: 'Dashboard Layout Exploration',
        date: '2025-01-11',
        preview: 'Exploring modern dashboard layouts with focus on data visualization...',
        values: {
          title: 'Dashboard Layout Exploration',
          date: '2025-01-11',
          concept_focus: 'Data-dense dashboard interface',
          moodboard_inspiration: 'Analyzed modern SaaS dashboards, data visualization best practices',
          wireframes_layouts: 'Grid-based layouts with responsive card system',
          annotations_feedback: 'Focus on information hierarchy, reduce cognitive load',
          iteration_notes: 'Moved from sidebar to top navigation for better space utilization',
          tags_keywords: 'dashboard, ux, data-visualization, layout'
        }
      },
      {
        id: 5,
        template: 'Learning_Lab',
        title: 'WebAssembly Performance Study',
        date: '2025-01-10',
        preview: 'Experimental comparison of JavaScript vs WASM for computational tasks...',
        values: {
          title: 'WebAssembly Performance Study',
          date: '2025-01-10',
          experiment_name: 'JS vs WASM Performance Analysis',
          objective: 'Measure performance differences in computational workloads',
          hypothesis: 'WASM will show significant performance gains for CPU-intensive tasks',
          setup_method: 'Implemented image processing algorithms in both JS and WASM',
          observations_outcomes: 'WASM showed 3x performance improvement for mathematical operations',
          conclusions_lessons_learned: 'WASM excels at pure computation but has overhead for DOM interactions',
          tags_keywords: 'webassembly, performance, javascript, benchmarking'
        }
      }
    ]);
  }, []);

  if (!selectedTemplate) {
    return (
      <div className="archiva-dashboard archiva-home">
        <span className="icon">inventory_2</span>
        <h2>Welcome to Archiva</h2>
        <p>
          Your structured documentation workspace.
          <br />
          Select a template from the left to preview how your content will be rendered.
        </p>
      </div>
    );
  }

  return (
    <div className="booth-viewer">
      {/* Header Section with Template Information */}
      <BoothHeader
        icon="description"
        title={templateInfo?.name}
        typeText={`${templateInfo?.type} Template`}
        status={hasRenderer ? 'ready' : 'pending'}
        description={templateInfo?.purpose}
        align="top"
        actions={hasRenderer ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <button
              className="secondary"
              onClick={handleTestRealWorkflow}
              disabled={isGenerating}
              title="Generate with sample data"
            >
              <span className="icon">science</span>
              {isUsingRealWorkflow ? 'Sample Data' : 'Use Sample Data'}
            </button>
            <button
              className="booth-generate-btn primary"
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              title="Enhance output with AI"
            >
              <span className="icon">{isGenerating ? 'autorenew' : 'auto_awesome'}</span>
              {isGenerating ? 'Enhancing...' : 'Enhance with AI'}
            </button>
            <button
              className="secondary"
              onClick={handleSaveMock}
              disabled={!renderedContent?.md && !renderedContent?.html}
              title="Save current output to data/archivai-mock and open in Archiva"
            >
              <span className="icon">save</span>
              Save Mock → Archiva
            </button>
          </div>
        ) : null}
      >
        {hasRenderer && (() => {
          // Template-specific content based on selected template
          const templateSpecificContent = {
            'Code_Studies': {
              title: 'Code Studies Use Cases',
              items: [
                'Analyze complex codebases and architectural patterns',
                'Document performance optimizations and benchmarks',
                'Study framework implementations and design decisions',
                'Compare different approaches to solving similar problems'
              ]
            },
            'Process_Journal': {
              title: 'Process Journal Applications',
              items: [
                'Track daily development progress and iterations',
                'Document decision-making processes and rationales',
                'Record feedback loops and improvement cycles',
                'Maintain sprint retrospectives and learnings'
              ]
            },
            'Experiments': {
              title: 'Experiments Framework',
              items: [
                'Test hypotheses with controlled code experiments',
                'A/B test different implementation approaches',
                'Benchmark performance across different solutions',
                'Validate proof-of-concepts before full implementation'
              ]
            },
            'Design_Sketchbook': {
              title: 'Design Exploration Methods',
              items: [
                'Iterate on interface concepts and visual directions',
                'Document design system evolution and decisions',
                'Capture inspiration sources and mood boards',
                'Test user experience flows and interactions'
              ]
            },
            'Learning_Lab': {
              title: 'Learning Lab Methodology',
              items: [
                'Structure experimental learning with clear objectives',
                'Test new technologies in controlled environments',
                'Document skill acquisition and knowledge gaps',
                'Create reusable learning resources for teams'
              ]
            }
          };

          const content = templateSpecificContent[selectedTemplate] || {
            title: 'Template Applications',
            items: [
              'Structured documentation with consistent formatting',
              'Searchable knowledge base for project insights',
              'Collaborative workspace for team documentation',
              'Version-controlled content with markdown support'
            ]
          };

          return (
            <div className="prompt-info">
              <h4>{content.title}</h4>
              <ul>
                {content.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          );
        })()}
      </BoothHeader>

      {/* Main Canvas Section - Two Frame Layout */}
      <div className="booth-main" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 32px',
        minHeight: 'calc(100vh - 300px)'
      }}>
        {hasRenderer ? (
          <div className="current-work" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
            width: '100%',
            maxWidth: '1200px'
          }}>
            {/* Markdown Frame */}
            <Panel
              variant="input"
              title={<><span className="icon">code</span> Markdown</>}
              info="Source Format"
              style={{ flex: '1', minWidth: '0', maxWidth: '480px' }}
              footer={(
                <>
                  <button
                    className="image-action-btn"
                    onClick={() => {
                      const newContent = prompt('Edit the markdown content:', renderedContent.md);
                      if (newContent !== null) {
                        setRenderedContent({
                          md: newContent,
                          html: markdownToHtml(newContent)
                        });
                      }
                    }}
                    title="Edit markdown content"
                  >
                    <span className="icon">edit</span>
                    Edit
                  </button>
                  <button
                    className="image-action-btn"
                    onClick={handleDownloadMD}
                    title="Download Markdown file"
                  >
                    <span className="icon">download</span>
                    Download
                  </button>
                  <button
                    className="image-action-btn"
                    onClick={() => handleCopyToClipboard('md')}
                    title="Copy Markdown to clipboard"
                  >
                    <span className="icon">content_copy</span>
                    Copy
                  </button>
                </>
              )}
            >
              <div className="template-canvas">
                <div className="preview-content markdown-preview">
                  <pre className="markdown-raw">{renderedContent.md}</pre>
                </div>
              </div>
            </Panel>

            {/* Transform Arrow */}
            <div className="transformation-arrow">
              <span className="icon">arrow_forward</span>
              <span className="transform-label">Render</span>
            </div>

            {/* HTML Frame */}
            <Panel
              variant="output"
              title={<><span className="icon">web</span> HTML Preview</>}
              info="Rendered Output"
              style={{ flex: '1', minWidth: '0', maxWidth: '480px' }}
              footer={(
                <>
                  <button
                    className="image-action-btn"
                    onClick={handleDownloadHTML}
                    title="Download HTML file"
                  >
                    <span className="icon">download</span>
                    Download
                  </button>
                  <button
                    className="image-action-btn"
                    onClick={() => handleCopyToClipboard('html')}
                    title="Copy HTML to clipboard"
                  >
                    <span className="icon">content_copy</span>
                    Copy
                  </button>
                </>
              )}
            >
              <div className="template-canvas">
                <div
                  className="preview-content html-preview"
                  dangerouslySetInnerHTML={{
                    __html: renderedContent.html
                  }}
                />
              </div>
            </Panel>
          </div>
        ) : (
          <div className="placeholder-content">
            <span className="icon">construction</span>
            <h3>Template Renderer Available</h3>
            <p>This template now supports automatic rendering with our generic renderer.</p>
            <p><strong>All templates:</strong> Now fully functional with structured field rendering</p>
          </div>
        )}
      </div>

      {/* Footer Drawer: collapsed by default with handle */}
      <BoothFooterDrawer
        title="Archive Gallery"
        subtitle="Real examples of generated documentation"
      >
        <div className="history-scroll" style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: '16px'
        }}>
          <div className="saved-templates-grid" style={{
            display: 'flex',
            gap: '20px',
            minWidth: 'fit-content'
          }}>
            {savedTemplates.map(item => {
              const handleCardClick = () => {
                setCurrentWorkflowData({ title: item.title, values: item.values });
                useStore.setState({ selectedTemplateForPreview: item.template, activeEntryId: null });
              };
              return (
                <div key={item.id} className="template-card" onClick={handleCardClick} style={{ minWidth: '280px', width: '280px', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface)', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.3', flex: 1 }}>{item.title}</h4>
                    <span className="template-badge" style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'var(--color-accent)', color: 'white', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>{item.template.replace('_', ' ')}</span>
                  </div>
                  <p className="card-date" style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500' }}>{item.date}</p>
                  <p className="card-preview" style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>{item.preview}</p>
                  <div className="card-actions" style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button className="image-action-btn" onClick={(e) => { e.stopPropagation(); handleCardClick(); }} style={{ flex: 1, padding: '8px 12px', fontSize: '12px', fontWeight: '500', border: '1px solid var(--color-accent)', backgroundColor: 'transparent', color: 'var(--color-accent)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' }}>View</button>
                    <button className="image-action-btn" onClick={(e) => { e.stopPropagation(); const content = templateRenderers[item.template] ? templateRenderers[item.template]('md', { values: item.values }, templates[item.template]) : 'Content not available'; downloadDocumentation(content, `${item.title.replace(/\s+/g, '_')}_${Date.now()}`, 'md'); }} style={{ flex: 1, padding: '8px 12px', fontSize: '12px', fontWeight: '500', border: '1px solid var(--text-tertiary)', backgroundColor: 'transparent', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s ease' }}>Export</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </BoothFooterDrawer>
    </div>
  );
}

function BoothFooterDrawer({ title, subtitle, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={`booth-footer-handle ${open ? 'open' : ''}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        title={open ? 'Hide panel' : 'Show panel'}
      >
        <span className="icon">{open ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}</span>
      </button>
      <div className={`booth-footer-drawer ${open ? 'open' : 'collapsed'}`} role="region" aria-label={title}>
        <div className="history-header" style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{title}</h3>
          {subtitle && (
            <span className="history-count" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{subtitle}</span>
          )}
        </div>
        {children}
      </div>
    </>
  );
}
