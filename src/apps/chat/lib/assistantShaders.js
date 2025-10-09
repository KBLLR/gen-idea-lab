/**
 * Unique animated shader configurations for each assistant avatar
 * Each shader is thematically related to the assistant's module topic and role
 */

export const assistantShaders = {
  // Overall Strategy (OS) - Blue/Cyan tones
  OS_01: {
    // The Architect - Blueprint grid pattern
    name: 'blueprint-grid',
    colors: ['#0099ff', '#00ccff', '#0066cc'],
    gradient: 'linear-gradient(45deg, #0099ff20, #00ccff20)',
    animation: 'blueprint-grid 8s linear infinite',
  },
  OS_02: {
    // The Visionary - Aurora waves
    name: 'aurora-waves',
    colors: ['#667eea', '#764ba2', '#f093fb'],
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    animation: 'aurora-flow 6s ease-in-out infinite',
  },
  OS_03: {
    // The Strategist - Chess board tactical
    name: 'chess-tactical',
    colors: ['#4a9eff', '#2d5f9e', '#ffffff'],
    gradient: 'linear-gradient(45deg, #4a9eff 25%, transparent 25%)',
    animation: 'chess-shift 10s linear infinite',
  },
  OS_05: {
    // The Collaborator - Network nodes
    name: 'network-nodes',
    colors: ['#00d4ff', '#0099cc', '#66ffff'],
    gradient: 'radial-gradient(circle at 30% 50%, #00d4ff40, transparent 50%)',
    animation: 'node-pulse 4s ease-in-out infinite',
  },

  // Societal/Theoretical Studies (STS) - Orange/Red tones
  STS_01: {
    // The Ethicist - Balanced energy
    name: 'balance-energy',
    colors: ['#ff6b6b', '#ff8e53', '#ffbb33'],
    gradient: 'linear-gradient(135deg, #ff6b6b50, #ffbb3350)',
    animation: 'balance-sway 5s ease-in-out infinite',
  },
  STS_02: {
    // The Reader - Page turning
    name: 'page-turn',
    colors: ['#f39c12', '#e67e22', '#d35400'],
    gradient: 'linear-gradient(90deg, #f39c1230, transparent 50%, #e67e2230)',
    animation: 'page-flip 7s linear infinite',
  },
  STS_03: {
    // The Inquirer - Question bubbles
    name: 'question-bubbles',
    colors: ['#e74c3c', '#c0392b', '#ff7979'],
    gradient: 'radial-gradient(circle at 60% 40%, #e74c3c40, transparent)',
    animation: 'bubble-rise 6s ease-in-out infinite',
  },
  STS_04: {
    // The Orator - Sound waves
    name: 'sound-waves',
    colors: ['#ff6348', '#ff4757', '#ff6b81'],
    gradient: 'repeating-linear-gradient(90deg, #ff634840, #ff634840 10px, transparent 10px, transparent 20px)',
    animation: 'wave-ripple 3s linear infinite',
  },
  STS_05: {
    // The Judge - Justice scales
    name: 'justice-scales',
    colors: ['#d63031', '#e17055', '#fdcb6e'],
    gradient: 'linear-gradient(180deg, #d6303140, #e1705540)',
    animation: 'scale-balance 6s ease-in-out infinite',
  },
  STS_06: {
    // The Steward - Nature growth
    name: 'nature-growth',
    colors: ['#00b894', '#55efc4', '#81ecec'],
    gradient: 'radial-gradient(ellipse at 50% 80%, #00b89440, transparent)',
    animation: 'growth-pulse 8s ease-in-out infinite',
  },
  STS_07: {
    // The Learner - Knowledge expansion
    name: 'knowledge-expand',
    colors: ['#fab1a0', '#ff7675', '#fd79a8'],
    gradient: 'conic-gradient(from 45deg, #fab1a040, #ff767540, #fd79a840)',
    animation: 'knowledge-rotate 12s linear infinite',
  },

  // Design Studies (DS) - Purple/Pink tones
  DS_01: {
    // The Composer - Musical waveforms
    name: 'musical-waves',
    colors: ['#a29bfe', '#6c5ce7', '#fd79a8'],
    gradient: 'repeating-linear-gradient(0deg, #a29bfe40, #a29bfe40 5px, transparent 5px, transparent 10px)',
    animation: 'wave-oscillate 4s ease-in-out infinite',
  },
  DS_02: {
    // The Automaton - Mechanical gears
    name: 'mech-gears',
    colors: ['#b2bec3', '#74b9ff', '#a29bfe'],
    gradient: 'conic-gradient(from 0deg at 50% 50%, #b2bec340, #74b9ff40, #a29bfe40)',
    animation: 'gear-rotate 8s linear infinite',
  },
  DS_03: {
    // The Editor - Edit marks
    name: 'edit-marks',
    colors: ['#fd79a8', '#fdcb6e', '#e17055'],
    gradient: 'linear-gradient(45deg, #fd79a840 25%, transparent 25%, transparent 75%, #fdcb6e40 75%)',
    animation: 'mark-blink 5s steps(4) infinite',
  },
  DS_05: {
    // The Historian - Timeline scroll
    name: 'timeline-scroll',
    colors: ['#6c5ce7', '#a29bfe', '#dfe6e9'],
    gradient: 'linear-gradient(180deg, #6c5ce740, transparent 50%, #a29bfe40)',
    animation: 'scroll-timeline 10s linear infinite',
  },
  DS_06: {
    // The Investigator - Evidence grid
    name: 'evidence-grid',
    colors: ['#00cec9', '#0984e3', '#6c5ce7'],
    gradient: 'repeating-linear-gradient(90deg, #00cec930 0px, transparent 1px, transparent 15px), repeating-linear-gradient(0deg, #0984e330 0px, transparent 1px, transparent 15px)',
    animation: 'grid-scan 6s linear infinite',
  },
  DS_09: {
    // The Innovator - Innovation spark
    name: 'innovation-spark',
    colors: ['#fdcb6e', '#ffeaa7', '#fab1a0'],
    gradient: 'radial-gradient(circle at 50% 50%, #fdcb6e60, transparent 70%)',
    animation: 'spark-burst 3s ease-in-out infinite',
  },
  DS_10: {
    // The Brand Builder - Brand elements
    name: 'brand-elements',
    colors: ['#ff7675', '#fd79a8', '#fdcb6e'],
    gradient: 'linear-gradient(135deg, #ff767540, #fd79a840, #fdcb6e40)',
    animation: 'brand-shift 7s ease-in-out infinite',
  },
  DS_12: {
    // The Visualizer - Data streams
    name: 'data-streams',
    colors: ['#74b9ff', '#a29bfe', '#fd79a8'],
    gradient: 'linear-gradient(90deg, #74b9ff40, transparent 50%, #a29bfe40)',
    animation: 'stream-flow 5s linear infinite',
  },
  DS_13: {
    // The Maker - Tool outlines
    name: 'tool-outlines',
    colors: ['#636e72', '#b2bec3', '#74b9ff'],
    gradient: 'repeating-conic-gradient(from 45deg, #636e7230, #b2bec330 90deg)',
    animation: 'tool-spin 12s linear infinite',
  },
  DS_17: {
    // The Futurist - Holographic grid
    name: 'holo-grid',
    colors: ['#00cec9', '#00b894', '#74b9ff'],
    gradient: 'linear-gradient(45deg, #00cec940 25%, transparent 25%, transparent 75%, #74b9ff40 75%)',
    animation: 'holo-glitch 4s steps(8) infinite',
  },
  DS_19: {
    // The Adapter - Device morph
    name: 'device-morph',
    colors: ['#a29bfe', '#6c5ce7', '#00b894'],
    gradient: 'radial-gradient(ellipse at 30% 30%, #a29bfe40, transparent 60%)',
    animation: 'morph-shift 6s ease-in-out infinite',
  },
  DS_20: {
    // The Orchestrator - Network hub
    name: 'network-hub',
    colors: ['#4a9eff', '#a29bfe', '#fd79a8'],
    gradient: 'radial-gradient(circle at 50% 50%, #4a9eff40, transparent 50%), radial-gradient(circle at 20% 80%, #a29bfe30, transparent 40%)',
    animation: 'hub-pulse 5s ease-in-out infinite',
  },
  DS_23: {
    // The Interface Designer - UI elements
    name: 'ui-elements',
    colors: ['#74b9ff', '#a29bfe', '#dfe6e9'],
    gradient: 'linear-gradient(135deg, #74b9ff30 10%, transparent 10%, transparent 50%, #a29bfe30 50%)',
    animation: 'ui-float 8s ease-in-out infinite',
  },
  DS_24: {
    // The Experience Crafter - Journey path
    name: 'journey-path',
    colors: ['#fd79a8', '#fdcb6e', '#a29bfe'],
    gradient: 'linear-gradient(90deg, #fd79a840 0%, transparent 50%, #a29bfe40 100%)',
    animation: 'path-traverse 10s linear infinite',
  },
  DS_25: {
    // The Researcher - Lab experiments
    name: 'lab-experiment',
    colors: ['#00b894', '#00cec9', '#74b9ff'],
    gradient: 'radial-gradient(circle at 40% 60%, #00b89440, transparent 50%)',
    animation: 'experiment-bubble 4s ease-in-out infinite',
  },
  DS_26: {
    // The Animator - Motion blur
    name: 'motion-blur',
    colors: ['#ff7675', '#fd79a8', '#a29bfe'],
    gradient: 'linear-gradient(90deg, #ff767560, transparent 30%, #fd79a860 70%)',
    animation: 'motion-streak 3s linear infinite',
  },
  DS_27: {
    // The Storyteller - Film strips
    name: 'film-strip',
    colors: ['#2d3436', '#636e72', '#fdcb6e'],
    gradient: 'repeating-linear-gradient(90deg, #2d343640 0px, transparent 5px, transparent 30px, #636e7240 30px, transparent 35px)',
    animation: 'film-roll 8s linear infinite',
  },
  DS_28: {
    // The Inventor - Circuit board
    name: 'circuit-board',
    colors: ['#00b894', '#00cec9', '#fdcb6e'],
    gradient: 'repeating-linear-gradient(90deg, #00b89430 0px, transparent 2px, transparent 20px), repeating-linear-gradient(0deg, #00cec930 0px, transparent 2px, transparent 20px)',
    animation: 'circuit-pulse 5s ease-in-out infinite',
  },
  DS_29: {
    // The Artist - Paint strokes
    name: 'paint-strokes',
    colors: ['#fd79a8', '#a29bfe', '#fdcb6e'],
    gradient: 'linear-gradient(135deg, #fd79a850, #a29bfe50, #fdcb6e50)',
    animation: 'brush-stroke 6s ease-in-out infinite',
  },
  DS_30: {
    // The Augur - Neural network
    name: 'neural-network',
    colors: ['#a29bfe', '#6c5ce7', '#00cec9'],
    gradient: 'radial-gradient(circle at 50% 50%, #a29bfe40, transparent 40%), radial-gradient(circle at 20% 20%, #6c5ce740, transparent 30%)',
    animation: 'neural-fire 4s ease-in-out infinite',
  },

  // Software Engineering (SE) - Blue/Cyan tones
  SE_01: {
    // The Coder - Matrix code rain
    name: 'matrix-rain',
    colors: ['#00ff00', '#00cc00', '#009900'],
    gradient: 'linear-gradient(180deg, #00ff0040, transparent 70%)',
    animation: 'code-rain 3s linear infinite',
  },
  SE_02: {
    // The Optimizer - Speed lines
    name: 'speed-lines',
    colors: ['#0984e3', '#74b9ff', '#00cec9'],
    gradient: 'repeating-linear-gradient(45deg, #0984e360 0px, transparent 2px, transparent 10px)',
    animation: 'speed-boost 2s linear infinite',
  },
  SE_19: {
    // The Web Weaver - Web pattern
    name: 'web-pattern',
    colors: ['#00b894', '#00cec9', '#74b9ff'],
    gradient: 'radial-gradient(circle at 50% 50%, transparent 30%, #00b89420 31%, #00b89420 32%, transparent 33%), radial-gradient(circle at 25% 25%, transparent 20%, #00cec920 21%)',
    animation: 'web-spin 10s linear infinite',
  },
  SE_41: {
    // The Fabricator - 3D print layers
    name: 'print-layers',
    colors: ['#636e72', '#b2bec3', '#74b9ff'],
    gradient: 'repeating-linear-gradient(0deg, #636e7240 0px, transparent 3px, transparent 8px)',
    animation: 'layer-build 6s linear infinite',
  },
  SE_45: {
    // The Frontend Dev - HTML/CSS
    name: 'html-css',
    colors: ['#e17055', '#74b9ff', '#fdcb6e'],
    gradient: 'linear-gradient(90deg, #e1705540 33%, #74b9ff40 33% 66%, #fdcb6e40 66%)',
    animation: 'tag-blink 4s steps(6) infinite',
  },
  SE_46: {
    // The Backend Dev - Server racks
    name: 'server-racks',
    colors: ['#2d3436', '#636e72', '#00b894'],
    gradient: 'repeating-linear-gradient(180deg, #2d343660 0px, #636e7260 5px, transparent 5px, transparent 15px)',
    animation: 'server-hum 5s ease-in-out infinite',
  },

  // Business Analytics (BA) - Gold/Yellow tones
  BA_01: {
    // The Synthesizer - Data merging
    name: 'data-merge',
    colors: ['#fdcb6e', '#ffeaa7', '#fab1a0'],
    gradient: 'linear-gradient(90deg, #fdcb6e40, transparent 50%, #fab1a040)',
    animation: 'data-converge 6s ease-in-out infinite',
  },
  BA_02: {
    // The Scholar - Ancient wisdom
    name: 'ancient-wisdom',
    colors: ['#f39c12', '#e67e22', '#d35400'],
    gradient: 'radial-gradient(ellipse at 50% 50%, #f39c1240, transparent 70%)',
    animation: 'wisdom-glow 8s ease-in-out infinite',
  },

  // Orchestrator - Multi-color hub
  orchestrator: {
    name: 'orchestrator-hub',
    colors: ['#4a9eff', '#a29bfe', '#fd79a8', '#00b894'],
    gradient: 'conic-gradient(from 0deg, #4a9eff40, #a29bfe40, #fd79a840, #00b89440, #4a9eff40)',
    animation: 'hub-rotate 10s linear infinite',
  },
};

