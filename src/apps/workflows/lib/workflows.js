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
    category: "module_assistant",
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
    category: "module_assistant",
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
  },

  // Orchestrator Workflows - Cross-module coordination
  project_kickoff: {
    id: "project_kickoff",
    title: "Project Kickoff & Planning",
    description: "Guide teams through project initialization, scope definition, and resource planning",
    moduleId: null, // Orchestrator workflows are cross-module
    category: "orchestrator",
    difficulty: "intermediate",
    estimatedTime: "60-90 minutes",

    metadata: {
      tags: ["project-management", "planning", "team-coordination"],
      learningObjectives: [
        "Define clear project scope and objectives",
        "Identify required resources and team roles",
        "Create actionable project timeline",
        "Establish communication and workflow processes"
      ]
    },

    steps: [
      {
        id: "project_definition",
        title: "Define Project Scope & Objectives",
        type: "prompt_chain",
        promptChain: [
          {
            id: "scope_discovery",
            prompt: "Let's start your project! First, tell me about the problem you're trying to solve or the opportunity you want to pursue. What's the core challenge?",
            waitForUser: true
          },
          {
            id: "success_metrics",
            prompt: "Great! Now let's define success. How will you know this project has achieved its goals? What specific outcomes or metrics will indicate success?",
            dependsOn: "scope_discovery"
          }
        ],
        guidance: {
          explanation: "The orchestrator helps teams align on project fundamentals before diving into execution. Focus on clarity and measurable outcomes.",
          tips: [
            "Ask clarifying questions to uncover hidden assumptions",
            "Push for specific, measurable success criteria",
            "Identify potential stakeholders early in the conversation",
            "Help teams think through constraints and limitations"
          ]
        }
      },
      {
        id: "team_module_mapping",
        title: "Map Team Skills to Required Modules",
        type: "interactive",
        prompt: {
          system: "Help the team identify which CODE University modules and skills are needed for this project, and map team members to appropriate roles.",
          user: "Based on our project scope, help me figure out what skills we'll need and which team members should focus on which modules."
        },
        guidance: {
          explanation: "The orchestrator connects project requirements to academic modules and helps distribute work based on team member strengths and learning goals.",
          frameworks: [
            "Module mapping: SE (technical), DS (design), STS (research/business)",
            "Skill assessment: current abilities vs. project requirements",
            "Learning opportunities: stretch assignments for growth"
          ]
        }
      }
    ],

    completion: {
      deliverables: ["project_charter", "team_roles_matrix", "module_learning_plan"],
      reflection_prompts: [
        "How well does our team composition match project requirements?",
        "What are the biggest risks or unknowns in our plan?",
        "How will we coordinate across different modules and disciplines?"
      ]
    }
  },

  interdisciplinary_synthesis: {
    id: "interdisciplinary_synthesis",
    title: "Cross-Module Integration & Synthesis",
    description: "Help teams integrate insights and deliverables from different academic modules into cohesive solutions",
    moduleId: null,
    category: "orchestrator",
    difficulty: "advanced",
    estimatedTime: "45-75 minutes",

    metadata: {
      tags: ["integration", "synthesis", "interdisciplinary"],
      learningObjectives: [
        "Identify connections between different disciplinary approaches",
        "Synthesize technical, design, and business perspectives",
        "Resolve conflicts between different module recommendations",
        "Create unified project vision from diverse inputs"
      ]
    },

    steps: [
      {
        id: "perspective_gathering",
        title: "Gather Multi-Module Perspectives",
        type: "prompt_chain",
        promptChain: [
          {
            id: "collect_insights",
            prompt: "Let's bring together insights from your different module work. What have you learned from the technical/SE perspective? What about design/DS insights? And any business/STS considerations?",
            waitForUser: true
          },
          {
            id: "identify_tensions",
            prompt: "I notice some potential tensions between these different perspectives. Where do the technical constraints conflict with design ideals? How do business requirements challenge both?",
            dependsOn: "collect_insights"
          }
        ],
        guidance: {
          explanation: "The orchestrator helps teams see their project from multiple disciplinary lenses and identifies where different approaches might conflict or complement each other.",
          tips: [
            "Actively look for contradictions between different module approaches",
            "Help teams see tensions as creative opportunities, not problems",
            "Encourage specific examples rather than abstract statements",
            "Guide teams to prioritize based on user/stakeholder needs"
          ]
        }
      }
    ]
  },

  learning_reflection: {
    id: "learning_reflection",
    title: "Learning Journey Reflection & Portfolio",
    description: "Guide students through systematic reflection on their learning across modules and projects",
    moduleId: null,
    category: "orchestrator",
    difficulty: "beginner",
    estimatedTime: "30-45 minutes",

    metadata: {
      tags: ["reflection", "learning", "portfolio", "metacognition"],
      learningObjectives: [
        "Articulate learning growth across different modules",
        "Connect academic work to personal/professional goals",
        "Identify patterns in learning preferences and challenges",
        "Plan future learning based on reflection insights"
      ]
    },

    steps: [
      {
        id: "learning_inventory",
        title: "Inventory Learning Experiences",
        type: "prompt",
        prompt: {
          system: "Help the student reflect systematically on their learning journey across different modules and projects. Focus on both successes and challenges.",
          user: "Help me reflect on my learning journey this semester. What have been my biggest growth areas, challenges, and insights across different modules?"
        },
        guidance: {
          explanation: "The orchestrator facilitates deep reflection that connects learning across modules and helps students see patterns in their development.",
          tips: [
            "Ask for specific examples and evidence of learning",
            "Help students connect academic work to real-world applications",
            "Encourage honest assessment of both strengths and areas for growth",
            "Guide students to see failures as learning opportunities"
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