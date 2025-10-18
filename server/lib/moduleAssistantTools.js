/**
 * Module Assistant Tools
 *
 * Function definitions and handlers for module AI assistants.
 * These tools enable assistants to:
 * - Search and add to student knowledge bases
 * - Generate personalized exercises
 * - Assess understanding
 * - Suggest resources
 * - Make cross-module connections
 */

import { EmbeddingService } from './embeddingService.js';

/**
 * Tool definitions in Gemini function-calling format
 */
export const moduleAssistantToolDefinitions = [
  {
    name: 'query_knowledge_base',
    description: 'Search the student\'s personal knowledge base for this module using semantic similarity. Use this to understand what the student has already learned.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The concept or topic to search for in the knowledge base'
        },
        topK: {
          type: 'number',
          description: 'Number of results to return (default: 5)',
          default: 5
        }
      },
      required: ['query']
    }
  },
  {
    name: 'add_to_knowledge_base',
    description: 'Save an important concept, insight, or learning to the student\'s knowledge base. Use this when the student demonstrates understanding or when you explain key concepts.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The knowledge to save (concept explanation, example, or insight)'
        },
        type: {
          type: 'string',
          enum: ['concept', 'example', 'question', 'answer', 'note'],
          description: 'Type of knowledge being saved'
        },
        topic: {
          type: 'string',
          description: 'The topic this knowledge relates to (e.g., "version_control", "algorithms")'
        },
        confidence: {
          type: 'number',
          description: 'Estimated confidence/mastery level (0-1)',
          minimum: 0,
          maximum: 1
        }
      },
      required: ['text', 'type', 'topic']
    }
  },
  {
    name: 'generate_exercise',
    description: 'Create a practice exercise aligned with module objectives. Use when student needs practice or wants to test understanding.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The topic to create an exercise for'
        },
        difficulty: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'Difficulty level based on student\'s current mastery'
        },
        exerciseType: {
          type: 'string',
          enum: ['coding', 'conceptual', 'design', 'analysis', 'reflection'],
          description: 'Type of exercise to generate'
        }
      },
      required: ['topic', 'difficulty', 'exerciseType']
    }
  },
  {
    name: 'assess_understanding',
    description: 'Evaluate student\'s understanding of a concept based on their responses. Use to estimate mastery and identify knowledge gaps.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The topic being assessed'
        },
        studentResponse: {
          type: 'string',
          description: 'The student\'s explanation or answer to evaluate'
        },
        criteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific criteria to assess (e.g., ["correctness", "depth", "application"])'
        }
      },
      required: ['topic', 'studentResponse']
    }
  },
  {
    name: 'suggest_resources',
    description: 'Recommend learning resources based on student\'s current progress and knowledge gaps.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The topic to find resources for'
        },
        resourceType: {
          type: 'string',
          enum: ['documentation', 'tutorial', 'video', 'book', 'practice', 'article'],
          description: 'Type of resource to suggest'
        },
        skillLevel: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'Student\'s current skill level for this topic'
        }
      },
      required: ['topic']
    }
  },
  {
    name: 'connect_to_other_modules',
    description: 'Find connections between current topic and other CODE University modules. Use to show interdisciplinary relationships.',
    parameters: {
      type: 'object',
      properties: {
        concept: {
          type: 'string',
          description: 'The concept to find cross-module connections for'
        },
        maxConnections: {
          type: 'number',
          description: 'Maximum number of module connections to return (default: 3)',
          default: 3
        }
      },
      required: ['concept']
    }
  }
];

/**
 * Tool handler class
 * Implements the actual logic for each tool
 */
export class ModuleAssistantToolHandler {
  constructor(embeddingService, moduleCode, userId) {
    this.embeddingService = embeddingService;
    this.moduleCode = moduleCode;
    this.userId = userId;
  }