/**
 * Get the shader configuration for a specific assistant
 */
export function getAssistantShader(assistantId) {
  return assistantShaders[assistantId] || assistantShaders.orchestrator;
}

/**
 * Generate the CSS keyframe animations dynamically
 * This should be injected into a style tag on component mount
 */
export function generateShaderKeyframes() {
  return `
    @keyframes blueprint-grid {
      0%, 100% { background-position: 0 0; }
      50% { background-position: 20px 20px; }
    }

    @keyframes aurora-flow {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    @keyframes chess-shift {
      0% { background-position: 0 0; }
      100% { background-position: 50px 50px; }
    }

    @keyframes node-pulse {
      0%, 100% { background-position: 30% 50%; }
      50% { background-position: 70% 50%; }
    }

    @keyframes balance-sway {
      0%, 100% { transform: rotate(-2deg); }
      50% { transform: rotate(2deg); }
    }

    @keyframes page-flip {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 0%; }
    }

    @keyframes bubble-rise {
      0% { background-position: 60% 100%; }
      100% { background-position: 60% 0%; }
    }

    @keyframes wave-ripple {
      0% { background-position: 0 0; }
      100% { background-position: 40px 0; }
    }

    @keyframes scale-balance {
      0%, 100% { background-position: 0% 0%; }
      50% { background-position: 100% 100%; }
    }

    @keyframes growth-pulse {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    @keyframes knowledge-rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes wave-oscillate {
      0%, 100% { background-position: 0 0; }
      50% { background-position: 0 20px; }
    }

    @keyframes gear-rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes mark-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes scroll-timeline {
      0% { background-position: 0% 0%; }
      100% { background-position: 0% 100%; }
    }

    @keyframes grid-scan {
      0% { background-position: 0 0; }
      100% { background-position: 15px 15px; }
    }

    @keyframes spark-burst {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.3); opacity: 1; }
    }

    @keyframes brand-shift {
      0%, 100% { background-position: 0% 0%; }
      50% { background-position: 100% 100%; }
    }

    @keyframes stream-flow {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 0%; }
    }

    @keyframes tool-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes holo-glitch {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px); }
      75% { transform: translateX(2px); }
    }

    @keyframes morph-shift {
      0%, 100% { background-position: 30% 30%; }
      50% { background-position: 70% 70%; }
    }

    @keyframes hub-pulse {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }

    @keyframes ui-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    @keyframes path-traverse {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 0%; }
    }

    @keyframes experiment-bubble {
      0%, 100% { background-position: 40% 60%; }
      50% { background-position: 60% 40%; }
    }

    @keyframes motion-streak {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 0%; }
    }

    @keyframes film-roll {
      0% { background-position: 0 0; }
      100% { background-position: 70px 0; }
    }

    @keyframes circuit-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.8; }
    }

    @keyframes brush-stroke {
      0%, 100% { background-position: 0% 0%; }
      50% { background-position: 100% 100%; }
    }

    @keyframes neural-fire {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    @keyframes code-rain {
      0% { background-position: 0% 0%; }
      100% { background-position: 0% 100%; }
    }

    @keyframes speed-boost {
      0% { background-position: 0 0; }
      100% { background-position: 20px 20px; }
    }

    @keyframes web-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes layer-build {
      0% { background-position: 0 0; }
      100% { background-position: 0 50px; }
    }

    @keyframes tag-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    @keyframes server-hum {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 0.8; }
    }

    @keyframes data-converge {
      0%, 100% { background-position: 0% 0%; }
      50% { background-position: 100% 0%; }
    }

    @keyframes wisdom-glow {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 0.9; transform: scale(1.1); }
    }

    @keyframes hub-rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
}
