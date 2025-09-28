/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const workflowTemplates = {
  design_thinking_process: {
    id: "design_thinking_process",
    title: "Design Thinking Process",
    description: "Complete design thinking methodology from empathy to testing",
    moduleId: "DS_06",
    category: "design_research",
    difficulty: "intermediate",
    estimatedTime: "45-60 minutes",

    metadata: {
      tags: ["design", "research", "methodology", "UX"],
      learningObjectives: [
        "Apply design thinking methodology systematically",
        "Conduct effective user research",
        "Generate creative solutions through structured ideation"
      ]
    },

    steps: [
      {
        id: "empathize",
        title: "Empathize - Understand Your Users",
        type: "prompt_chain",
        promptChain: [
          {
            id: "empathize_1",
            prompt: "Let's start your design thinking journey! Tell me about the project or challenge you're working on. What problem are you trying to solve?",
            waitForUser: true
          },
          {
            id: "empathize_2",
            prompt: "Great! Now let's dive deep into understanding your users. Who do you think your target users are? Describe them in detail.",
            dependsOn: "empathize_1"
          }
        ],
        guidance: {
          explanation: "The Empathize phase is about understanding user needs, thoughts, emotions, and motivations. This forms the foundation of human-centered design.",
          tips: [
            "Observe what users do, not just what they say",
            "Ask 'why' questions to uncover deeper motivations",
            "Look for emotional responses and pain points"
          ],
          resources: [
            { type: "notion", title: "User Research Template", id: "template_interviews" },
            { type: "figma", title: "Journey Map Template", id: "template_journey" }
          ]
        }
      },
      {
        id: "define",
        title: "Define - Synthesize the Problem",
        type: "interactive",
        prompt: {
          system: "Help the student synthesize their user research into a clear problem statement.",
          user: "Based on my user research, help me create a clear problem statement that captures the core user need."
        },
        guidance: {
          explanation: "The Define phase synthesizes observations into a core problem. A good problem statement is human-centered and actionable.",
          frameworks: [
            "Point of View: [User] + [Need] + [Insight]",
            "How Might We questions for ideation focus"
          ]
        }
      }
    ],

    completion: {
      deliverables: ["user_research_insights", "problem_statement", "ideation_results"],
      reflection_prompts: [
        "What was your biggest learning about your users?",
        "How did your understanding of the problem evolve?"
      ]
    }
  },

  algorithm_design_process: {
    id: "algorithm_design_process",
    title: "Algorithm Design & Analysis",
    description: "Systematic approach to designing, implementing, and analyzing algorithms",
    moduleId: "SE_02",
    category: "programming",
    difficulty: "intermediate",
    estimatedTime: "30-45 minutes",

    metadata: {
      tags: ["algorithms", "programming", "analysis", "complexity"],
      learningObjectives: [
        "Analyze problems systematically",
        "Design efficient algorithms",
        "Evaluate time and space complexity"
      ]
    },

    steps: [
      {
        id: "problem_analysis",
        title: "Analyze the Problem",
        type: "prompt_chain",
        promptChain: [
          {
            id: "problem_understanding",
            prompt: "Let's start by understanding your algorithm challenge. Describe the problem you need to solve - what are the inputs, expected outputs, and any constraints?",
            waitForUser: true
          },
          {
            id: "edge_cases",
            prompt: "Great! Now let's think about edge cases. What are the smallest, largest, or most unusual inputs your algorithm might encounter?",
            dependsOn: "problem_understanding"
          }
        ],
        guidance: {
          explanation: "Problem analysis is crucial for algorithm design. Understanding the problem deeply prevents wasted effort on wrong solutions.",
          checklist: [
            "Clear input/output specification",
            "Edge cases identified",
            "Constraints understood",
            "Performance requirements defined"
          ]
        }
      }
    ]
  }
};

export const getWorkflowsForModule = (moduleId) => {
  return Object.values(workflowTemplates).filter(w => w.moduleId === moduleId);
};

export const getWorkflowById = (workflowId) => {
  return workflowTemplates[workflowId];
};