  /**
   * Query student's knowledge base
   */
  async query_knowledge_base({ query, topK = 5 }) {
    try {
      const result = await this.embeddingService.searchKnowledge(
        this.moduleCode,
        this.userId,
        query,
        topK,
        0.7 // threshold
      );

      if (result.results.length === 0) {
        return {
          success: true,
          message: 'No existing knowledge found for this topic. This is a new area for the student.',
          results: []
        };
      }

      return {
        success: true,
        message: `Found ${result.results.length} relevant knowledge items`,
        results: result.results.map(r => ({
          text: r.text,
          type: r.type,
          similarity: r.similarity,
          topic: r.metadata?.topic,
          timestamp: r.timestamp
        }))
      };
    } catch (error) {
      console.error('[ToolHandler] Error querying knowledge base:', error);
      return {
        success: false,
        error: 'Failed to query knowledge base'
      };
    }
  }

  /**
   * Add to knowledge base
   */
  async add_to_knowledge_base({ text, type, topic, confidence = 0.5 }) {
    try {
      const result = await this.embeddingService.addKnowledge(
        this.moduleCode,
        this.userId,
        text,
        type,
        {
          topic,
          confidence,
          source: 'assistant'
        }
      );

      return {
        success: true,
        message: `Added ${result.chunkCount} knowledge item(s) to your knowledge base for topic: ${topic}`,
        chunkCount: result.chunkCount
      };
    } catch (error) {
      console.error('[ToolHandler] Error adding to knowledge base:', error);
      return {
        success: false,
        error: 'Failed to add to knowledge base'
      };
    }
  }

  /**
   * Generate exercise
   */
  async generate_exercise({ topic, difficulty, exerciseType }) {
    // Exercise generation templates based on type and difficulty
    const exercises = {
      coding: {
        beginner: `Write a simple program that demonstrates ${topic}. Start with basic concepts and focus on clarity over complexity.`,
        intermediate: `Implement a solution that applies ${topic} to solve a practical problem. Include error handling and documentation.`,
        advanced: `Design and implement an efficient solution using ${topic}. Consider edge cases, performance, and scalability.`
      },
      conceptual: {
        beginner: `Explain the concept of ${topic} in your own words. What problem does it solve?`,
        intermediate: `Compare and contrast ${topic} with related concepts. When would you use each?`,
        advanced: `Analyze the trade-offs and design decisions behind ${topic}. How does it fit into larger architectural patterns?`
      },
      design: {
        beginner: `Sketch a simple design that incorporates ${topic}. Label the key components.`,
        intermediate: `Create a detailed design for a system that uses ${topic}. Include user flows and interactions.`,
        advanced: `Design a scalable solution using ${topic}. Consider accessibility, internationalization, and performance.`
      },
      analysis: {
        beginner: `Review this example related to ${topic} and identify the main components.`,
        intermediate: `Analyze how ${topic} is applied in real-world systems. What patterns do you notice?`,
        advanced: `Critically evaluate different approaches to ${topic}. What are the strengths and weaknesses of each?`
      },
      reflection: {
        beginner: `Reflect on what you've learned about ${topic}. What was most surprising?`,
        intermediate: `How does ${topic} connect to your previous experience? Where might you apply it?`,
        advanced: `Synthesize your understanding of ${topic} with other concepts you've learned. What broader insights emerge?`
      }
    };

    const prompt = exercises[exerciseType]?.[difficulty] ||
                  `Create an exercise about ${topic} at ${difficulty} level`;

    return {
      success: true,
      exercise: {
        topic,
        difficulty,
        type: exerciseType,
        prompt,
        estimatedTime: difficulty === 'beginner' ? '15-20 min' :
                       difficulty === 'intermediate' ? '30-45 min' : '60+ min',
        objectives: [
          `Demonstrate understanding of ${topic}`,
          `Apply concepts in practical context`,
          `Identify potential challenges and solutions`
        ]
      }
    };
  }

