/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Task definitions for module assistants
 * Each assistant can perform both common tasks and specialized tasks based on their domain
 */

// Common tasks that all assistants can perform
export const commonTasks = {
  research: {
    id: 'research',
    name: 'Research Initial Concepts',
    description: 'Gather relevant information and resources for the project',
    estimatedTime: '5-10 minutes',
    outputs: ['Resource links', 'Key concepts', 'Background information']
  },
  analyze: {
    id: 'analyze',
    name: 'Analyze Requirements',
    description: 'Break down project requirements and identify key challenges',
    estimatedTime: '3-7 minutes',
    outputs: ['Requirement breakdown', 'Challenge identification', 'Success criteria']
  },
  brainstorm: {
    id: 'brainstorm',
    name: 'Generate Ideas',
    description: 'Propose creative solutions and approaches',
    estimatedTime: '5-8 minutes',
    outputs: ['Concept ideas', 'Approach options', 'Creative alternatives']
  },
  plan: {
    id: 'plan',
    name: 'Create Action Plan',
    description: 'Develop a structured approach with timeline and milestones',
    estimatedTime: '7-12 minutes',
    outputs: ['Project timeline', 'Milestone breakdown', 'Resource allocation']
  },
  review: {
    id: 'review',
    name: 'Review & Critique',
    description: 'Provide constructive feedback on existing work',
    estimatedTime: '3-6 minutes',
    outputs: ['Strengths analysis', 'Improvement suggestions', 'Best practices']
  }
};

