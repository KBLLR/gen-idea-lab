/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Service for integrating various outputs into the module knowledge base
 */
export class KnowledgeIntegration {
  constructor(store) {
    this.store = store;
  }

  /**
   * Add ArchivAI template output to module knowledge base
   */
  async addArchivAIOutput(moduleId, templateType, templateData, renderedContent) {
    try {
      const actions = this.store.getState().actions;

      // Create documentation entry from template output
      const docEntry = {
        title: `${templateType} - ${templateData.title || 'Generated Documentation'}`,
        description: this.extractDescription(templateType, templateData),
        content: renderedContent.markdown,
        htmlContent: renderedContent.html,
        format: 'markdown',
        source: 'archivai',
        templateType,
        templateData,
        preview: this.generatePreview(renderedContent.markdown),
        tags: this.generateTags(templateType, templateData),
        metadata: {
          generatedAt: new Date().toISOString(),
          templateVersion: '1.0',
          workflowId: templateData.workflow_id,
          runId: templateData.run_id
        }
      };

      const success = await actions.addDocumentationEntry(moduleId, docEntry);

      if (success) {
        console.log(`Added ArchivAI ${templateType} output to module ${moduleId} knowledge base`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to add ArchivAI output to knowledge base:', error);
      return false;
    }
  }

  /**
   * Add workflow execution to module knowledge base
   */
  async addWorkflowExecution(moduleId, workflowData, executionResults) {
    try {
      const actions = this.store.getState().actions;
      const modules = this.store.getState().modules;
      const assistantHistories = this.store.getState().assistantHistories;

      // Detect module assistant involvement
      const assistantInvolvement = this.detectAssistantInvolvement(moduleId, workflowData, executionResults);
      const collaborators = this.generateCollaborators(moduleId, assistantInvolvement);

      // Create workflow entry
      const workflowEntry = {
        title: workflowData.title || 'Workflow Execution',
        description: workflowData.description || 'Workflow execution results',
        status: executionResults.status || 'completed',
        progress: executionResults.progress || 100,
        steps: workflowData.steps || [],
        results: executionResults,
        collaborators, // Add collaborators including module assistant
        assistantInvolvement, // Track how the assistant was involved
        startTime: executionResults.startTime,
        endTime: executionResults.endTime,
        duration: executionResults.duration,
        preview: this.generateWorkflowPreview(workflowData, executionResults),
        tags: this.generateWorkflowTags(workflowData, assistantInvolvement),
        metadata: {
          workflowId: workflowData.id,
          executionId: executionResults.id,
          category: workflowData.category,
          difficulty: workflowData.difficulty,
          moduleAssistantInvolved: assistantInvolvement.involved,
          collaborationType: assistantInvolvement.type
        }
      };

      const success = await actions.addWorkflowEntry(moduleId, workflowEntry);

      if (success) {
        console.log(`Added workflow execution to module ${moduleId} knowledge base`, {
          assistantInvolved: assistantInvolvement.involved,
          collaborators: collaborators.length
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to add workflow to knowledge base:', error);
      return false;
    }
  }

  /**
   * Add assistant chat session to module knowledge base
   */
  async addChatSession(moduleId, chatData) {
    try {
      const actions = this.store.getState().actions;

      // Filter out system messages and create summary
      const userMessages = chatData.messages?.filter(msg =>
        msg.role === 'user' || msg.role === 'assistant'
      ) || [];

      const chatEntry = {
        title: this.generateChatTitle(userMessages),
        description: 'Assistant chat session',
        messages: userMessages,
        messageCount: userMessages.length,
        startTime: chatData.startTime || new Date().toISOString(),
        endTime: chatData.endTime || new Date().toISOString(),
        preview: this.generateChatPreview(userMessages),
        tags: ['chat', 'assistant', 'conversation'],
        metadata: {
          sessionId: chatData.sessionId,
          model: chatData.model,
          persona: chatData.persona,
          topics: this.extractChatTopics(userMessages)
        }
      };

      const success = await actions.addChatEntry(moduleId, chatEntry);

      if (success) {
        console.log(`Added chat session to module ${moduleId} knowledge base`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to add chat to knowledge base:', error);
      return false;
    }
  }

  /**
   * Auto-detect and add content to appropriate knowledge base section
   */
  async autoAddToKnowledgeBase(moduleId, content, contentType, metadata = {}) {
    switch (contentType) {
      case 'archivai_output':
        return this.addArchivAIOutput(
          moduleId,
          metadata.templateType,
          metadata.templateData,
          content
        );

      case 'workflow_execution':
        return this.addWorkflowExecution(moduleId, content, metadata.results || {});

      case 'chat_session':
        return this.addChatSession(moduleId, content);

      case 'documentation':
        return this.store.getState().actions.addDocumentationEntry(moduleId, {
          title: metadata.title || 'Manual Documentation',
          description: metadata.description || 'User-generated documentation',
          content: content,
          format: metadata.format || 'markdown',
          source: 'manual',
          ...metadata
        });

      default:
        console.warn(`Unknown content type: ${contentType}`);
        return false;
    }
  }

  /**
   * Detect if module assistant was involved in workflow execution
   */
  detectAssistantInvolvement(moduleId, workflowData, executionResults) {
    const assistantHistories = this.store.getState().assistantHistories;
    const orchestratorHistory = this.store.getState().orchestratorHistory;

    // Check if there's recent assistant activity for this module
    const moduleAssistantHistory = assistantHistories[moduleId];
    const hasRecentAssistantActivity = this.hasRecentActivity(moduleAssistantHistory, workflowData.startTime);

    // Check workflow execution logs for assistant mentions
    const assistantMentioned = this.checkAssistantMentions(workflowData, executionResults);

    // Check if orchestrator invited module assistant
    const orchestratorInvitedAssistant = this.checkOrchestratorInvitation(orchestratorHistory, moduleId);

    // Determine involvement type
    let involvementType = 'none';
    let involved = false;

    if (hasRecentAssistantActivity && assistantMentioned) {
      involvementType = 'direct_collaboration';
      involved = true;
    } else if (orchestratorInvitedAssistant) {
      involvementType = 'orchestrator_invited';
      involved = true;
    } else if (assistantMentioned) {
      involvementType = 'referenced';
      involved = true;
    } else if (hasRecentAssistantActivity) {
      involvementType = 'concurrent_activity';
      involved = true;
    }

    return {
      involved,
      type: involvementType,
      confidence: this.calculateInvolvementConfidence(involvementType, hasRecentAssistantActivity, assistantMentioned),
      evidence: {
        recentActivity: hasRecentAssistantActivity,
        mentioned: assistantMentioned,
        orchestratorInvited: orchestratorInvitedAssistant
      }
    };
  }

  /**
   * Generate collaborators list including module assistant if involved
   */
  generateCollaborators(moduleId, assistantInvolvement) {
    const modules = this.store.getState().modules;
    const personalities = this.store.getState().personalities || {};
    const collaborators = [];

    // Always add the user as primary collaborator
    collaborators.push({
      type: 'user',
      role: 'primary',
      name: 'User',
      contribution: 'Workflow execution and oversight'
    });

    // Add module assistant if involved
    if (assistantInvolvement.involved) {
      const moduleInfo = modules[moduleId];
      const personality = personalities[moduleId];

      collaborators.push({
        type: 'assistant',
        role: assistantInvolvement.type === 'direct_collaboration' ? 'co-author' : 'contributor',
        moduleId,
        name: personality?.name || `${moduleInfo?.['Module Code']} Assistant`,
        title: personality?.title || 'Module Assistant',
        contribution: this.getAssistantContribution(assistantInvolvement.type),
        confidence: assistantInvolvement.confidence
      });
    }

    // Check for orchestrator involvement
    const orchestratorHistory = this.store.getState().orchestratorHistory;
    if (this.hasRecentOrchestratorActivity(orchestratorHistory)) {
      collaborators.push({
        type: 'orchestrator',
        role: 'facilitator',
        name: 'Orchestrator',
        contribution: 'Workflow coordination and guidance',
        confidence: 0.8
      });
    }

    return collaborators;
  }

  /**
   * Generate workflow tags including assistant collaboration tags
   */
  generateWorkflowTags(workflowData, assistantInvolvement) {
    const tags = ['workflow', 'execution'];

    // Add category tags
    if (workflowData.category) tags.push(workflowData.category);
    if (workflowData.difficulty) tags.push(workflowData.difficulty);

    // Add collaboration tags
    if (assistantInvolvement.involved) {
      tags.push('assistant-collaboration');
      tags.push(`collaboration-${assistantInvolvement.type.replace('_', '-')}`);
    }

    return tags.filter(Boolean);
  }

  // Helper methods for involvement detection
  hasRecentActivity(assistantHistory, workflowStartTime) {
    if (!assistantHistory || !workflowStartTime) return false;

    const workflowStart = new Date(workflowStartTime);
    const timeWindow = 30 * 60 * 1000; // 30 minutes

    // Check if there was assistant activity within the time window
    return assistantHistory.some(session => {
      const sessionTime = new Date(session.timestamp || session.createdAt);
      return Math.abs(sessionTime - workflowStart) < timeWindow;
    });
  }

  checkAssistantMentions(workflowData, executionResults) {
    const searchText = JSON.stringify({ ...workflowData, ...executionResults }).toLowerCase();
    const assistantKeywords = ['assistant', 'help', 'guidance', 'suggestion', 'recommend', 'advice'];

    return assistantKeywords.some(keyword => searchText.includes(keyword));
  }

  checkOrchestratorInvitation(orchestratorHistory, moduleId) {
    if (!orchestratorHistory || !moduleId) return false;

    return orchestratorHistory.some(message => {
      const content = message.parts?.[0]?.text?.toLowerCase() || message.content?.toLowerCase() || '';
      return content.includes('invite') && content.includes(moduleId.toLowerCase());
    });
  }

  calculateInvolvementConfidence(type, recentActivity, mentioned) {
    switch (type) {
      case 'direct_collaboration':
        return 0.95;
      case 'orchestrator_invited':
        return 0.85;
      case 'referenced':
        return mentioned ? 0.7 : 0.5;
      case 'concurrent_activity':
        return recentActivity ? 0.6 : 0.3;
      default:
        return 0.1;
    }
  }

  getAssistantContribution(involvementType) {
    switch (involvementType) {
      case 'direct_collaboration':
        return 'Active collaboration and guidance during workflow execution';
      case 'orchestrator_invited':
        return 'Invited by orchestrator to provide domain expertise';
      case 'referenced':
        return 'Referenced or consulted during workflow execution';
      case 'concurrent_activity':
        return 'Active in parallel session during workflow execution';
      default:
        return 'Potential contribution to workflow process';
    }
  }

  hasRecentOrchestratorActivity(orchestratorHistory) {
    if (!orchestratorHistory || orchestratorHistory.length === 0) return false;

    const recentTime = Date.now() - (60 * 60 * 1000); // 1 hour ago
    const lastMessage = orchestratorHistory[orchestratorHistory.length - 1];
    const lastMessageTime = new Date(lastMessage.timestamp || Date.now()).getTime();

    return lastMessageTime > recentTime;
  }

  // Helper methods for content processing
  extractDescription(templateType, templateData) {
    switch (templateType.toLowerCase()) {
      case 'process_journal':
        return `Process documentation for: ${templateData.context || 'workflow execution'}`;
      case 'experiment_report':
        return `Experimental results for: ${templateData.hypothesis || 'hypothesis testing'}`;
      case 'prompt_card':
        return `Prompt engineering documentation: ${templateData.prompt_name || 'prompt design'}`;
      default:
        return `${templateType} documentation generated from workflow data`;
    }
  }

  generatePreview(content) {
    // Extract first meaningful paragraph, skip headers
    const lines = content.split('\n').filter(line => line.trim());
    const contentLines = lines.filter(line => !line.startsWith('#') && line.length > 20);
    return contentLines[0]?.substring(0, 150) + '...' || lines[0]?.substring(0, 150) + '...';
  }

  generateTags(templateType, templateData) {
    const tags = ['documentation', 'archivai', templateType.toLowerCase()];

    // Add contextual tags based on template data
    if (templateData.workflow_id) tags.push('workflow');
    if (templateData.run_id) tags.push('execution');
    if (templateData.method) tags.push('methodology');
    if (templateData.hypothesis) tags.push('experiment');

    return tags;
  }

  generateWorkflowPreview(workflowData, executionResults) {
    const stepCount = workflowData.steps?.length || 0;
    const duration = executionResults.duration || 'unknown';
    const status = executionResults.status || 'completed';

    return `Workflow with ${stepCount} steps, ${status} in ${duration}. ${workflowData.description || ''}`.substring(0, 150);
  }

  generateChatTitle(messages) {
    if (!messages.length) return 'Empty Chat Session';

    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage?.content) {
      // Extract key topics from first user message
      const content = firstUserMessage.content.substring(0, 50);
      return `Chat: ${content}${firstUserMessage.content.length > 50 ? '...' : ''}`;
    }

    return `Chat Session (${messages.length} messages)`;
  }

  generateChatPreview(messages) {
    const userMessage = messages.find(msg => msg.role === 'user')?.content;
    const assistantMessage = messages.find(msg => msg.role === 'assistant')?.content;

    if (userMessage && assistantMessage) {
      return `Q: ${userMessage.substring(0, 50)}... A: ${assistantMessage.substring(0, 50)}...`;
    }

    return `${messages.length} messages exchanged in this session`;
  }

  extractChatTopics(messages) {
    // Simple keyword extraction from user messages
    const keywords = [];
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'can', 'could', 'should', 'would', 'i', 'you', 'he', 'she', 'it', 'we', 'they']);

    messages
      .filter(msg => msg.role === 'user')
      .forEach(msg => {
        const words = msg.content?.toLowerCase().match(/\b\w+\b/g) || [];
        words.forEach(word => {
          if (word.length > 3 && !commonWords.has(word) && !keywords.includes(word)) {
            keywords.push(word);
          }
        });
      });

    return keywords.slice(0, 5); // Return top 5 keywords
  }
}

// Global instance
let globalKnowledgeIntegration = null;

export function getKnowledgeIntegration(store) {
  if (!globalKnowledgeIntegration) {
    globalKnowledgeIntegration = new KnowledgeIntegration(store);
  }
  return globalKnowledgeIntegration;
}

export default KnowledgeIntegration;