  /**
   * Assess understanding
   */
  async assess_understanding({ topic, studentResponse, criteria = ['correctness', 'depth', 'clarity'] }) {
    // Simple heuristic assessment (in production, use AI to evaluate)
    const wordCount = studentResponse.split(/\s+/).length;
    const hasExamples = /example|instance|such as|for example/i.test(studentResponse);
    const hasTechnicalTerms = /function|class|variable|algorithm|data structure/i.test(studentResponse);

    let estimatedMastery = 0.5; // baseline

    // Adjust based on response characteristics
    if (wordCount > 100) estimatedMastery += 0.1;
    if (wordCount > 200) estimatedMastery += 0.1;
    if (hasExamples) estimatedMastery += 0.15;
    if (hasTechnicalTerms) estimatedMastery += 0.15;

    // Cap at 1.0
    estimatedMastery = Math.min(estimatedMastery, 1.0);

    const feedback = [];
    if (estimatedMastery >= 0.8) {
      feedback.push('Strong understanding demonstrated');
    } else if (estimatedMastery >= 0.6) {
      feedback.push('Good foundation, could expand with more examples');
    } else {
      feedback.push('Understanding developing, review key concepts');
    }

    return {
      success: true,
      assessment: {
        topic,
        estimatedMastery,
        criteria: criteria.map(c => ({
          criterion: c,
          score: estimatedMastery,
          feedback: feedback[0]
        })),
        overallFeedback: feedback.join('. '),
        nextSteps: estimatedMastery >= 0.8 ?
          'Try more advanced exercises' :
          'Practice with guided examples'
      }
    };
  }

  /**
   * Suggest resources
   */
  async suggest_resources({ topic, resourceType, skillLevel = 'intermediate' }) {
    // Curated resource suggestions (in production, integrate with real resource database)
    const resources = {
      documentation: [
        {
          title: `Official ${topic} Documentation`,
          url: `#docs-${topic}`,
          description: 'Comprehensive reference and examples',
          level: skillLevel
        }
      ],
      tutorial: [
        {
          title: `Getting Started with ${topic}`,
          url: `#tutorial-${topic}`,
          description: 'Step-by-step guide for beginners',
          level: 'beginner'
        },
        {
          title: `Advanced ${topic} Techniques`,
          url: `#advanced-${topic}`,
          description: 'Deep dive into advanced patterns',
          level: 'advanced'
        }
      ],
      video: [
        {
          title: `${topic} Explained`,
          url: `#video-${topic}`,
          description: 'Visual explanation with examples',
          level: skillLevel
        }
      ],
      practice: [
        {
          title: `${topic} Coding Challenges`,
          url: `#practice-${topic}`,
          description: 'Hands-on exercises to build skills',
          level: skillLevel
        }
      ]
    };

    const typeResources = resources[resourceType] || resources.documentation;

    return {
      success: true,
      resources: typeResources,
      message: `Recommended ${resourceType} resources for ${topic} at ${skillLevel} level`
    };
  }

  /**
   * Find cross-module connections
   */
  async connect_to_other_modules({ concept, maxConnections = 3 }) {
    try {
      const result = await this.embeddingService.findCrossModuleConnections(
        concept,
        this.moduleCode, // exclude current module
        maxConnections
      );

      if (result.connections.length === 0) {
        return {
          success: true,
          message: 'No strong connections found yet. As you learn more modules, connections will emerge.',
          connections: []
        };
      }

      return {
        success: true,
        message: `Found ${result.connections.length} modules with related content`,
        connections: result.connections.map(c => ({
          moduleCode: c.moduleCode,
          moduleTitle: c.moduleTitle,
          discipline: c.discipline,
          similarity: c.matches[0]?.similarity,
          context: c.matches[0]?.text.substring(0, 200) + '...'
        }))
      };
    } catch (error) {
      console.error('[ToolHandler] Error finding connections:', error);
      return {
        success: false,
        error: 'Failed to find module connections'
      };
    }
  }

  /**
   * Execute tool by name
   */
  async executeTool(toolName, parameters) {
    if (typeof this[toolName] !== 'function') {
      return {
        success: false,
        error: `Unknown tool: ${toolName}`
      };
    }

    return await this[toolName](parameters);
  }
}

/**
 * Create tool handler for a specific module/user
 */
export function createModuleToolHandler(embeddingService, moduleCode, userId) {
  return new ModuleAssistantToolHandler(embeddingService, moduleCode, userId);
}

export default {
  moduleAssistantToolDefinitions,
  ModuleAssistantToolHandler,
  createModuleToolHandler
};