// Specialized tasks by module domain
export const specializedTasks = {
  // Orientation Modules (OS)
  OS_01: { // The Architect - Software Engineering intro
    architecture: {
      id: 'architecture',
      name: 'Design System Architecture',
      description: 'Create high-level software architecture and design patterns',
      estimatedTime: '10-15 minutes',
      outputs: ['Architecture diagrams', 'Design patterns', 'System components']
    },
    processDesign: {
      id: 'processDesign',
      name: 'Development Process Design',
      description: 'Establish development workflows and best practices',
      estimatedTime: '8-12 minutes',
      outputs: ['Development workflow', 'Quality gates', 'Tool recommendations']
    },
    learningPath: {
      id: 'learningPath',
      name: 'Programming Learning Path',
      description: 'Create personalized learning roadmap for programming skills',
      estimatedTime: '6-10 minutes',
      outputs: ['Learning roadmap', 'Resource recommendations', 'Skill assessment']
    }
  },

  OS_02: { // The Visionary - Design intro
    designMethods: {
      id: 'designMethods',
      name: 'Apply Design Methods',
      description: 'Introduce and apply fundamental design research methods',
      estimatedTime: '8-12 minutes',
      outputs: ['Method recommendations', 'Research framework', 'Design brief']
    },
    creativeResponse: {
      id: 'creativeResponse',
      name: 'Develop Creative Response',
      description: 'Generate context-appropriate creative solutions',
      estimatedTime: '10-15 minutes',
      outputs: ['Creative concepts', 'Visual exploration', 'Iteration plan']
    }
  },

  OS_03: { // The Strategist - Business Management
    businessModel: {
      id: 'businessModel',
      name: 'Business Model Analysis',
      description: 'Analyze and design business models and value propositions',
      estimatedTime: '12-18 minutes',
      outputs: ['Business model canvas', 'Value proposition', 'Market analysis']
    },
    productStrategy: {
      id: 'productStrategy',
      name: 'Product Strategy Development',
      description: 'Create product discovery and market strategy framework',
      estimatedTime: '10-15 minutes',
      outputs: ['Product roadmap', 'Market positioning', 'Competitive analysis']
    }
  },

  OS_05: { // The Collaborator - Project-Based Learning
    teamDynamics: {
      id: 'teamDynamics',
      name: 'Optimize Team Collaboration',
      description: 'Facilitate team formation and collaborative workflows',
      estimatedTime: '8-12 minutes',
      outputs: ['Team structure', 'Collaboration tools', 'Communication plan']
    },
    projectManagement: {
      id: 'projectManagement',
      name: 'Project Management Setup',
      description: 'Establish project-based learning framework and milestones',
      estimatedTime: '10-15 minutes',
      outputs: ['Project framework', 'Learning objectives', 'Assessment criteria']
    }
  },

  STS_01: { // The Ethicist - Science, Technology & Society
    ethicalAnalysis: {
      id: 'ethicalAnalysis',
      name: 'Ethical Impact Assessment',
      description: 'Analyze ethical implications and societal impact of technology',
      estimatedTime: '10-15 minutes',
      outputs: ['Ethical considerations', 'Social impact analysis', 'Mitigation strategies']
    },
    criticalThinking: {
      id: 'criticalThinking',
      name: 'Critical Technology Analysis',
      description: 'Apply critical analytical thinking to technology and society',
      estimatedTime: '8-12 minutes',
      outputs: ['Critical analysis', 'Alternative perspectives', 'Research questions']
    }
  },

  // Design System Modules (DS)
  DS_01: { // The Composer - Composition
    visualComposition: {
      id: 'visualComposition',
      name: 'Visual Composition Analysis',
      description: 'Apply gestalt principles and composition techniques',
      estimatedTime: '8-12 minutes',
      outputs: ['Composition guidelines', 'Visual hierarchy', 'Color/contrast strategy']
    },
    photographyDirection: {
      id: 'photographyDirection',
      name: 'Photography Direction',
      description: 'Provide guidance on photography and visual media techniques',
      estimatedTime: '6-10 minutes',
      outputs: ['Photography brief', 'Lighting setup', 'Composition tips']
    }
  },

  DS_02: { // The Automaton - Generative Design
    generativeCode: {
      id: 'generativeCode',
      name: 'Generative Code Concepts',
      description: 'Design algorithmic and generative design approaches',
      estimatedTime: '12-18 minutes',
      outputs: ['Code concepts', 'Algorithm ideas', 'Parameter systems']
    },
    creativeAutomation: {
      id: 'creativeAutomation',
      name: 'Creative Automation',
      description: 'Develop automated creative processes and workflows',
      estimatedTime: '10-15 minutes',
      outputs: ['Automation concepts', 'Tool recommendations', 'Workflow design']
    }
  },

  DS_03: { // The Editor - Editorial Design
    editorialSystem: {
      id: 'editorialSystem',
      name: 'Editorial Design System',
      description: 'Create comprehensive editorial design and grid systems',
      estimatedTime: '10-15 minutes',
      outputs: ['Grid system', 'Typography scale', 'Layout templates']
    },
    contentStrategy: {
      id: 'contentStrategy',
      name: 'Content Strategy',
      description: 'Develop content organization and visual hierarchy',
      estimatedTime: '8-12 minutes',
      outputs: ['Content structure', 'Editorial guidelines', 'Publication plan']
    }
  },

  DS_05: { // The Historian - Design History
    historicalContext: {
      id: 'historicalContext',
      name: 'Historical Design Context',
      description: 'Provide historical perspective and theoretical framework',
      estimatedTime: '8-12 minutes',
      outputs: ['Historical references', 'Design movements', 'Theoretical framework']
    },
    futureOriented: {
      id: 'futureOriented',
      name: 'Future-Oriented Design',
      description: 'Apply historical insights to future-facing design solutions',
      estimatedTime: '10-15 minutes',
      outputs: ['Trend analysis', 'Future scenarios', 'Innovation opportunities']
    }
  },

  DS_06: { // The Investigator - Design Methods I
    primaryResearch: {
      id: 'primaryResearch',
      name: 'Primary Research Design',
      description: 'Design and conduct primary design research methods',
      estimatedTime: '12-18 minutes',
      outputs: ['Research protocol', 'Data collection plan', 'Analysis framework']
    },
    insightSynthesis: {
      id: 'insightSynthesis',
      name: 'Research Insight Synthesis',
      description: 'Analyze research data and synthesize actionable insights',
      estimatedTime: '10-15 minutes',
      outputs: ['Key insights', 'Design implications', 'Opportunity areas']
    }
  },

  DS_09: { // The Innovator - Design Strategy
    strategicRoadmap: {
      id: 'strategicRoadmap',
      name: 'Strategic Innovation Roadmap',
      description: 'Create strategic roadmaps for design innovation',
      estimatedTime: '15-20 minutes',
      outputs: ['Innovation roadmap', 'Strategic milestones', 'Technology forecast']
    },
    stakeholderMapping: {
      id: 'stakeholderMapping',
      name: 'Stakeholder Ecosystem Analysis',
      description: 'Map stakeholder relationships and value propositions',
      estimatedTime: '10-15 minutes',
      outputs: ['Stakeholder map', 'Value propositions', 'Partnership opportunities']
    }
  },

  DS_10: { // The Brand Builder - Brand Design
    brandStrategy: {
      id: 'brandStrategy',
      name: 'Brand Strategy Development',
      description: 'Develop comprehensive brand positioning and identity',
      estimatedTime: '12-18 minutes',
      outputs: ['Brand positioning', 'Visual identity system', 'Brand guidelines']
    },
    audienceAnalysis: {
      id: 'audienceAnalysis',
      name: 'Target Audience Analysis',
      description: 'Research and analyze target audience insights',
      estimatedTime: '8-12 minutes',
      outputs: ['Audience personas', 'Behavioral insights', 'Communication strategy']
    }
  },

  DS_12: { // The Visualizer - Infographics
    dataVisualization: {
      id: 'dataVisualization',
      name: 'Data Visualization Strategy',
      description: 'Design effective data visualization and infographic concepts',
      estimatedTime: '10-15 minutes',
      outputs: ['Visualization concepts', 'Data hierarchy', 'Chart recommendations']
    },
    informationArchitecture: {
      id: 'informationArchitecture',
      name: 'Information Architecture',
      description: 'Structure complex information for visual communication',
      estimatedTime: '8-12 minutes',
      outputs: ['Information structure', 'Visual flow', 'Cognitive load optimization']
    }
  },

  DS_13: { // The Maker - Physical Interfaces I
    hardwarePrototyping: {
      id: 'hardwarePrototyping',
      name: 'Hardware Prototyping Strategy',
      description: 'Design physical computing and hardware interaction concepts',
      estimatedTime: '12-18 minutes',
      outputs: ['Hardware concepts', 'Component selection', 'Interaction design']
    },
    circuitDesign: {
      id: 'circuitDesign',
      name: 'Circuit Design Planning',
      description: 'Plan electronic circuits and microcontroller integration',
      estimatedTime: '10-15 minutes',
      outputs: ['Circuit diagrams', 'Component specifications', 'Assembly guide']
    }
  },

  DS_17: { // The Futurist - Extended Realities
    xrExperience: {
      id: 'xrExperience',
      name: 'XR Experience Design',
      description: 'Design immersive VR/AR/MR experiences and interactions',
      estimatedTime: '15-20 minutes',
      outputs: ['XR concepts', 'Interaction paradigms', 'User journey maps']
    },
    spatialDesign: {
      id: 'spatialDesign',
      name: 'Spatial Design Planning',
      description: 'Design 3D spatial environments and navigation systems',
      estimatedTime: '12-18 minutes',
      outputs: ['Spatial layouts', 'Navigation design', '3D interaction concepts']
    }
  },

  DS_19: { // The Adapter - Responsive Design
    responsiveStrategy: {
      id: 'responsiveStrategy',
      name: 'Responsive Design Strategy',
      description: 'Create multi-device responsive design systems',
      estimatedTime: '10-15 minutes',
      outputs: ['Responsive framework', 'Breakpoint strategy', 'Adaptive components']
    },
    deviceOptimization: {
      id: 'deviceOptimization',
      name: 'Cross-Device Optimization',
      description: 'Optimize experiences across different devices and contexts',
      estimatedTime: '8-12 minutes',
      outputs: ['Device considerations', 'Performance optimization', 'Usage context analysis']
    }
  },

  DS_20: { // The Orchestrator - Service Design
    serviceBlueprint: {
      id: 'serviceBlueprint',
      name: 'Service Blueprint Creation',
      description: 'Design comprehensive service experiences and touchpoints',
      estimatedTime: '15-20 minutes',
      outputs: ['Service blueprint', 'Touchpoint map', 'Journey optimization']
    },
    ecosystemMapping: {
      id: 'ecosystemMapping',
      name: 'Service Ecosystem Mapping',
      description: 'Map service ecosystems and stakeholder relationships',
      estimatedTime: '12-18 minutes',
      outputs: ['Ecosystem map', 'Stakeholder analysis', 'Service integration plan']
    }
  },

  DS_23: { // The Interface Designer - Visual Interface Design
    uiSystem: {
      id: 'uiSystem',
      name: 'UI Design System',
      description: 'Create comprehensive user interface design systems',
      estimatedTime: '12-18 minutes',
      outputs: ['Design system', 'Component library', 'Interaction patterns']
    },
    usabilityOptimization: {
      id: 'usabilityOptimization',
      name: 'Usability Optimization',
      description: 'Optimize interface usability through testing and iteration',
      estimatedTime: '10-15 minutes',
      outputs: ['Usability analysis', 'Optimization recommendations', 'Testing plan']
    }
  },

  DS_24: { // The Experience Crafter - Experience Design Project
    experienceJourney: {
      id: 'experienceJourney',
      name: 'Experience Journey Design',
      description: 'Design end-to-end user experience journeys',
      estimatedTime: '15-20 minutes',
      outputs: ['Journey maps', 'Experience touchpoints', 'Emotion mapping']
    },
    prototypeStrategy: {
      id: 'prototypeStrategy',
      name: 'Prototype Strategy',
      description: 'Plan iterative prototyping and user testing approach',
      estimatedTime: '10-15 minutes',
      outputs: ['Prototype roadmap', 'Testing methodology', 'Iteration plan']
    }
  },

  DS_25: { // The Researcher - Design Methods II
    advancedResearch: {
      id: 'advancedResearch',
      name: 'Advanced Research Methods',
      description: 'Apply sophisticated design research methodologies',
      estimatedTime: '15-20 minutes',
      outputs: ['Research methodology', 'Ethnographic plan', 'Co-design framework']
    },
    researchSynthesis: {
      id: 'researchSynthesis',
      name: 'Research Insight Generation',
      description: 'Synthesize complex research into actionable design insights',
      estimatedTime: '12-18 minutes',
      outputs: ['Research synthesis', 'Design opportunities', 'Innovation insights']
    }
  },

  DS_26: { // The Animator - Animation
    animationConcepts: {
      id: 'animationConcepts',
      name: 'Animation Concept Development',
      description: 'Develop animation concepts and storytelling through motion',
      estimatedTime: '12-18 minutes',
      outputs: ['Animation concepts', 'Storyboard', 'Motion principles']
    },
    motionSystem: {
      id: 'motionSystem',
      name: 'Motion Design System',
      description: 'Create systematic approach to motion and timing',
      estimatedTime: '10-15 minutes',
      outputs: ['Motion guidelines', 'Timing systems', 'Transition library']
    }
  },

  DS_27: { // The Storyteller - Storytelling through Video
    narrativeStructure: {
      id: 'narrativeStructure',
      name: 'Video Narrative Development',
      description: 'Develop compelling video narratives and storytelling structures',
      estimatedTime: '12-18 minutes',
      outputs: ['Story structure', 'Script outline', 'Visual narrative']
    },
    productionPlanning: {
      id: 'productionPlanning',
      name: 'Video Production Planning',
      description: 'Plan comprehensive video production workflow',
      estimatedTime: '10-15 minutes',
      outputs: ['Production schedule', 'Technical requirements', 'Creative brief']
    }
  },

  DS_28: { // The Inventor - Physical Interfaces II
    advancedPrototyping: {
      id: 'advancedPrototyping',
      name: 'Advanced Physical Prototyping',
      description: 'Design complex physical computing systems and interactions',
      estimatedTime: '15-20 minutes',
      outputs: ['Advanced prototypes', 'System integration', 'Technical specifications']
    },
    hardwareIteration: {
      id: 'hardwareIteration',
      name: 'Hardware Iteration Strategy',
      description: 'Plan iterative hardware development and testing cycles',
      estimatedTime: '12-18 minutes',
      outputs: ['Iteration plan', 'Testing protocol', 'Improvement roadmap']
    }
  },

  DS_29: { // The Artist - Artistic/Conceptual Project
    conceptualFramework: {
      id: 'conceptualFramework',
      name: 'Conceptual Art Framework',
      description: 'Develop artistic concepts and experimental approaches',
      estimatedTime: '15-20 minutes',
      outputs: ['Conceptual framework', 'Artistic direction', 'Experimental methods']
    },
    unconventionalMedia: {
      id: 'unconventionalMedia',
      name: 'Unconventional Media Exploration',
      description: 'Explore experimental media and technologies for artistic expression',
      estimatedTime: '12-18 minutes',
      outputs: ['Media exploration', 'Technical experiments', 'Artistic concepts']
    }
  },

  DS_30: { // The Augur - AI in Design
    aiDesignIntegration: {
      id: 'aiDesignIntegration',
      name: 'AI-Augmented Design Process',
      description: 'Integrate AI/ML tools and techniques into design workflows',
      estimatedTime: '15-20 minutes',
      outputs: ['AI integration plan', 'Tool recommendations', 'Workflow optimization']
    },
    generativeDesign: {
      id: 'generativeDesign',
      name: 'Generative Design Systems',
      description: 'Apply machine learning models to generative design problems',
      estimatedTime: '12-18 minutes',
      outputs: ['ML model concepts', 'Generative systems', 'AI design applications']
    }
  },

  // Software Engineering Modules (SE)
  SE_01: { // The Coder - Software Development Basics
    codeStructure: {
      id: 'codeStructure',
      name: 'Code Structure Planning',
      description: 'Design clean, maintainable code structure and organization',
      estimatedTime: '10-15 minutes',
      outputs: ['Code architecture', 'Function design', 'Best practices']
    },
    algorithmDesign: {
      id: 'algorithmDesign',
      name: 'Algorithm Design',
      description: 'Design algorithms and problem-solving approaches',
      estimatedTime: '12-18 minutes',
      outputs: ['Algorithm concepts', 'Pseudocode', 'Implementation strategy']
    }
  },

  SE_02: { // The Optimizer - Algorithms and Data Structures
    performanceAnalysis: {
      id: 'performanceAnalysis',
      name: 'Performance Optimization',
      description: 'Analyze and optimize algorithm performance and complexity',
      estimatedTime: '12-18 minutes',
      outputs: ['Performance analysis', 'Optimization strategies', 'Complexity assessment']
    },
    dataStructureSelection: {
      id: 'dataStructureSelection',
      name: 'Data Structure Selection',
      description: 'Choose optimal data structures for specific use cases',
      estimatedTime: '8-12 minutes',
      outputs: ['Data structure recommendations', 'Trade-off analysis', 'Implementation guide']
    }
  },

  SE_19: { // Web Technologies Basics
    webArchitecture: {
      id: 'webArchitecture',
      name: 'Web Architecture Planning',
      description: 'Design fundamental web application architecture',
      estimatedTime: '10-15 minutes',
      outputs: ['Web architecture', 'Technology stack', 'Implementation plan']
    },
    clientServerDesign: {
      id: 'clientServerDesign',
      name: 'Client-Server Design',
      description: 'Plan client-server interactions and data flow',
      estimatedTime: '8-12 minutes',
      outputs: ['API design', 'Data flow', 'Communication protocols']
    }
  },

  SE_41: { // Digital Fabrication
    fabricationWorkflow: {
      id: 'fabricationWorkflow',
      name: 'Digital Fabrication Workflow',
      description: 'Design digital-to-physical fabrication processes',
      estimatedTime: '12-18 minutes',
      outputs: ['Fabrication workflow', 'Material selection', 'Tool planning']
    },
    prototypingStrategy: {
      id: 'prototypingStrategy',
      name: 'Rapid Prototyping Strategy',
      description: 'Plan iterative physical prototyping approaches',
      estimatedTime: '10-15 minutes',
      outputs: ['Prototyping plan', 'Iteration strategy', 'Testing methodology']
    }
  },

  SE_45: { // Frontend Technologies
    frontendArchitecture: {
      id: 'frontendArchitecture',
      name: 'Frontend Architecture Design',
      description: 'Design scalable frontend application architecture',
      estimatedTime: '12-18 minutes',
      outputs: ['Frontend architecture', 'Component design', 'State management']
    },
    performanceOptimization: {
      id: 'performanceOptimization',
      name: 'Frontend Performance Optimization',
      description: 'Optimize frontend performance and user experience',
      estimatedTime: '10-15 minutes',
      outputs: ['Performance strategy', 'Optimization techniques', 'Monitoring plan']
    }
  },

  SE_46: { // Backend Technologies
    apiDesign: {
      id: 'apiDesign',
      name: 'API Architecture Design',
      description: 'Design RESTful APIs and backend service architecture',
      estimatedTime: '12-18 minutes',
      outputs: ['API specification', 'Service architecture', 'Data models']
    },
    scalabilityPlanning: {
      id: 'scalabilityPlanning',
      name: 'Scalability & Deployment Planning',
      description: 'Plan scalable backend infrastructure and deployment strategies',
      estimatedTime: '15-20 minutes',
      outputs: ['Scalability plan', 'Deployment strategy', 'Infrastructure design']
    }
  }
};

/**
 * Get available tasks for a specific module
 * @param {string} moduleCode - The module code (e.g., 'DS_02')
 * @returns {Object} Combined common and specialized tasks
 */
export function getTasksForModule(moduleCode) {
  const specialized = specializedTasks[moduleCode] || {};
  return {
    common: commonTasks,
    specialized: specialized
  };
}

/**
 * Get all available task IDs for a module
 * @param {string} moduleCode - The module code
 * @returns {Array} Array of task IDs
 */
export function getTaskIdsForModule(moduleCode) {
  const tasks = getTasksForModule(moduleCode);
  const commonIds = Object.keys(tasks.common);
  const specializedIds = Object.keys(tasks.specialized);
  return [...commonIds, ...specializedIds];
}

/**
 * Get a specific task by ID and module
 * @param {string} moduleCode - The module code
 * @param {string} taskId - The task ID
 * @returns {Object|null} Task object or null if not found
 */
export function getTask(moduleCode, taskId) {
  const tasks = getTasksForModule(moduleCode);
  return tasks.common[taskId] || tasks.specialized[taskId] || null;
}