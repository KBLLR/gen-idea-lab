

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import useStore from '../lib/store.js';
import { templates } from '../lib/archiva/templates.js';
import { render as renderProcessJournal } from '../lib/archiva/templates/process_journal.js';
import { render as renderExperimentReport } from '../lib/archiva/templates/experiment_report.js';
import { render as renderPromptCard } from '../lib/archiva/templates/prompt_card.js';
import {
  generateWorkflowDocumentation,
  downloadDocumentation,
  copyToClipboard,
  createSampleWorkflow,
  formatWorkflowMetrics
} from '../lib/archiva/workflow-service.js';

// Template renderers mapping
const templateRenderers = {
  'process_journal': renderProcessJournal,
  'experiment_report': renderExperimentReport,
  'prompt_card': renderPromptCard
};

// Sample workflow data for preview
const sampleWorkflowData = {
  title: "AI Model Comparison Workflow",
  workflow_id: "wf_001",
  run_id: "run_123",
  started_at: "2025-01-15T10:30:00Z",
  ended_at: "2025-01-15T10:45:00Z",
  context: "Testing different AI models for text generation quality and performance",
  method: "Sequential testing with standardized prompts across multiple model providers",
  summary: {
    findings: [
      "Claude 3.5 Sonnet showed best reasoning capabilities",
      "GPT-4o had fastest response times",
      "Gemini 2.0 provided most creative outputs"
    ],
    next_steps: [
      "Implement parallel testing for better comparison",
      "Add cost analysis metrics",
      "Test with domain-specific prompts"
    ]
  },
  steps: [
    {
      name: "Initialize Models",
      model: "gemma3:4b-it-qat",
      metrics: { latency_ms: 1200, tokens_in: 45, tokens_out: 128 },
      request: { prompt: "Generate a creative story about AI collaboration" },
      response: "In a world where artificial minds work together..."
    },
    {
      name: "Compare Outputs",
      model: "claude-3-5-sonnet",
      metrics: { latency_ms: 2100, tokens_in: 52, tokens_out: 256 }
    }
  ],
  hypothesis: "Different AI models will show distinct strengths in creative vs analytical tasks",
  discussion: "Results confirm our hypothesis with clear performance patterns emerging",
  limitations: "Limited to text-only tasks, sample size could be larger"
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
  const hasRenderer = templateInfo && templateRenderers[selectedTemplate.toLowerCase()];

  useEffect(() => {
    if (hasRenderer) {
      const renderer = templateRenderers[selectedTemplate.toLowerCase()];
      const mdContent = renderer('md', currentWorkflowData);
      const htmlContent = renderer('html', currentWorkflowData);
      setRenderedContent({ md: mdContent, html: htmlContent });
    }
  }, [selectedTemplate, hasRenderer, currentWorkflowData]);

  // Generate documentation with AI enhancement
  const handleGenerateWithAI = async () => {
    if (!hasRenderer) return;

    setIsGenerating(true);
    try {
      const result = await generateWorkflowDocumentation(
        currentWorkflowData,
        selectedTemplate.toLowerCase(),
        { enhanceWithAI: true, model: 'gemini-2.5-flash' }
      );

      setRenderedContent({
        md: result.renderedContent.markdown,
        html: result.renderedContent.html
      });
    } catch (error) {
      console.error('AI generation failed:', error);
      // Fallback to local rendering
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

  // Mock saved templates for gallery
  useEffect(() => {
    setSavedTemplates([
      {
        id: 1,
        template: 'Process_Journal',
        title: 'ML Pipeline Optimization',
        date: '2025-01-14',
        preview: 'Optimized data preprocessing pipeline, reduced training time by 40%...'
      },
      {
        id: 2,
        template: 'Experiments',
        title: 'React State Management Comparison',
        date: '2025-01-13',
        preview: 'Compared Zustand vs Redux Toolkit performance in large applications...'
      },
      {
        id: 3,
        template: 'Code_Studies',
        title: 'Three.js Animation Patterns',
        date: '2025-01-12',
        preview: 'Deep dive into requestAnimationFrame optimization and performance...'
      }
    ]);
  }, []);

  if (!selectedTemplate) {
    return (
      <div className="archiva-dashboard archiva-home">
        <span className="icon">inventory_2</span>
        <h2>Welcome to ArchivaAI</h2>
        <p>
          This is your space for structured, AI-powered documentation.
          <br />
          Select a template from the left to preview how your workflow results will be rendered.
        </p>
      </div>
    );
  }

  return (
    <div className="booth-viewer">
      {/* Header Section with Template Information */}
      <div className="booth-header">
        <div className="booth-title">
          <h1>📄 {templateInfo?.name}</h1>
          <div className="mode-meta">
            <span className="mode-type">{templateInfo?.type} Template</span>
            <span className="mode-status">{hasRenderer ? 'Ready' : 'Coming Soon'}</span>
          </div>
        </div>

        <div className="booth-description">
          <p className="description-text">{templateInfo?.purpose}</p>
          {hasRenderer && (
            <div className="prompt-info">
              <h4>Use Cases</h4>
              <ul>
                <li>Automatic documentation from workflow execution results</li>
                <li>Structured knowledge capture for module assistant</li>
                <li>Professional report generation with consistent formatting</li>
              </ul>
            </div>
          )}
        </div>

        {hasRenderer && (
          <div className="booth-actions">
            <button
              className="secondary"
              onClick={handleTestRealWorkflow}
              disabled={isGenerating}
            >
              <span className="icon">science</span>
              {isUsingRealWorkflow ? 'Using Real Data' : 'Test Real Workflow'}
            </button>
            <button
              className="booth-generate-btn primary"
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
            >
              <span className="icon">{isGenerating ? 'autorenew' : 'auto_awesome'}</span>
              {isGenerating ? 'Enhancing...' : 'Enhance with AI'}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Section */}
      <div className="booth-main">
        {hasRenderer ? (
          <div className="current-work">
            <div className="image-container input-container">
              <div className="image-header">
                <h3>Markdown Output</h3>
                <span className="image-info">Source Format</span>
              </div>
              <div className="preview-content markdown-preview">
                <ReactMarkdown>{renderedContent.md}</ReactMarkdown>
              </div>
            </div>

            <div className="transformation-arrow">
              <span className="icon">arrow_forward</span>
              <span className="transform-label">Render to HTML</span>
            </div>

            <div className="image-container output-container">
              <div className="image-header">
                <h3>HTML Output</h3>
                <span className="image-info">Rendered Format</span>
              </div>
              <div
                className="preview-content html-preview"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(renderedContent.html)
                }}
              />
              <div className="image-actions">
                <button
                  className="image-action-btn"
                  onClick={handleDownloadMD}
                  title="Download Markdown file"
                >
                  <span className="icon">download</span>
                  Download MD
                </button>
                <button
                  className="image-action-btn"
                  onClick={handleDownloadHTML}
                  title="Download HTML file"
                >
                  <span className="icon">download</span>
                  Download HTML
                </button>
                <button
                  className="image-action-btn"
                  onClick={() => handleCopyToClipboard('md')}
                  title="Copy Markdown to clipboard"
                >
                  <span className="icon">content_copy</span>
                  Copy MD
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="placeholder-content">
            <span className="icon">construction</span>
            <h3>Renderer Coming Soon</h3>
            <p>This template will support automatic rendering from workflow results.</p>
            <p><strong>Available now:</strong> Process Journal, Experiment Report, Prompt Card</p>
          </div>
        )}
      </div>

      {/* Footer Section with Archive Gallery */}
      <div className="booth-footer">
        <div className="history-header">
          <h3>Archive Gallery</h3>
          <span className="history-count">Real examples of generated documentation</span>
        </div>
        <div className="history-scroll">
          <div className="saved-templates-grid">
            {savedTemplates.map(item => (
              <div key={item.id} className="template-card">
                <div className="card-header">
                  <h4>{item.title}</h4>
                  <span className="template-badge">{item.template.replace('_', ' ')}</span>
                </div>
                <p className="card-date">{item.date}</p>
                <p className="card-preview">{item.preview}</p>
                <div className="card-actions">
                  <button className="image-action-btn">View</button>
                  <button className="image-action-btn">Export</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
