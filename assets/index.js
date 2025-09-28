// index.tsx
import { createRoot } from "react-dom/client";

// src/components/App.jsx
import c3 from "clsx";

// src/lib/store.js
import "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { createSelectorFunctions } from "auto-zustand-selectors-hook";

// src/lib/modules.js
var rawModules = [
  {
    "Module Code": "OS_01",
    "Module Title": "Introduction to Software Engineering",
    "Semester": "Orientation",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "None",
    "Grading Type": "Pass/Fail",
    "Teaching Format": "Course",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Dr. Frank Trollmann",
    "Qualification Objectives": [
      "Understand the field of software engineering",
      "Apply domains of software engineering",
      "Write basic programs",
      "Understand basic software development processes",
      "Evaluate and select learning resources and methods for learning programming"
    ],
    "Key Contents / Topics": "Understanding what software is, how it is used, and how to engage with software as a creator (not just as a user); overview of software engineering best practices and development processes; selecting personal learning paths and resources in programming",
    "Learning Resources URL": "https://app.code.berlin/module/OS_01?table=learningResources"
  },
  {
    "Module Code": "OS_02",
    "Module Title": "Introduction to Design",
    "Semester": "Orientation",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "None",
    "Grading Type": "Pass/Fail",
    "Teaching Format": "Course and project work",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Malith Prasanna Gunasekera",
    "Qualification Objectives": [
      "Investigate a topic using introductory research methods",
      "Develop creative, context-appropriate responses",
      "Select and iterate an appropriate creative response",
      "Reflect on individual learning within the module"
    ],
    "Key Contents / Topics": "Basic understanding of Design in analog and digital contexts; exposure to introductory design methods, tools, and theories; exploration of design briefs/challenges in groups or individually; project-focused work with reflective activities",
    "Learning Resources URL": "https://app.code.berlin/module/OS_02?table=learningResources"
  },
  {
    "Module Code": "OS_03",
    "Module Title": "Introduction to Business Management & Entrepreneurship",
    "Semester": "Orientation",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "None",
    "Grading Type": "Pass/Fail",
    "Teaching Format": "Course and project work",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Prof. Dr. Swantje Quoos",
    "Qualification Objectives": [
      "Understand basics of business management and entrepreneurship",
      "Understand basics of the product definition process",
      "Apply domains of business, product & innovation management and entrepreneurship",
      "Understand basic professional and team competencies for problem-solving with self-awareness, empathy, growth mindset"
    ],
    "Key Contents / Topics": "Overview of product-centric perspectives and methods in business and entrepreneurship; key elements of product discovery, market analysis, and product strategy; introduction to principles of agile product development; roles of business, product, and innovation managers in organizations",
    "Learning Resources URL": "https://app.code.berlin/module/OS_03?table=learningResources"
  },
  {
    "Module Code": "OS_05",
    "Module Title": "Application of Project-Based Learning Methods",
    "Semester": "Orientation",
    "ECTS Credits": "9 ECTS",
    "Contact Time (hours)": "60 hrs.",
    "Self-Study Time (hours)": "210 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "None",
    "Grading Type": "Pass/Fail",
    "Teaching Format": "Course and project work",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Malith Prasanna Gunasekera",
    "Qualification Objectives": [
      "Understand and utilize project-based learning methods and tools",
      "Develop and iterate a collaborative student project",
      "Create tangible, contextually appropriate artifacts",
      "Reflect on learning in a project-based environment"
    ],
    "Key Contents / Topics": "Introduction to project-based learning (PBL) principles, methods, and tools; practical project integrating outcomes of OS_01/02/03; students produce a body of work (experiments, documentation, reflections); prepares students for transition into core semesters",
    "Learning Resources URL": "https://app.code.berlin/module/OS_05?table=learningResources"
  },
  {
    "Module Code": "STS_01",
    "Module Title": "STS Essentials",
    "Semester": "Orientation",
    "ECTS Credits": "6 ECTS",
    "Contact Time (hours)": "45 hrs.",
    "Self-Study Time (hours)": "135 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "None",
    "Grading Type": "Graded",
    "Teaching Format": "Course",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Prof. Dr. Fabian Geier",
    "Qualification Objectives": [
      "Develop academic reading and writing skills in a technosocial context",
      "Gain historical, ethical, and philosophical perspectives on technology",
      "Engage in critical analytical thinking about technology and society"
    ],
    "Key Contents / Topics": "Foundational concepts in science, technology & society (STS); history of thought and philosophy of technology; ethics and technosocietal issues; critical analysis of truth, reality, and the social impacts of technology",
    "Learning Resources URL": "https://app.code.berlin/module/STS_01?table=learningResources"
  },
  {
    "Module Code": "DS_01",
    "Module Title": "Composition",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Course and seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Prof. Dr. Martin Knobel",
    "Qualification Objectives": [
      "Understand gestalt principles and interpret images accordingly",
      "Create diverse assets using techniques adhering to gestalt principles",
      "Demonstrate understanding of image composition through experimental techniques"
    ],
    "Key Contents / Topics": "Use of color, contrast, shape, and proportion per gestalt principles; fundamentals of photography (composition, lighting, exposure); using photography and visual media as expressive, experimental tools",
    "Learning Resources URL": "https://app.code.berlin/module/ID_01?table=learningResources"
  },
  {
    "Module Code": "DS_02",
    "Module Title": "Generative Design",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Course and seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Prof. Dr. Daniel Buzzo",
    "Qualification Objectives": [
      "Understand Generative Design techniques (e.g. creating sketches, using different renderers)",
      "Understand relevant functions and libraries (video, sound, PDF export, serial, etc.)"
    ],
    "Key Contents / Topics": "Exploration of design as an iterative coding process; code as a form of personal expression through experimentation; building awareness of how computer-generated output is created",
    "Learning Resources URL": "https://app.code.berlin/module/ID_02?table=learningResources"
  },
  {
    "Module Code": "DS_03",
    "Module Title": "Editorial Design",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Course and seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Prof. Dr. Martin Knobel",
    "Qualification Objectives": [
      "Understand and apply grid systems for print media",
      "Understand how to construct a magazine and printed materials professionally",
      "Create diverse editorial assets with varied visual languages",
      "Develop flat plans and incorporate diverse formats (stickers, posters, etc.)",
      "Present editorial design work professionally"
    ],
    "Key Contents / Topics": "Fundamentals of visual communication and editorial design; typographic solutions to design challenges; critical social/cultural awareness in design; advanced layout skills and grid-based design; color theory applications",
    "Learning Resources URL": "https://app.code.berlin/module/ID_03?table=learningResources"
  },
  {
    "Module Code": "DS_05",
    "Module Title": "Design History",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Prof. Dr. Martin Knobel",
    "Qualification Objectives": [
      "Understand influential designers and key historical, theoretical, social, ethical frameworks in design",
      "Apply this knowledge to reflect on one\u2019s own work and others\u2019 work",
      "Utilize future-oriented perspectives in design, incorporating historical, social, ethical aspects and current research"
    ],
    "Key Contents / Topics": "Overview of important designers and design movements; placing one\u2019s work in historical/theoretical/social context; developing critical reflection on design practices; understanding design as a future-facing discipline",
    "Learning Resources URL": "https://app.code.berlin/module/ID_05?table=learningResources"
  },
  {
    "Module Code": "DS_06",
    "Module Title": "Design Methods I",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Pass/Fail",
    "Teaching Format": "Course and seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Malith Prasanna Gunasekera",
    "Qualification Objectives": [
      "Investigate a topic using primary design research methods",
      "Analyze collected data with contextually relevant approaches",
      "Synthesize information from multiple perspectives into insights",
      "Present work in a creative, coherent, concise manner"
    ],
    "Key Contents / Topics": "Introduction to design research through primary research methods; investigating self-defined contexts (users\u2019 motivations, behaviors, needs, etc.); producing a body of work with experiments, documentation, reflection; practical module emphasizing hands-on research and insight development",
    "Learning Resources URL": "https://app.code.berlin/module/ID_06?table=learningResources"
  },
  {
    "Module Code": "DS_09",
    "Module Title": "Design Strategy",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Course and seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Malith Prasanna Gunasekera",
    "Qualification Objectives": [
      "Identify and utilize methods for strategic project development (e.g. stakeholder mapping, future scenarios)",
      "Develop clear avenues for creative outcome development (product, service, experience, etc.) that fit the context",
      "Create project milestones/time plans accounting for broader developments (technological, social, etc.)",
      "Communicate project work in a creative, coherent, concise way"
    ],
    "Key Contents / Topics": "Intersection of Design and Product Management; role of design in product innovation and value proposition; determining what to build and why (strategic innovation); techniques for market/brand analysis, future scenario planning, technology forecasting, and strategic roadmapping",
    "Learning Resources URL": "https://app.code.berlin/module/ID_09?table=learningResources"
  },
  {
    "Module Code": "DS_10",
    "Module Title": "Brand Design",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Course and seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Dr. Lara Schibelsky Godoy Piccolo",
    "Qualification Objectives": [
      "Understand fundamentals of brand design and defining a brand\u2019s core identity",
      "Use target audience and competitor insights to develop brand positioning strategy",
      "Create a brand\u2019s visual and verbal identity (typography, logo, colors, tone) aligned with its message",
      "Critique a brand\u2019s identities by evaluating their effectiveness for the target audience"
    ],
    "Key Contents / Topics": "How a company\u2019s values, vision, mission translate into the brand\u2019s look and feel for target audiences; process for making consistent design decisions that communicate brand identity visually (e.g. logo, color palette) and verbally (tone of voice)",
    "Learning Resources URL": "https://app.code.berlin/module/ID_10?table=learningResources"
  },
  {
    "Module Code": "DS_12",
    "Module Title": "Infographics",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Course and seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Dr. Lara Schibelsky Godoy Piccolo",
    "Qualification Objectives": [
      "Create expressive, concise infographics using data visualization and design techniques",
      "Design visualizations with the viewer\u2019s perspective in mind",
      "Determine appropriate types of visualization based on data and goals"
    ],
    "Key Contents / Topics": "Transforming information into easy-to-understand visual form; communicating messages visually using color, typography, diagrams, illustrations, maps, etc.; historical evolution from early infographics to modern interactive data visualization; creating engaging visual experiences from data",
    "Learning Resources URL": "https://app.code.berlin/module/ID_12?table=learningResources"
  },
  {
    "Module Code": "DS_13",
    "Module Title": "Physical Interfaces I",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Course and seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Prof. Dr. Daniel Buzzo",
    "Qualification Objectives": [
      "Understand and apply use of microcontrollers (including coding for them)",
      "Read and create basic electronic circuit diagrams",
      "Use hardware prototyping (sensors, motors, LEDs, etc.) in diverse ways",
      "Critique microcontroller-based prototypes constructively and iterate on hardware sketches",
      "Apply affordances of physical interfaces and create prototypes with microcontrollers"
    ],
    "Key Contents / Topics": "Hands-on introduction to physical computing: basic electronics circuits with breadboards and components; working with sensors, actuators, microcontrollers (Arduino, smartphone sensors, etc.) to create novel interactions; fostering experimental and creative approaches to physical interface design",
    "Learning Resources URL": "https://app.code.berlin/module/ID_13?table=learningResources"
  },
  {
    "Module Code": "DS_17",
    "Module Title": "Extended Realities",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Course and seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Dr. Lara Schibelsky Godoy Piccolo",
    "Qualification Objectives": [
      "Understand creation of 360\xB0 media via photography and motion imagery",
      "Utilize VR/AR tools and equipment effectively",
      "Understand design techniques for virtual reality & 3D modeling",
      "Evaluate various VR technologies\u2019 applicability to different scenarios",
      "Apply design principles to create immersive VR/AR experiences (integrating multiple interface techniques, possibly sound/haptics)"
    ],
    "Key Contents / Topics": "Virtual and augmented reality fundamentals; multimodal 3D environments (visual, auditory, haptic interactions); human perception in VR (stereo vision, sound localization); overview of display and tracking technologies (HMDs, projection systems); navigation and interaction techniques in 3D spaces",
    "Learning Resources URL": "https://app.code.berlin/module/ID_17?table=learningResources"
  },
  {
    "Module Code": "DS_19",
    "Module Title": "Responsive Design",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Course and seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Prof. Dr. Daniel Buzzo",
    "Qualification Objectives": [
      "Understand theoretical, design, and technical aspects of responsive design",
      "Learn history and evolution of web design into responsive design",
      "Apply responsive techniques to ensure designs adapt across devices (content reflow, flexible layouts, etc.)"
    ],
    "Key Contents / Topics": "The concept and principles of responsive web design; historical progression of web design practices; designing across multiple devices and screen sizes; fluid grids, flexible images, media queries; ensuring usability and aesthetics on varying platforms",
    "Learning Resources URL": "https://app.code.berlin/module/ID_19?table=learningResources"
  },
  {
    "Module Code": "DS_20",
    "Module Title": "Service Design",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Course and seminar",
    "Assessment Type": "Oral/practical examination; written examination",
    "Module Coordinator": "Dr. Lara Schibelsky Godoy Piccolo",
    "Qualification Objectives": [
      "Understand emergence and impact of service design as a discipline",
      "Analyze user needs with critical thinking, using models like user journeys",
      "Design service blueprints integrating multiple touchpoints and stakeholders",
      "Implement and prototype service solutions considering user experience holistically"
    ],
    "Key Contents / Topics": "Principles of service design and its role in product/service innovation; user-centered research methods (e.g. customer journey mapping, stakeholder mapping); designing service ecosystems and processes; coordinating various service touchpoints; evaluating service effectiveness and user satisfaction",
    "Learning Resources URL": "https://app.code.berlin/module/ID_20?table=learningResources"
  },
  {
    "Module Code": "DS_23",
    "Module Title": "Visual Interface Design",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "10 ECTS",
    "Contact Time (hours)": "60 hrs.",
    "Self-Study Time (hours)": "240 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Studio course",
    "Assessment Type": "Oral/practical examination; project presentation",
    "Module Coordinator": "Prof. Dr. Martin Knobel",
    "Qualification Objectives": [
      "Create an early-stage design project in a team setting (end-to-end design process)",
      "Apply advanced UI design principles (layout, typography, color, interaction) in a complex project",
      "Iterate design solutions based on user feedback and usability testing"
    ],
    "Key Contents / Topics": "Comprehensive interface design project spanning research, ideation, prototyping, and evaluation; advanced visual design techniques for user interfaces; teamwork and collaboration in design; applying feedback loops and iterative improvements; presentation of design outcomes",
    "Learning Resources URL": "https://app.code.berlin/module/ID_23?table=learningResources"
  },
  {
    "Module Code": "DS_24",
    "Module Title": "Experience Design Project",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "10 ECTS",
    "Contact Time (hours)": "60 hrs.",
    "Self-Study Time (hours)": "240 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Project work",
    "Assessment Type": "Oral/practical examination; project documentation",
    "Module Coordinator": "Malith Prasanna Gunasekera",
    "Qualification Objectives": [
      "Frame a design exploration area and conduct primary/secondary research",
      "Generate and prototype conceptual design solutions in a team",
      "Iterate and refine a design project incorporating user feedback and testing",
      "Present a coherent narrative of the design process and outcomes"
    ],
    "Key Contents / Topics": "Capstone-like group design project addressing a complex experience design challenge; defining project scope and research questions; applying advanced design methods from discovery to delivery; prototyping interactive experiences; reflection and presentation of project learnings",
    "Learning Resources URL": "https://app.code.berlin/module/ID_24?table=learningResources"
  },
  {
    "Module Code": "DS_25",
    "Module Title": "Design Methods II",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "10 ECTS",
    "Contact Time (hours)": "60 hrs.",
    "Self-Study Time (hours)": "240 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "DS_06; OS_01\u2013OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Advanced seminar/workshop",
    "Assessment Type": "Project portfolio; oral examination",
    "Module Coordinator": "Prof. Dr. Martin Knobel",
    "Qualification Objectives": [
      "Frame a research area and investigate through primary & secondary methods",
      "Develop advanced design research skills (ethnography, co-design, etc.)",
      "Generate insights to inform innovative design solutions",
      "Reflect critically on design research process and ethical implications"
    ],
    "Key Contents / Topics": "Deepening design research competencies beyond Basics; utilizing advanced methodologies to gather user insights; handling complex social/ethical design questions; translating research findings into strategic design directions; self-directed project-based learning",
    "Learning Resources URL": "https://app.code.berlin/module/ID_25?table=learningResources"
  },
  {
    "Module Code": "DS_26",
    "Module Title": "Animation",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "10 ECTS",
    "Contact Time (hours)": "60 hrs.",
    "Self-Study Time (hours)": "240 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Studio course",
    "Assessment Type": "Project work; practical exam",
    "Module Coordinator": "Prof. Dr. Daniel Buzzo",
    "Qualification Objectives": [
      "Utilize fundamental principles of animation to communicate concepts",
      "Apply timing, spacing, and motion techniques in animated content",
      "Develop animated stories or sequences that effectively convey ideas",
      "Critically evaluate animations for clarity and engagement"
    ],
    "Key Contents / Topics": "Core animation principles (squash & stretch, timing, easing, etc.); storytelling through motion; 2D/3D animation tools and techniques; creating narrative animations or motion graphics; critique and refinement of animated works",
    "Learning Resources URL": "https://app.code.berlin/module/ID_26?table=learningResources"
  },
  {
    "Module Code": "DS_27",
    "Module Title": "Storytelling through Video",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "10 ECTS",
    "Contact Time (hours)": "60 hrs.",
    "Self-Study Time (hours)": "240 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Project course",
    "Assessment Type": "Practical project; presentation",
    "Module Coordinator": "Malith Prasanna Gunasekera",
    "Qualification Objectives": [
      "Create a narrative via motion picture using a full range of filmmaking methods",
      "Plan and execute video production (scripting, shooting, editing) to tell a story",
      "Incorporate audio, cinematography, and editing techniques effectively",
      "Evaluate the impact of storytelling choices on audience engagement"
    ],
    "Key Contents / Topics": "Video production as a design medium; storyboarding and scripting for videos; cinematography basics (framing, lighting, sound); editing and post-production workflow; conveying messages and emotions through moving images; critique of storytelling efficacy",
    "Learning Resources URL": "https://app.code.berlin/module/ID_27?table=learningResources"
  },
  {
    "Module Code": "DS_28",
    "Module Title": "Physical Interfaces II",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "10 ECTS",
    "Contact Time (hours)": "60 hrs.",
    "Self-Study Time (hours)": "240 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "DS_13; OS_01\u2013OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Lab course",
    "Assessment Type": "Project demos; technical report",
    "Module Coordinator": "Prof. Dr. Daniel Buzzo",
    "Qualification Objectives": [
      "Build intermediate physical interfaces using microcontrollers, sensors, actuators",
      "Iterate on hardware prototypes with improved functionality and interaction",
      "Integrate multiple hardware and software components into cohesive prototypes",
      "Critically assess user interaction with physical prototypes and refine designs"
    ],
    "Key Contents / Topics": "Advanced topics in physical computing and tangible interfaces; integrating microcontrollers with various sensors/outputs in complex setups; rapid prototyping of interactive physical systems; user testing of physical prototypes; iteration for performance and user experience",
    "Learning Resources URL": "https://app.code.berlin/module/ID_28?table=learningResources"
  },
  {
    "Module Code": "DS_29",
    "Module Title": "Artistic / Conceptual Project",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "10 ECTS",
    "Contact Time (hours)": "60 hrs.",
    "Self-Study Time (hours)": "240 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Self-directed project",
    "Assessment Type": "Project exhibition; reflective essay",
    "Module Coordinator": "Prof. Dr. Martin Knobel",
    "Qualification Objectives": [
      "Setup an artistic project for exploration in a group setting",
      "Use primary and secondary research to frame a creative concept",
      "Experiment with unconventional media/technologies for conceptual outcomes",
      "Critically reflect on the creative process and context of the project"
    ],
    "Key Contents / Topics": "Open-ended creative project enabling conceptual or artistic exploration; defining an area of inquiry and artistic approach; interdisciplinary experimentation (media art, installation, performance, etc.); emphasis on process, critique, and reflection; presentation/exhibition of work",
    "Learning Resources URL": "https://app.code.berlin/module/ID_29?table=learningResources"
  },
  {
    "Module Code": "DS_30",
    "Module Title": "Artificial Intelligence in Design",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "10 ECTS",
    "Contact Time (hours)": "60 hrs.",
    "Self-Study Time (hours)": "240 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "OS_01; OS_02; OS_03; OS_05",
    "Grading Type": "Graded",
    "Teaching Format": "Course and lab",
    "Assessment Type": "Written exam; project work",
    "Module Coordinator": "Prof. Dr. Daniel Buzzo",
    "Qualification Objectives": [
      "Describe main categories and effects of AI/ML techniques in design",
      "Understand how AI tools can augment the design process",
      "Apply basic machine learning models to design problems (e.g. generative design)",
      "Critically evaluate the outcomes of AI-driven design for ethics and bias"
    ],
    "Key Contents / Topics": "Introduction to AI and Machine Learning from a designer\u2019s perspective; overview of ML techniques (supervised, unsupervised, generative) relevant to design; using AI-powered tools for generative design or automation; examining case studies of AI in design; discussing ethical considerations (bias, authorship)",
    "Learning Resources URL": "https://app.code.berlin/module/ID_30?table=learningResources"
  },
  {
    "Module Code": "SE_01",
    "Module Title": "Software Development Basics",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective Mandatory",
    "Prerequisites": "Orientation modules (OS_01\u2013OS_05)",
    "Grading Type": "Pass/Fail",
    "Teaching Format": "Course (lecture + lab)",
    "Assessment Type": "Practical programming assignments; oral exam",
    "Module Coordinator": "Dr. Frank Trollmann",
    "Qualification Objectives": [
      "Cover fundamental programming concepts (variables, control structures, data types) and practice coding",
      "Understand basic software engineering process (edit-compile-run, debugging)",
      "Write simple programs to solve straightforward problems in a high-level language",
      "Build confidence in reading and writing code, setting the foundation for advanced courses"
    ],
    "Key Contents / Topics": "Introduction to programming and computational thinking; basic syntax and semantics of a programming language; writing, compiling, and running code; debugging techniques; structured programming (loops, conditionals, functions); simple algorithms and problem-solving with code; hands-on coding exercises throughout",
    "Learning Resources URL": "https://app.code.berlin/module/SE_01?table=learningResources"
  },
  {
    "Module Code": "SE_02",
    "Module Title": "Algorithms and Data Structures",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective Mandatory",
    "Prerequisites": "SE_01 or basic programming proficiency",
    "Grading Type": "Graded",
    "Teaching Format": "Course and lab exercises",
    "Assessment Type": "Written examination; coding assignments",
    "Module Coordinator": "Dr. Frank Trollmann",
    "Qualification Objectives": [
      "Understand classic algorithms (searching, sorting) and their complexity",
      "Implement fundamental data structures (arrays, linked lists, stacks, queues, trees, graphs)",
      "Analyze algorithm efficiency (Big-O notation)",
      "Choose appropriate data structures/algorithms to solve problems efficiently"
    ],
    "Key Contents / Topics": "Core algorithms (e.g. binary search, common sorts like quicksort/mergesort) and Big-O complexity; data structure internals (list vs. array, stack/queue operations, binary tree traversals, graph representations); recursion and algorithm design strategies; hands-on implementation and testing of algorithms; performance analysis techniques",
    "Learning Resources URL": "https://app.code.berlin/module/SE_02?table=learningResources"
  },
  {
    "Module Code": "SE_19",
    "Module Title": "Web Technologies Basics",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective Mandatory",
    "Prerequisites": "SE_01; basic web familiarity",
    "Grading Type": "Pass/Fail",
    "Teaching Format": "Course with hands-on labs",
    "Assessment Type": "Practical web project; oral quiz",
    "Module Coordinator": "Dr. Frank Trollmann",
    "Qualification Objectives": [
      "Learn the building blocks of the Web (HTML, CSS, HTTP)",
      "Understand how web browsers render content and how client-server architecture works",
      "Build simple static web pages and style them with CSS",
      "Gain introductory experience with client-side scripting (JavaScript basics)"
    ],
    "Key Contents / Topics": "Fundamentals of web development: HTML elements and semantic structure; Cascading Style Sheets for layout and design; the HTTP request-response cycle; introduction to JavaScript for interactivity; web development tools and debugging; creating and deploying a basic website",
    "Learning Resources URL": "https://app.code.berlin/module/SE_19?table=learningResources"
  },
  {
    "Module Code": "SE_41",
    "Module Title": "Digital Fabrication",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective Mandatory",
    "Prerequisites": "Basic design or prototyping experience",
    "Grading Type": "Graded",
    "Teaching Format": "Lab and workshop",
    "Assessment Type": "Practical fabrication project; report",
    "Module Coordinator": "Samuel Boguslawski",
    "Qualification Objectives": [
      "Understand common digital fabrication techniques (3D printing, laser cutting, CNC) and their workflows",
      "Operate fabrication tools safely and effectively to produce physical prototypes",
      "Convert digital designs into physical outputs using appropriate software (CAD/CAM)",
      "Integrate digital fabrication into iterative design processes"
    ],
    "Key Contents / Topics": "Introduction to makerspace tools and technologies; 3D modeling basics and slicing for 3D printing; vector design for laser cutting; CNC milling fundamentals; materials and methods in fabrication; from digital model to physical prototype; iterative prototyping and design validation with fabricated artifacts",
    "Learning Resources URL": "https://app.code.berlin/module/SE_41?table=learningResources"
  },
  {
    "Module Code": "SE_45",
    "Module Title": "Web Frontend Technologies",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "10 ECTS",
    "Contact Time (hours)": "60 hrs.",
    "Self-Study Time (hours)": "240 hrs.",
    "Module Type": "Elective Mandatory",
    "Prerequisites": "SE_19; basic JavaScript knowledge",
    "Grading Type": "Graded",
    "Teaching Format": "Course and project work",
    "Assessment Type": "Web app project; code review",
    "Module Coordinator": "Samuel Boguslawski",
    "Qualification Objectives": [
      "Master modern frontend frameworks and libraries (e.g. React, Angular or similar)",
      "Build complex, responsive single-page applications using HTML/CSS/JS",
      "Implement state management and client-side routing in a web app",
      "Optimize frontend performance and ensure accessibility and cross-browser compatibility"
    ],
    "Key Contents / Topics": "Advanced client-side web development: deep dive into a contemporary frontend framework; component-based architecture; state management patterns; using APIs and asynchronous data loading; build tools and module bundlers; front-end testing techniques; performance optimization and best practices in UX (including accessibility)",
    "Learning Resources URL": "https://app.code.berlin/module/SE_45?table=learningResources"
  },
  {
    "Module Code": "SE_46",
    "Module Title": "Web Backend Technologies",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "10 ECTS",
    "Contact Time (hours)": "60 hrs.",
    "Self-Study Time (hours)": "240 hrs.",
    "Module Type": "Elective Mandatory",
    "Prerequisites": "Basic programming and databases knowledge",
    "Grading Type": "Graded",
    "Teaching Format": "Course and project work",
    "Assessment Type": "Server application project; exam",
    "Module Coordinator": "Samuel Boguslawski",
    "Qualification Objectives": [
      "Design and implement server-side applications (RESTful APIs, web services) with a modern backend framework",
      "Work with databases (SQL/NoSQL) from the backend and perform CRUD operations",
      "Implement authentication/authorization and ensure web application security basics",
      "Deploy and scale backend services (using cloud or containerization tools)"
    ],
    "Key Contents / Topics": "Server-side development fundamentals: setting up a server with frameworks (e.g. Node.js/Express, Django, etc.); routing and handling requests; database integration and ORMs; building RESTful APIs; user authentication and security best practices; introduction to containerization (Docker) and cloud deployment; backend testing and debugging",
    "Learning Resources URL": "https://app.code.berlin/module/SE_46?table=learningResources"
  },
  {
    "Module Code": "STS_02",
    "Module Title": "Academic Reading",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "STS_01 or Orientation semester completion",
    "Grading Type": "Graded",
    "Teaching Format": "Seminar (reading group)",
    "Assessment Type": "Essay and reading logs",
    "Module Coordinator": "Prof. Dr. Fabian Geier",
    "Qualification Objectives": [
      "Engage with liberal arts topics through intensive academic reading",
      "Analyze and critique arguments in humanities or social science texts",
      "Develop improved comprehension of complex theoretical material",
      "Connect insights from readings to contemporary technosocial issues"
    ],
    "Key Contents / Topics": "Close reading of significant texts (book or set of papers) in humanities/social sciences relevant to technology and society; discussion of themes, contexts, and arguments; techniques for annotating and analyzing academic literature; writing analytical responses and essays; improving critical reading skills",
    "Learning Resources URL": "https://app.code.berlin/module/STS_02?table=learningResources"
  },
  {
    "Module Code": "STS_03",
    "Module Title": "Research",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "STS_01 or Orientation semester completion",
    "Grading Type": "Graded",
    "Teaching Format": "Seminar (research project)",
    "Assessment Type": "Research project report; presentation",
    "Module Coordinator": "Prof. Dr. Fabian Geier",
    "Qualification Objectives": [
      "Learn and apply research skills in a liberal arts context (question formulation, methodology)",
      "Conduct a small-scale research project (literature review, data collection if applicable)",
      "Analyze findings and draw conclusions using appropriate academic frameworks",
      "Present research results in written and oral formats clearly and logically"
    ],
    "Key Contents / Topics": "Fundamentals of academic research process: defining research questions, choosing qualitative or quantitative methods suitable for humanities/social inquiry; ethical considerations in research; carrying out a guided research project (which may involve surveys, interviews, or archival research); writing up results in an academic format; developing presentation skills for academic audiences",
    "Learning Resources URL": "https://app.code.berlin/module/STS_03?table=learningResources"
  },
  {
    "Module Code": "STS_04",
    "Module Title": "Presentation",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "STS_01 or Orientation semester completion",
    "Grading Type": "Graded",
    "Teaching Format": "Workshop (practical)",
    "Assessment Type": "Public presentation and reflection",
    "Module Coordinator": "Prof. Dr. Fabian Geier",
    "Qualification Objectives": [
      "Engage with liberal arts topics by preparing a public or semi-public presentation",
      "Develop effective storytelling and presentation techniques for academic/civic topics",
      "Enhance public speaking skills including clarity, pacing, and audience interaction",
      "Critically reflect on feedback to improve presentation effectiveness"
    ],
    "Key Contents / Topics": "Practice in researching and delivering presentations on societal/technological topics; structuring a talk with a clear narrative; using visual aids (slides, media) effectively; voice and body language training; engaging with audience questions; iterative improvement through rehearsal and critique; possibly participating in public forums or events as culmination",
    "Learning Resources URL": "https://app.code.berlin/module/STS_04?table=learningResources"
  },
  {
    "Module Code": "STS_05",
    "Module Title": "Judging Technology",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "STS_01 or Orientation semester completion",
    "Grading Type": "Graded",
    "Teaching Format": "Seminar (debate & ethics)",
    "Assessment Type": "Position papers; debates",
    "Module Coordinator": "Prof. Dr. Fabian Geier",
    "Qualification Objectives": [
      "Critically evaluate technological developments from ethical and societal perspectives",
      "Understand different philosophies of technology and their implications for society",
      "Formulate and defend arguments about the benefits and harms of specific technologies",
      "Recognize and articulate the social responsibilities of technologists"
    ],
    "Key Contents / Topics": "Critical examination of technology in society; frameworks from ethics, philosophy of technology, and STS for judging tech\u2019s impact; case studies of controversial technologies (AI ethics, privacy issues, sustainability); structured debates on tech policy or innovation dilemmas; developing reasoned positions on technology\u2019s role in society",
    "Learning Resources URL": "https://app.code.berlin/module/STS_05?table=learningResources"
  },
  {
    "Module Code": "STS_06",
    "Module Title": "Sustainable and Regenerative Development",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "None (interest in sustainability)",
    "Grading Type": "Graded",
    "Teaching Format": "Seminar and project",
    "Assessment Type": "Group project; reflective essay",
    "Module Coordinator": "Prof. Dr. Fabian Geier",
    "Qualification Objectives": [
      "Understand key concepts of sustainability and regenerative design/development",
      "Analyze the environmental and social impacts of design and tech projects",
      "Apply principles of circular economy and regenerative practices in project work",
      "Propose solutions that enhance sustainability outcomes in a given scenario"
    ],
    "Key Contents / Topics": "Fundamentals of sustainable development and regenerative design; climate change, resource cycles, and ecological principles; evaluating lifecycle impacts of products/services; frameworks like Cradle-to-Cradle, biomimicry, circular economy models; case studies of sustainable tech and design initiatives; developing mini-projects with sustainability focus",
    "Learning Resources URL": "https://app.code.berlin/module/STS_06?table=learningResources"
  },
  {
    "Module Code": "STS_07",
    "Module Title": "Self-Directed Learning",
    "Semester": "Core 2\u20135",
    "ECTS Credits": "5 ECTS",
    "Contact Time (hours)": "30 hrs.",
    "Self-Study Time (hours)": "120 hrs.",
    "Module Type": "Elective",
    "Prerequisites": "None",
    "Grading Type": "Graded",
    "Teaching Format": "Workshop (learning lab)",
    "Assessment Type": "Learning portfolio; presentation",
    "Module Coordinator": "Prof. Dr. Fabian Geier",
    "Qualification Objectives": [
      "Understand fundamentals of learning sciences and how they apply to personal learning",
      "Select and apply key metacognitive strategies (active recall, spaced repetition, etc.) to one\u2019s own study routine",
      "Reflect on one\u2019s learning process and identify improvements (learning how to learn)",
      "Demonstrate improved self-regulation and lifelong learning skills"
    ],
    "Key Contents / Topics": "Interdisciplinary perspectives on learning (educational psychology & neuroscience basics); evidence-based learning techniques (e.g. active recall, spaced practice, interleaving, mindfulness in learning); designing a personal learning plan; experimentation with different study methods; tracking progress and adjusting strategies; fostering a growth mindset towards challenges",
    "Learning Resources URL": "https://app.code.berlin/module/STS_07?table=learningResources"
  },
  {
    "Module Code": "BA_01",
    "Module Title": "Capstone Project",
    "Semester": "Synthesis",
    "ECTS Credits": "15 ECTS",
    "Contact Time (hours)": "0 hrs.",
    "Self-Study Time (hours)": "450 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "Completion of Core semesters; see Study Regulations",
    "Grading Type": "Graded",
    "Teaching Format": "Project work",
    "Assessment Type": "Oral/practical examination (project defense); written documentation",
    "Module Coordinator": "Examination Office",
    "Qualification Objectives": [
      "Apply techniques and best practices from the program to a complex project in an integrative way",
      "Exhibit mastery in a chosen specialization through the capstone project outcome",
      "Work effectively in a team or leadership role to deliver a substantial project",
      "Integrate knowledge from software, design, and business to address a real-world challenge"
    ],
    "Key Contents / Topics": "A culminating interdisciplinary project synthesizing learning across all semesters; students define and execute a large-scale project (often in teams) demonstrating technical, design, and entrepreneurial skills; holistic understanding of how various skills fit together; focus on project management, teamwork, and delivering a functional product/prototype; preparation for bachelor thesis context",
    "Learning Resources URL": "N/A (Resources are identified by students in consultation with supervisors)"
  },
  {
    "Module Code": "BA_02",
    "Module Title": "Bachelor Thesis",
    "Semester": "Synthesis",
    "ECTS Credits": "15 ECTS",
    "Contact Time (hours)": "0 hrs.",
    "Self-Study Time (hours)": "450 hrs.",
    "Module Type": "Mandatory",
    "Prerequisites": "Completion of Capstone Project; see Study Regulations",
    "Grading Type": "Graded",
    "Teaching Format": "Thesis (independent study)",
    "Assessment Type": "Written thesis and colloquium (oral defense)",
    "Module Coordinator": "Examination Office",
    "Qualification Objectives": [
      "Select and independently research a topic using scientific methods",
      "Conduct a thorough literature review and apply appropriate methodology",
      "Produce original analysis or design, demonstrating depth of knowledge in specialization",
      "Communicate results clearly in a well-structured thesis and defend them academically"
    ],
    "Key Contents / Topics": "An individual research or applied project culminating in a written thesis (~40-60 pages) demonstrating the student's ability to work independently on a problem in a scientifically rigorous way; topic often aligned with the student\u2019s specialization or capstone; includes literature survey, methodology, results, and discussion; oral defense (colloquium) where student answers questions and discusses the work with examiners",
    "Learning Resources URL": "N/A (Determined by the student\u2019s chosen topic and literature search)"
  }
];
var cleanString = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/:contentReference\[.*?\]\{index=\d+\}/g, "").trim();
};
var cleanedModules = rawModules.map((module) => {
  const cleanedModule = {};
  for (const key in module) {
    if (Array.isArray(module[key])) {
      cleanedModule[key] = module[key].map(cleanString);
    } else {
      cleanedModule[key] = cleanString(module[key]);
    }
  }
  return cleanedModule;
}).filter((module) => !module["Module Code"].startsWith("BM_"));
var modules = cleanedModules.reduce((acc, module) => {
  acc[module["Module Code"]] = module;
  return acc;
}, {});
var modulesBySemester = cleanedModules.reduce((acc, module) => {
  const semester = module.Semester || "Uncategorized";
  if (!acc[semester]) {
    acc[semester] = [];
  }
  acc[semester].push(module);
  return acc;
}, {});

// src/lib/assistant/personalities.js
var creativeNames = {
  OS_01: { name: "The Architect", icon: "architecture" },
  OS_02: { name: "The Visionary", icon: "palette" },
  OS_03: { name: "The Strategist", icon: "insights" },
  OS_05: { name: "The Collaborator", icon: "groups" },
  STS_01: { name: "The Ethicist", icon: "balance" },
  DS_01: { name: "The Composer", icon: "tune" },
  DS_02: { name: "The Automaton", icon: "auto_awesome" },
  DS_03: { name: "The Editor", icon: "edit_document" },
  DS_05: { name: "The Historian", icon: "history_edu" },
  DS_06: { name: "The Investigator", icon: "search" },
  DS_09: { name: "The Innovator", icon: "emoji_objects" },
  DS_10: { name: "The Brand Builder", icon: "branding_watermark" },
  DS_12: { name: "The Visualizer", icon: "data_usage" },
  DS_13: { name: "The Maker", icon: "hardware" },
  DS_17: { name: "The Futurist", icon: "vrpano" },
  DS_19: { name: "The Adapter", icon: "devices" },
  DS_20: { name: "The Orchestrator", icon: "lan" },
  DS_23: { name: "The Interface Designer", icon: "view_quilt" },
  DS_24: { name: "The Experience Crafter", icon: "attractions" },
  DS_25: { name: "The Researcher", icon: "science" },
  DS_26: { name: "The Animator", icon: "animation" },
  DS_27: { name: "The Storyteller", icon: "movie" },
  DS_28: { name: "The Inventor", icon: "memory" },
  DS_29: { name: "The Artist", icon: "gesture" },
  DS_30: { name: "The Augur", icon: "neurology" },
  SE_01: { name: "The Coder", icon: "code" },
  SE_02: { name: "The Optimizer", icon: "speed" },
  SE_19: { name: "The Web Weaver", icon: "public" },
  SE_41: { name: "The Fabricator", icon: "build_circle" },
  SE_45: { name: "The Frontend Dev", icon: "web" },
  SE_46: { name: "The Backend Dev", icon: "dns" },
  STS_02: { name: "The Reader", icon: "menu_book" },
  STS_03: { name: "The Inquirer", icon: "quiz" },
  STS_04: { name: "The Orator", icon: "campaign" },
  STS_05: { name: "The Judge", icon: "gavel" },
  STS_06: { name: "The Steward", icon: "recycling" },
  STS_07: { name: "The Learner", icon: "school" },
  BA_01: { name: "The Synthesizer", icon: "hub" },
  BA_02: { name: "The Scholar", icon: "history_toggle_off" }
};
var modulePersonalities = Object.values(modules).reduce((acc, module) => {
  const code = module["Module Code"];
  const creativeInfo = creativeNames[code] || { name: "The Expert", icon: "school" };
  acc[code] = {
    id: code,
    name: creativeInfo.name,
    icon: creativeInfo.icon,
    title: module["Module Title"],
    initialMessage: `Greetings. I am **${creativeInfo.name}**, your guide for **${module["Module Title"]}**. How can I help you generate some project ideas today?`,
    systemInstruction: `You are **${creativeInfo.name}**, a specialist AI agent expert in the university module titled "**${module["Module Title"]}**". Your purpose is to assist the main Orchestrator agent by performing specific tasks related to your expertise, such as researching topics, accessing connected tools (like Figma or GitHub), and providing deep insights based on the module's curriculum.

    **YOUR CONTEXT:**
    - **Module Code:** ${code}
    - **Key Contents:** ${module["Key Contents / Topics"]}
    - **Qualification Objectives:** ${module["Qualification Objectives"].join(", ")}.

    You will be invited into a conversation by the Orchestrator. When activated, you will perform your task and report your findings back to the Orchestrator and the user.
    `
  };
  return acc;
}, {});
var personalities = {
  ...modulePersonalities,
  orchestrator: {
    id: "orchestrator",
    name: "Orchestrator",
    icon: "hub",
    title: "Main Project Coordinator",
    systemInstruction: `You are the **Orchestrator**, the main AI assistant that helps users develop creative projects from idea to documentation. Your primary role is to manage the conversation, understand the user's goals, and delegate tasks to specialized Module Agents.

    **YOUR CAPABILITIES:**
    1.  **Converse and Strategize:** Chat with the user to understand their project needs, ask clarifying questions, and help them refine their ideas.
    2.  **Invite Specialist Agents:** The user can select a module from the left panel. Once a module is selected, you can "invite" its corresponding agent into the conversation to perform tasks. You do this when the user sends a message starting with \`/invite\`.
    3.  **Delegate Tasks:** When an agent is invited, you will delegate a task to it. For example, "I've invited @The_Coder. I'll ask it to research current JavaScript frameworks for this project."
    4.  **Synthesize Findings:** You will receive information back from the agents. Your job is to synthesize this information and present it clearly to the user, helping them make decisions.
    5.  **Use Tools:**
        -   **Documentation:** When the user wants to save an idea, they can use the \`/document [TemplateName]\` command. You will then use the ArchivaAI tool to create a new entry based on a template (e.g., Code_Notebook, Study_Archive).
        -   **Visualization:** If the user asks you to "visualize an idea" or similar, you can use the Gen Image Booth tool to generate an image.

    **YOUR GOAL:**
    To be a helpful, proactive, and intelligent project manager, guiding the user through the creative process by effectively using your team of specialist agents and powerful tools.`
  }
};

// src/lib/store.js
var store = immer((set2) => ({
  didInit: false,
  isWelcomeScreenOpen: true,
  theme: "dark",
  // App switcher state
  activeApp: "ideaLab",
  // 'ideaLab', 'imageBooth', or 'archiva'
  // Module state (Idea Lab)
  modules,
  activeModuleId: null,
  // Assistant state (for individual module floating chat)
  isAssistantOpen: false,
  isAssistantLoading: false,
  assistantHistories: {},
  // Orchestrator Chat State
  isOrchestratorLoading: false,
  orchestratorHistory: [
    {
      role: "model",
      parts: [{ text: "I am the Orchestrator. How can we start building your next project? You can select a module on the left and I can invite its agent to help us." }]
    }
  ],
  // Image Booth state
  activeModeKey: "banana",
  inputImage: null,
  outputImage: null,
  isGenerating: false,
  generationError: null,
  // Archiva State
  archivaEntries: {},
  // Store entries by ID
  activeEntryId: null
}));
var store_default = createSelectorFunctions(
  create(
    persist(store, {
      name: "gembooth-ideahub-storage",
      partialize: (state) => ({
        // Persist relevant state across sessions
        activeModuleId: state.activeModuleId,
        theme: state.theme,
        orchestratorHistory: state.orchestratorHistory,
        assistantHistories: state.assistantHistories,
        archivaEntries: state.archivaEntries
      })
    })
  )
);

// src/lib/assistant.js
import { Type } from "@google/genai";
var responseSchema = {
  type: Type.OBJECT,
  properties: {
    responseText: {
      type: Type.STRING,
      description: "Your friendly, conversational response to the user, in character. This should contain helpful information and project ideas relevant to the user's query and your persona."
    }
  },
  required: ["responseText"]
};
var getAssistantResponse = async (history, activePersonalityId) => {
  const activePersonality = personalities[activePersonalityId];
  if (!activePersonality) {
    return { responseText: "I'm sorry, I can't find my instructions for this module." };
  }
  const contents = [];
  history.forEach((msg) => {
    if (msg.responseText === activePersonality.initialMessage) return;
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content || msg.responseText }]
    });
  });
  const body = {
    model: "gemini-2.5-flash",
    contents,
    config: {
      systemInstruction: activePersonality.systemInstruction,
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.7
    }
  };
  try {
    const fetchResponse = await fetch("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!fetchResponse.ok) {
      const error = await fetchResponse.json();
      throw new Error(error.error || `Server returned status: ${fetchResponse.status}`);
    }
    const response = await fetchResponse.json();
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    if (parsed.responseText) {
      parsed.responseText = parsed.responseText.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/\n/g, "<br />");
    }
    return parsed;
  } catch (e) {
    console.error("Failed to fetch or parse assistant response:", e);
    return {
      responseText: "I'm sorry, I had a little trouble formatting my response. Could you try asking in a different way?"
    };
  }
};

// src/lib/llm.js
import { Modality } from "@google/genai";
import { limitFunction } from "p-limit";

// src/lib/primer.js
var GENBOOTH_PRIMER = `
You are **GenBooth Render Agent**.

GOAL
- Input: a single-person portrait image.
- Output: ONE image (PNG) as inline data. No text, no borders, no watermarks.

GENERAL RULES
- Preserve the person\u2019s identity, pose, framing, and aspect ratio unless the prompt says otherwise.
- Avoid adding text in the image.
- If transparency is present, keep the alpha channel clean (anti-aliased hair edges).
- Prefer photorealistic relighting/compositing when blending a subject onto a new background.

WORKFLOW SWITCH
A) If the prompt contains sections labeled exactly:
   "Subject:", "Background:", "Blend:"
   then execute this multi-step workflow:
   1) SEGMENT: Isolate the person; return a PNG with transparent background (hair wisps preserved).
   2) STYLE: Apply the Subject styling to the isolated person ONLY; keep alpha; keep silhouette and identity.
   3) COMPOSITE: Synthesize the Background scene and place the subject in it. Follow "Blend:" to harmonize grade, shadows, and rim light.
B) Otherwise, treat it as a single-step style edit on the full frame.

QUALITY
- Match lighting direction and color between subject and background.
- Create believable contact shadows and soft rim light where needed.
- Keep facial features sharp; avoid plastic skin; avoid posterization.

RETURN FORMAT
- Return ONLY the final image as inline PNG data. Do not include textual commentary.
`;

// src/lib/llm.js
var timeoutMs = 123333;
var maxRetries = 5;
var baseDelay = 1233;
var llm_default = limitFunction(
  async ({ model, prompt, inputFile, signal }) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);
        const genConfig = {};
        if (model === "gemini-2.5-flash-image-preview") {
          genConfig.responseModalities = [Modality.IMAGE, Modality.TEXT];
        }
        const fullPrompt = `${GENBOOTH_PRIMER}

${prompt}`;
        const requestBody = {
          model,
          config: genConfig,
          contents: {
            parts: [
              ...inputFile ? [
                {
                  inlineData: {
                    data: inputFile.split(",")[1],
                    mimeType: "image/jpeg"
                  }
                }
              ] : [],
              { text: fullPrompt }
            ]
          },
          safetySettings
        };
        const fetchPromise = fetch("/api/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: signal || controller.signal
        });
        const fetchResponse = await fetchPromise;
        clearTimeout(timeoutId);
        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json();
          const error = new Error(errorData.error || `HTTP error! status: ${fetchResponse.status}`);
          if (fetchResponse.status === 429) {
            error.status = "RESOURCE_EXHAUSTED";
          }
          throw error;
        }
        const response = await fetchResponse.json();
        if (!response.candidates || response.candidates.length === 0) {
          if (response.promptFeedback?.blockReason) {
            throw new Error(
              `Request blocked by API. Reason: ${response.promptFeedback.blockReason}`
            );
          }
          throw new Error("API returned no candidates.");
        }
        const candidate = response.candidates[0];
        if (!candidate.content) {
          if (candidate.finishReason) {
            throw new Error(
              `Image generation failed. Reason: ${candidate.finishReason}`
            );
          }
          throw new Error("API returned a candidate with no content.");
        }
        if (candidate.finishReason && ["SAFETY", "RECITATION"].includes(candidate.finishReason)) {
          throw new Error(
            `Image generation failed due to safety policy: ${candidate.finishReason}`
          );
        }
        const inlineDataPart = candidate.content.parts.find(
          (p) => p.inlineData
        );
        if (!inlineDataPart) {
          const textPart = candidate.content.parts.find((p) => p.text);
          if (textPart) {
            throw new Error(
              `Model returned a text response instead of an image: "${textPart.text}"`
            );
          }
          throw new Error("No inline data found in response");
        }
        return "data:image/png;base64," + inlineDataPart.inlineData.data;
      } catch (error) {
        if (signal?.aborted || error.name === "AbortError") {
          return;
        }
        if (attempt === maxRetries - 1) {
          throw error;
        }
        let delay = baseDelay * 2 ** attempt;
        if (error.status === "RESOURCE_EXHAUSTED") {
          console.warn(
            `Rate limit error detected. Increasing retry delay.`
          );
          delay += 1e4;
        }
        await new Promise((res) => setTimeout(res, delay));
        console.warn(
          `Attempt ${attempt + 1} failed, retrying after ${delay}ms...`
        );
      }
    }
  },
  { concurrency: 2 }
);
var safetySettings = [
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
  "HARM_CATEGORY_HARASSMENT"
].map((category) => ({ category, threshold: "BLOCK_NONE" }));

// src/lib/modes.js
var modes_default = {
  "Artistic & Photographic": {
    Playful: {
      banana: {
        name: "Banana",
        emoji: "\u{1F34C}",
        prompt: "Make the person in the photo wear a banana costume."
      },
      beard: {
        name: "Big Beard",
        emoji: "\u{1F9D4}\u{1F3FB}",
        prompt: "Make the person in the photo look like they have a huge beard."
      },
      lego: {
        name: "LEGO Minifig",
        emoji: "\u{1F9F1}",
        prompt: "Transform the person into a stylized plastic minifigure with simple facial features, snap-stud head, and blocky accessories."
      }
    },
    "Pop Culture Characters": {
      adventureTime: {
        name: "Adventure Time",
        emoji: "\u{1F436}",
        prompt: "Illustrate the person in the whimsical, rubber-hose animation style of Adventure Time, with simple noodle-like limbs, dot eyes, and a vibrant, candy-colored Land of Ooo background."
      },
      pixar: {
        name: "Pixar Character",
        emoji: "\u{1F4A1}",
        prompt: "Reimagine the person as a 3D character from a Pixar movie, with soft, rounded features, expressive animation, and detailed textures."
      },
      disney: {
        name: "Disney Prince/Princess",
        emoji: "\u{1F451}",
        prompt: "Redraw the person in the classic Disney animation style, as a fairy-tale prince or princess with large expressive eyes and a vibrant, enchanted forest background."
      },
      ghibli: {
        name: "Studio Ghibli",
        emoji: "\u{1F343}",
        prompt: "Illustrate the person in the style of a Studio Ghibli film, with a gentle, painterly look, soft colors, and a nostalgic, whimsical atmosphere."
      },
      dragonBall: {
        name: "Dragon Ball Z",
        emoji: "\u{1F525}",
        prompt: "Redraw the person in the photo in the iconic art style of Akira Toriyama's Dragon Ball Z. Preserve their likeness, but give them the characteristic sharp, angular lines, intense expressive eyes, and dynamic, cel-shaded coloring of the anime. Do not turn them into an existing character like Goku."
      },
      sailorMoon: {
        name: "Sailor Moon",
        emoji: "\u{1F319}",
        prompt: "Redraw the person in the iconic 90s Sailor Moon anime style, with large, sparkling eyes, flowing hair, and a magical girl transformation background."
      },
      harryPotter: {
        name: "Harry Potter",
        emoji: "\u{1F9D9}\u200D\u2642\uFE0F",
        prompt: "Transform the person into a character from the Harry Potter universe, with wizard robes, a wand, and set in a magical, Hogwarts-like environment."
      },
      wonderWoman: {
        name: "Wonder Woman",
        emoji: "\u{1F4A5}",
        prompt: "Turn the person into the superhero Wonder Woman, with her iconic tiara, armor, and a powerful, heroic pose."
      },
      sherlock: {
        name: "Sherlock Holmes",
        emoji: "\u{1F575}\uFE0F",
        prompt: "Make the person look like Sherlock Holmes, with a deerstalker hat, pipe, and a Victorian London background."
      },
      fridaKahlo: {
        name: "Frida Kahlo",
        emoji: "\u{1F33A}",
        prompt: "Transform the person into a portrait in the style of Frida Kahlo, with her iconic unibrow, bold floral hairpiece, traditional Mexican attire, and a surreal, symbolic background."
      },
      elvis: {
        name: "Elvis Presley",
        emoji: "\u{1F3A4}",
        prompt: "Make the person look like Elvis Presley in his prime, with a classic pompadour hairstyle, a dazzling jumpsuit, and a stage-lit performance background."
      }
    },
    Eras: {
      renaissance: {
        name: "Renaissance",
        emoji: "\u{1F3A8}",
        prompt: "Make the person in the photo look like a Renaissance painting."
      },
      "19century": {
        name: "19th Cent.",
        emoji: "\u{1F3A9}",
        prompt: "Make the photo look like a 19th century daguerreotype. Feel free to change the background to make it period appropriate and add props like Victorian clothing. Try to keep the perspective the same."
      },
      "80s": {
        name: "80s",
        emoji: "\u2728",
        prompt: "Make the person in the photo look like a 1980s yearbook photo. Feel free to change the hairstyle and clothing."
      },
      old: {
        name: "Old",
        emoji: "\u{1F475}\u{1F3FB}",
        prompt: "Make the person in the photo look extremely old."
      },
      baroquegold: {
        name: "Baroque Gilded",
        emoji: "\u{1F451}",
        prompt: "Paint the person with baroque drama\u2014chiaroscuro lighting, ornate gilded frame hints, and rich fabrics."
      },
      tintype: {
        name: "Tintype",
        emoji: "\u{1F9EA}",
        prompt: "Give the portrait a wet-plate collodion look with shallow depth, silver halation, edge vignetting, and plate artifacts."
      }
    },
    Mediums: {
      cartoon: {
        name: "Cartoon",
        emoji: "\u{1F603}",
        prompt: "Transform this image into a cute simple cartoon. Use minimal lines and solid colors."
      },
      anime: {
        name: "Anime",
        emoji: "\u{1F363}",
        prompt: "Make the person in the photo look like a photorealistic anime character with exaggerated features."
      },
      comic: {
        name: "Comic Book",
        emoji: "\u{1F4A5}",
        prompt: "Transform the photo into a comic book panel with bold outlines, halftone dots, and speech bubbles."
      },
      impressionist: {
        name: "Impressionist",
        emoji: "\u{1F58C}\uFE0F",
        prompt: "Repaint the person with loose impressionist brushstrokes, soft edges, and natural outdoor light, visible texture and color vibration."
      },
      fauvism: {
        name: "Fauvism",
        emoji: "\u{1F981}",
        prompt: "Use bold non-natural colors and simplified shapes to paint the person with expressive energy and visible strokes."
      },
      artnouveau: {
        name: "Art Nouveau",
        emoji: "\u{1F33F}",
        prompt: "Stylize the subject with flowing organic lines, decorative floral motifs, and a poster-like flat color background framed by ornamental borders."
      },
      cubism: {
        name: "Cubism",
        emoji: "\u{1F9E9}",
        prompt: "Deconstruct the face and clothing into geometric planes and multiple viewpoints with muted earth tones and fractured background."
      },
      ukiyoe: {
        name: "Ukiyo-e Woodblock",
        emoji: "\u{1F5FE}",
        prompt: "Transform the portrait into a traditional ukiyo-e style print with flat colors, delicate linework, patterned fabrics, and a softly textured paper look."
      },
      watercolor: {
        name: "Watercolor",
        emoji: "\u{1F4A7}",
        prompt: "Convert the image into a translucent watercolor portrait with soft washes, edge blooms, and subtle paper grain."
      },
      oilimpasto: {
        name: "Oil Impasto",
        emoji: "\u{1F9F4}",
        prompt: "Paint the subject in thick oil impasto with visible palette-knife strokes, rich color, and directional texture catching the light."
      },
      charcoal: {
        name: "Charcoal Sketch",
        emoji: "\u{1FAB5}",
        prompt: "Draw the person as a charcoal portrait with smudged shading, crisp highlights, and a few bold contour lines on toned paper."
      },
      statue: {
        name: "Statue",
        emoji: "\u{1F3DB}\uFE0F",
        prompt: "Make the person look like a classical marble statue, including the clothes and eyes."
      },
      papercraft: {
        name: "Papercraft",
        emoji: "\u{1F4E6}",
        prompt: "Cut and fold the portrait into layered paper shapes with crisp edges, subtle shadows, and a handcrafted collage feel."
      },
      claymation: {
        name: "Claymation",
        emoji: "\u{1F9F1}",
        prompt: "Rebuild the subject as a hand-modeled clay character with fingerprints, slight asymmetry, and soft studio lighting."
      },
      stainedglass: {
        name: "Stained Glass",
        emoji: "\u{1FA9F}",
        prompt: "Render the portrait as stained glass with leaded outlines, translucent color panes, and light shining through from behind."
      },
      mosaic: {
        name: "Mosaic",
        emoji: "\u{1F9FF}",
        prompt: "Compose the face with small tessellated tiles of varied hues; add grout lines and slight irregularities for authenticity."
      },
      filmnoir: {
        name: "Film Noir",
        emoji: "\u{1F575}\uFE0F",
        prompt: "Render the portrait in high-contrast black-and-white film noir lighting with hard shadows, Venetian blind slats, and a moody smoky ambience."
      },
      noircolor: {
        name: "Color Noir",
        emoji: "\u{1F39E}\uFE0F",
        prompt: "Combine noir-style dramatic lighting with muted color grading, cigarette smoke haze, and a vintage lens vignette."
      },
      cinematic: {
        name: "Cinematic Grade",
        emoji: "\u{1F3AC}",
        prompt: "Apply a modern cinematic color grade with soft key light, teal-orange contrast, shallow depth of field, and film grain."
      },
      polaroid: {
        name: "Polaroid",
        emoji: "\u{1F4F8}",
        prompt: "Render the image as a slightly overexposed instant photo with a white border, mild color cast, and handwritten caption area."
      },
      surrealcollage: {
        name: "Surreal Collage",
        emoji: "\u{1F300}",
        prompt: "Compose a dreamlike collage portrait with unexpected scale shifts, floating objects, and subtle double exposure."
      },
      graffiti: {
        name: "Graffiti Wall",
        emoji: "\u{1F9FF}",
        prompt: "Stencil the portrait on a textured wall with spray-paint gradients, drips, stickers, and layered street-art tags."
      },
      halftoneprint: {
        name: "Halftone Print",
        emoji: "\u{1F7E3}",
        prompt: "Recreate the face using large CMYK halftone dots, slight misregistration, and newsprint texture."
      },
      sciillustration: {
        name: "Scientific Illustration",
        emoji: "\u{1F52C}",
        prompt: "Depict the person as a precise plate-style scientific illustration with labeled callouts, hatching, and neutral tones."
      }
    },
    "Poster & Graphic": {
      psychedelic: {
        name: "Psychedelic",
        emoji: "\u{1F308}",
        prompt: "Create a 1960s psychedelic hand-drawn poster-style illustration based on this image with bright bold solid colors and swirling shapes. Don't add any text."
      },
      bauhaus: {
        name: "Bauhaus Poster",
        emoji: "\u{1F7E5}",
        prompt: "Abstract the portrait using geometric forms, primary colors, clean sans-serif shapes, and balanced modernist composition."
      },
      swiss: {
        name: "Swiss International",
        emoji: "\u{1F4CF}",
        prompt: "Design a minimal grid-based portrait poster with precise typography, generous whitespace, and restrained color accents."
      },
      brutalist: {
        name: "Brutalist",
        emoji: "\u{1F9F1}",
        prompt: "Render a stark, high-contrast portrait with heavy blocks, raw textures, minimal polish, and unapologetically functional composition."
      },
      botanical: {
        name: "Botanical Frame",
        emoji: "\u{1F343}",
        prompt: "Surround the face with detailed botanical engravings and soft natural light; calm palette and archival paper texture."
      },
      blueprint: {
        name: "Blueprint",
        emoji: "\u{1F4D0}",
        prompt: "Turn the portrait into a blueprint schematic with white linework on cyan paper, annotated measurements, and subtle paper creases."
      }
    },
    "Master Photographers": {
      anselAdams: {
        name: "Ansel Adams",
        emoji: "\u26F0\uFE0F",
        prompt: "Black-and-white large-format look: ultra-sharp detail, deep tonal range (Zone System), crisp skies with dramatic clouds, high micro-contrast."
      },
      cartierBresson: {
        name: "Henri Cartier-Bresson",
        emoji: "\u{1F39E}\uFE0F",
        prompt: "35mm B&W candid with natural light; decisive-moment timing, clean geometry, slight grain, unobtrusive reportage framing."
      },
      dorotheaLange: {
        name: "Dorothea Lange",
        emoji: "\u{1F9FA}",
        prompt: "Documentary B&W portraiture; humane, empathetic faces, soft daylight, textured clothes, modest depth of field, historical WPA tone."
      },
      richardAvedon: {
        name: "Richard Avedon",
        emoji: "\u{1F4CE}",
        prompt: "High-key studio portrait on seamless white; razor focus, minimal props, poised expression, subtle grain, crisp midtones."
      },
      irvingPenn: {
        name: "Irving Penn",
        emoji: "\u{1F9F5}",
        prompt: "Elegant studio stillness; corner backdrop, sculpted soft light, immaculate detail, refined color or B&W, editorial polish."
      },
      dianeArbus: {
        name: "Diane Arbus",
        emoji: "\u{1F3AD}",
        prompt: "Flash-lit square B&W portrait; direct gaze, intimate oddity, gentle grain, slight edge vignetting, honest tonal rendering."
      },
      helmutNewton: {
        name: "Helmut Newton",
        emoji: "\u{1F576}\uFE0F",
        prompt: "Glossy B&W fashion; hard directional light, deep shadows, chrome highlights, urban luxe, assertive poses."
      },
      annieLeibovitz: {
        name: "Annie Leibovitz",
        emoji: "\u{1F31F}",
        prompt: "Cinematic color portrait; rich palettes, sculpted studio light, environmental cues, editorial grandeur and storytelling."
      },
      sebastiaoSalgado: {
        name: "Sebasti\xE3o Salgado",
        emoji: "\u{1F30D}",
        prompt: "Epic B&W documentary; high contrast, rich texture, dramatic weather, dignified human presence, deep blacks."
      },
      steveMcCurry: {
        name: "Steve McCurry",
        emoji: "\u{1F9FF}",
        prompt: "Vivid color reportage; saturated tones, expressive eyes, shallow DOF, soft directional light, strong cultural context."
      },
      robertCapa: {
        name: "Robert Capa",
        emoji: "\u2693",
        prompt: "Gritty war reportage; motion blur, push-processed grain, urgent framing, available light, raw immediacy."
      },
      gordonParks: {
        name: "Gordon Parks",
        emoji: "\u{1F3BB}",
        prompt: "Humanist documentary; lyrical B&W or muted color, elegant composition, social narrative, balanced highlights."
      },
      vivianMaier: {
        name: "Vivian Maier",
        emoji: "\u{1FA9E}",
        prompt: "Square B&W street; quiet moments, reflections and shop windows, gentle grain, soft natural light, modest contrast."
      },
      williamEggleston: {
        name: "William Eggleston",
        emoji: "\u{1F352}",
        prompt: "Everyday color vernacular; dye-transfer richness, banal scenes as art, natural light, subtle geometry, saturated reds."
      },
      saulLeiter: {
        name: "Saul Leiter",
        emoji: "\u2614",
        prompt: "Muted painterly color; window fog, rain, reflections, layered foregrounds, telephoto compression, soft pastel palette."
      },
      daidoMoriyama: {
        name: "Daid\u014D Moriyama",
        emoji: "\u{1F43A}",
        prompt: "High-contrast grainy B&W; restless street energy, blur, grit, harsh light, raw tonal blocks."
      },
      peterLindbergh: {
        name: "Peter Lindbergh",
        emoji: "\u{1F5A4}",
        prompt: "Monochrome fashion portrait; natural light, minimal retouch, timeless styling, soft film grain, honest expressions."
      },
      maryEllenMark: {
        name: "Mary Ellen Mark",
        emoji: "\u{1F91D}",
        prompt: "Intimate B&W documentary portraiture; textured backgrounds, empathetic gaze, balanced midtones, candid realism."
      },
      brassai: {
        name: "Brassa\xEF",
        emoji: "\u{1F319}",
        prompt: "Nocturnal Paris B&W; wet cobblestones, street lamps, mist, long exposures, luminous highlights, romantic shadows."
      },
      walkerEvans: {
        name: "Walker Evans",
        emoji: "\u{1F3DA}\uFE0F",
        prompt: "Formal documentary B&W; frontal compositions, clear daylight, restrained contrast, architectural and typographic detail."
      }
    }
  },
  "Technical & Media Emulation": {
    "Film & Process Emulations": {
      kodachrome64: {
        name: "Kodachrome 64",
        emoji: "\u{1F7E5}",
        prompt: "Emulate Kodachrome 64: crisp micro-contrast, deep reds, rich blues, restrained shadows, minimal halation, slide-film clarity.",
        workflow: "grade-only"
      },
      portra400: {
        name: "Portra 400",
        emoji: "\u{1F9E1}",
        prompt: "Soft, natural skin tones with gentle contrast, wide latitude, pastel highlights, and fine grain typical of Portra 400.",
        workflow: "grade-only"
      },
      portra800: {
        name: "Portra 800",
        emoji: "\u{1F7E0}",
        prompt: "Low-light portrait look: warm skin tones, balanced contrast, slightly coarser grain, strong color fidelity.",
        workflow: "grade-only"
      },
      ektachromeE100: {
        name: "Ektachrome E100",
        emoji: "\u{1F537}",
        prompt: "Clean slide-film neutrality with cool-leaning blues, saturated yet accurate colors, and crisp edge definition.",
        workflow: "grade-only"
      },
      velvia50: {
        name: "Velvia 50",
        emoji: "\u{1F4AE}",
        prompt: "High-saturation landscape palette: vivid greens and magentas, punchy contrast, deep shadows, slide-film sharpness.",
        workflow: "grade-only"
      },
      provia100f: {
        name: "Provia 100F",
        emoji: "\u{1F4A0}",
        prompt: "Balanced slide film with moderate saturation, smooth grain, and refined color for a polished, editorial feel.",
        workflow: "grade-only"
      },
      fuji400h: {
        name: "Fujifilm 400H",
        emoji: "\u{1F49A}",
        prompt: "Cool minty greens, soft contrast, pastel skin tones, generous highlight roll-off; airy wedding/editorial vibe.",
        workflow: "grade-only"
      },
      cinestill800t: {
        name: "CineStill 800T",
        emoji: "\u{1F303}",
        prompt: "Tungsten-balanced night color with cyan shadows, warm highlights, signature halation around bright lights, cinematic grain.",
        workflow: "grade-only"
      },
      vision3_250d: {
        name: "Vision3 250D",
        emoji: "\u{1F3AC}",
        prompt: "Daylight-balanced cinema negative: muted saturation, wide dynamic range, gentle contrast, filmic color response.",
        workflow: "grade-only"
      },
      vision3_500t: {
        name: "Vision3 500T",
        emoji: "\u{1F3A5}",
        prompt: "Tungsten-balanced cine stock: low-light latitude, soft contrast curve, teal-leaning shadows, subtle grain structure.",
        workflow: "grade-only"
      },
      polaroid600: {
        name: "Polaroid 600",
        emoji: "\u{1F9CA}",
        prompt: "Instant-film look: soft focus, cool cast, crushed blacks, creamy highlights, slight vignetting and frame-border feel.",
        workflow: "grade-only"
      },
      polaroidSX70: {
        name: "Polaroid SX-70",
        emoji: "\u{1F9F4}",
        prompt: "Warm instant tone with gentle magenta shift, shallow dynamic range, delicate grain, and vintage softness.",
        workflow: "grade-only"
      },
      fp100c: {
        name: "FP-100C Peel-Apart",
        emoji: "\u{1F0CF}",
        prompt: "Classic peel-apart color: neutral mids, rich yet not oversaturated hues, smooth grain, subtle paper texture.",
        workflow: "grade-only"
      },
      ilfordHP5: {
        name: "Ilford HP5",
        emoji: "\u26AB",
        prompt: "Classic B&W: medium-high grain, punchy midtones, forgiving latitude, documentary character with strong texture.",
        workflow: "grade-only"
      },
      triX400: {
        name: "Kodak Tri-X 400",
        emoji: "\u{1F39E}\uFE0F",
        prompt: "Gritty B&W with bold contrast, pronounced grain, deep blacks, and timeless reportage mood.",
        workflow: "grade-only"
      },
      tmax3200: {
        name: "Kodak T-Max 3200",
        emoji: "\u{1F30C}",
        prompt: "Ultra-high-speed B&W: heavy grain, dramatic contrast, low-light character with glowing highlights.",
        workflow: "grade-only"
      },
      aerochromeIR: {
        name: "Aerochrome IR",
        emoji: "\u{1F353}",
        prompt: "False-color infrared aesthetic: foliage shifts to hot pinks/reds, cyan skies, surreal tonal mapping with fine grain.",
        workflow: "grade-only"
      },
      lomographyPurple: {
        name: "Lomo Purple",
        emoji: "\u{1F7E3}",
        prompt: "Psychedelic color swap: greens shift toward purple, dreamy contrast, playful saturation, lo-fi vignette.",
        workflow: "grade-only"
      },
      crossProcessC41inE6: {
        name: "Cross-Process (C-41 in E-6)",
        emoji: "\u{1F9EA}",
        prompt: "Cross-processed slide look: wild contrast, crushed shadows, cyan/yellow shifts, unpredictable yet stylish color.",
        workflow: "grade-only"
      },
      bleachBypass: {
        name: "Bleach Bypass",
        emoji: "\u{1F948}",
        prompt: "Silver-retained film effect: desaturated palette, elevated contrast, metallic highlights, and hard-edged detail.",
        workflow: "grade-only"
      }
    },
    "Analog Carriers & Signal Path Artifacts": {
      crtPhosphor: {
        name: "CRT Phosphor",
        emoji: "\u{1F4FA}",
        prompt: "Rephotograph the image off a curved CRT: visible scanlines, triad phosphor dots, slight barrel distortion, soft bloom on highlights."
      },
      vhsEpTape: {
        name: "VHS EP",
        emoji: "\u{1F4FC}",
        prompt: "Emulate long-play VHS: chroma bleed, tape noise, dropouts, head-switching tear at frame bottom, softened detail, slight time wobble."
      },
      betacamSp: {
        name: "Betacam SP",
        emoji: "\u{1F39B}\uFE0F",
        prompt: "Broadcast ENG look: clean interlaced fields, mild knee compression in highlights, neutral color, crisp but analog texture."
      },
      minidvInterlace: {
        name: "MiniDV Interlace",
        emoji: "\u{1F4F9}",
        prompt: "Early digital camcorder vibe: interlaced combing on motion, 4:1:1 chroma softness, slight edge sharpening halos."
      },
      laserdiscComposite: {
        name: "LaserDisc Composite",
        emoji: "\u{1F4BF}",
        prompt: "Composite video artifacts: dot crawl on edges, rainbowing on fine patterns, stable frame with analog smoothness."
      },
      ntscGhosting: {
        name: "NTSC Ghosting",
        emoji: "\u{1F6F0}\uFE0F",
        prompt: "Over-the-air TV: multipath ghost images offset to the right, antenna snow, horizontal jitter, broadcast-safe saturation."
      },
      timebaseWobble: {
        name: "Timebase Wobble",
        emoji: "\u23F1\uFE0F",
        prompt: "No time-base corrector: horizontal jitter, vertical roll tendencies, rhythmic shimmer, imperfect sync lines."
      },
      macrovisionTear: {
        name: "Macrovision Tear",
        emoji: "\u{1F6AB}",
        prompt: "Copy-protection failure: unstable brightness pumping, tearing near top of frame, AGC breathing, analog chaos."
      },
      analogPhotocopyGen5: {
        name: "Photocopy Gen-V",
        emoji: "\u{1F5A8}\uFE0F",
        prompt: "Fifth-generation photocopy: crushed blacks, blown highlights, banding, toner speckle, paper warp and edge shadows."
      },
      faxThermalRoll: {
        name: "Fax Thermal",
        emoji: "\u{1F4E0}",
        prompt: "Thermal fax look: dithered line art, streaking, paper feed skew, low dynamic range, slight chemical yellowing."
      },
      risographDuotone: {
        name: "Risograph Duotone",
        emoji: "\u{1F7E3}",
        prompt: "Riso print: two-color soy-ink layers (e.g., purple + teal), visible registration misalign, coarse halftone, paper tooth."
      },
      cyanotypeBlueprint: {
        name: "Cyanotype",
        emoji: "\u{1FAD0}",
        prompt: "Contact-print blueprint: deep Prussian blue, white highlights, brush-edge borders, UV exposure softness."
      },
      photogramContact: {
        name: "Photogram",
        emoji: "\u{1F32B}\uFE0F",
        prompt: "Darkroom photogram: object silhouettes on fiber paper, diffuse glow around edges, grain and chemical edge stains."
      },
      pinholeLongExposure: {
        name: "Pinhole Long Exposure",
        emoji: "\u{1F573}\uFE0F",
        prompt: "Ultra-wide vignette, gentle softness, long-exposure motion smear, subtle color shift, film reciprocity artifacts."
      },
      slitScanPortrait: {
        name: "Slit-Scan",
        emoji: "\u{1FA9E}",
        prompt: "Temporal smear along one axis: features stretched/skewed by time, flowing contours, continuous-lens scan aesthetic."
      },
      lenticularPrint: {
        name: "Lenticular Print",
        emoji: "\u{1F501}",
        prompt: "Ribbed lens texture with parallax shift: interlaced stripes, slight ghosting, angle-dependent shimmer."
      },
      hologramDiffraction: {
        name: "Hologram Diffraction",
        emoji: "\u{1FAA9}",
        prompt: "Embossed hologram feel: rainbow diffraction fringes, metallic sheen, direction-dependent highlights, micro-etched texture."
      },
      ccdBloomSmear: {
        name: "CCD Bloom/Smear",
        emoji: "\u{1F4A1}",
        prompt: "Vertical smear from bright highlights, blooming around speculars, 90s CCD dynamic range and color response."
      },
      rollingShutterJello: {
        name: "Rolling Shutter",
        emoji: "\u{1F36E}",
        prompt: "CMOS jello: skewed verticals during motion, partial-exposure wobble, scanline-time offsets on fast pans."
      },
      screenMoir\u00E9Capture: {
        name: "Screen Moir\xE9",
        emoji: "\u{1F9F5}",
        prompt: "Re-shooting a screen: moir\xE9 interference patterns, refresh banding, slight moire rainbowing, off-axis glare and dust."
      }
    },
    "CGI & Digital": {
      "8bit": {
        name: "8-bit",
        emoji: "\u{1F3AE}",
        prompt: "Transform this image into a minimalist 8-bit brightly colored cute pixel art scene on a 80x80 pixel grid."
      },
      lowpoly: {
        name: "Low-Poly 3D",
        emoji: "\u{1F4C9}",
        prompt: "Reconstruct the person as a low-poly 3D bust with flat-shaded facets, simple color planes, and studio backdrop."
      },
      blueprint3d: {
        name: "3D Wireframe",
        emoji: "\u{1F578}\uFE0F",
        prompt: "Convert the head into a clean 3D wireframe with isometric contours, vertex dots, and technical annotation."
      },
      vaporwave: {
        name: "Vaporwave",
        emoji: "\u{1F6FC}",
        prompt: "Style the image with neon gradients, retro grid horizon, palm silhouettes, and 80s digital artifacts; keep it dreamy and nostalgic."
      },
      synthwave: {
        name: "Synthwave",
        emoji: "\u{1F3B9}",
        prompt: "Render a dramatic neon-lit portrait with rim lighting, chrome accents, and a sun-with-stripes backdrop; cinematic 80s synth aesthetic."
      },
      cyberpunk: {
        name: "Cyberpunk",
        emoji: "\u{1F303}",
        prompt: "Create a night city portrait with holographic signage, rain-soaked reflections, neon rim light, and techwear elements around the face and shoulders."
      },
      glitch: {
        name: "Glitch",
        emoji: "\u{1FAB2}",
        prompt: "Apply digital glitch effects, RGB channel splits, scan lines, datamosh streaks, and corrupted blocks while keeping the face recognizable."
      },
      neonoutline: {
        name: "Neon Outline",
        emoji: "\u{1F4A1}",
        prompt: "Trace the face and features with glowing neon tube lines on a dark background; add soft bloom and slight flicker."
      },
      holofoil: {
        name: "Holographic Foil",
        emoji: "\u{1FA99}",
        prompt: "Make the portrait appear embossed in iridescent holo-foil with shifting rainbow reflections and subtle texture."
      },
      xray: {
        name: "X-Ray",
        emoji: "\u{1F9B4}",
        prompt: "Create an artistic x-ray interpretation with translucent layers hinting at skull and clothing structure while keeping identity readable."
      },
      infrared: {
        name: "Infrared",
        emoji: "\u{1F321}\uFE0F",
        prompt: "Map the portrait into thermal imaging with temperature gradients, hot and cool zones, and slight sensor noise."
      },
      chrome: {
        name: "Liquid Chrome",
        emoji: "\u{1FA9E}",
        prompt: "Wrap facial forms in mirror-like liquid chrome with crisp reflections and studio highlights; keep features readable."
      }
    },
    "3D Render Qualities & Pipelines": {
      pbrFilmic: {
        name: "PBR + Filmic",
        emoji: "\u{1F39E}\uFE0F",
        prompt: "Render with physically-based shading, GGX microfacets, image-based lighting, and a Filmic/ACES tonemap; balanced exposure and soft specular rolloff."
      },
      clayAoTurntable: {
        name: "Clay + AO Turntable",
        emoji: "\u{1F3FA}",
        prompt: "Monochrome clay shader with strong ambient occlusion and soft studio dome light; neutral background and subtle turntable vibe."
      },
      toonRampNPR: {
        name: "Toon Ramp NPR",
        emoji: "\u{1F58D}\uFE0F",
        prompt: "Cel shading with 3\u20134 step ramps, crisp ink outlines, quantized specular highlights, and flat background planes."
      },
      matcapStudio: {
        name: "MatCap Studio",
        emoji: "\u{1F4BF}",
        prompt: "Use a high-res matcap for instant studio reflections; keep normals clean, add slight fresnel to rims, disable environment shadows."
      },
      sssSkin: {
        name: "Subsurface Skin",
        emoji: "\u{1FA78}",
        prompt: "Subsurface scattering for skin with shallow red transmission on ears and nose; soft key light and subtle roughness breakup."
      },
      thinFilmIridescence: {
        name: "Thin-Film Iridescence",
        emoji: "\u{1FAA9}",
        prompt: "Apply angle-dependent rainbow sheen via thin-film interference; crisp specular with fresnel boost and controlled saturation."
      },
      carPaintFlakes: {
        name: "Car Paint Flakes",
        emoji: "\u{1F697}",
        prompt: "Multi-layer coat with metallic base, microflake sparkle, clearcoat specular lobe, and sharp HDR highlights."
      },
      brushedMetalAniso: {
        name: "Anisotropic Metal",
        emoji: "\u{1FA99}",
        prompt: "Anisotropic GGX with tangent-aligned brushing; elongated highlights, soft grazing reflections, and gentle roughness variation."
      },
      microDisplacement: {
        name: "Micro Displacement",
        emoji: "\u{1F9F1}",
        prompt: "True displacement at micro scale with adaptive subdivision; crisp silhouettes, contact shadows, and parallax-rich textures."
      },
      parallaxOcclusion: {
        name: "Parallax Occlusion",
        emoji: "\u{1FA9C}",
        prompt: "Height-mapped parallax occlusion with self-shadow; preserved silhouette but deep relief on surfaces and tight crevice shading."
      },
      triplanarNoise: {
        name: "Triplanar Procedural",
        emoji: "\u{1F9ED}",
        prompt: "Use triplanar projection to apply procedural noise/rock without UV seams; large-scale breakup + fine detail layer."
      },
      raymarchSDF: {
        name: "Ray-marched SDF",
        emoji: "\u{1F300}",
        prompt: "Signed distance field look: crisp CSG-like forms, soft AO from distance gradients, and screen-space shadows."
      },
      pathTraceGI: {
        name: "Path-Traced GI",
        emoji: "\u{1F4A1}",
        prompt: "Global illumination with multiple importance sampling, soft indirect bounce, color bleeding, and realistic noise that converges."
      },
      voxelAO: {
        name: "Voxel AO/GI",
        emoji: "\u{1F9CA}",
        prompt: "Voxelized scene feel: blocky indirect light, chunky AO in cavities, slight step artifacts on edges."
      },
      volumetricGodRays: {
        name: "Volumetric God Rays",
        emoji: "\u{1F32B}\uFE0F",
        prompt: "Participating media with crepuscular rays; depth-graded fog, subtle aerial perspective, and light shafts through gaps."
      },
      causticsPhoton: {
        name: "Glass Caustics",
        emoji: "\u{1F526}",
        prompt: "Physically correct refractive caustics from glass/liquid; sharp focused light patterns on surfaces and soft dispersion."
      },
      bokehDoF: {
        name: "Bokeh Depth-of-Field",
        emoji: "\u{1F4F7}",
        prompt: "Cinematic DoF with iris blades shaping bokeh; slight cat-eye at edges, creamy backgrounds, and focus breathing hint."
      },
      wireframeHiddenLine: {
        name: "Hidden-Line Wire",
        emoji: "\u{1F578}\uFE0F",
        prompt: "Technical viewport: visible edges in black, hidden lines faint or dashed; flat white diffuse with mild AO."
      },
      uvCheckerInspect: {
        name: "UV Checker Inspect",
        emoji: "\u{1F9F5}",
        prompt: "High-contrast UV checker with numbered tiles; consistent texel density, seam highlights, and distortion callouts."
      },
      curvatureCavity: {
        name: "Curvature/Cavity Mask",
        emoji: "\u{1FAA8}",
        prompt: "Derive curvature map to darken cavities and lighten edges; adds worn highlights and contact grime for tactile realism."
      },
      pointCloudSurfels: {
        name: "Point Cloud Surfels",
        emoji: "\u{1F7E3}",
        prompt: "Render as dense surfel points with size by view angle and normal; soft splat blending and slight depth cue."
      },
      photogrammetryScan: {
        name: "Photogrammetry Scan",
        emoji: "\u{1F9F0}",
        prompt: "High-poly look with baked albedo/normal from photos; imperfect seams, lighting baked into texture, tripod-like neutral HDR."
      },
      iridescentHolographicFoil: {
        name: "Holo Foil Material",
        emoji: "\u{1F3B4}",
        prompt: "Procedural rainbow diffraction with view-dependent stripes; metallic base, high specular, and subtle normal noise."
      },
      stylizedClayToonMix: {
        name: "Clay-Toon Hybrid",
        emoji: "\u{1F9F8}",
        prompt: "Matte clay base with toon ramps on direct light and soft SSS fill; gentle outlines and pastel background cards."
      },
      gpuPathNoiseGrain: {
        name: "Path-Noise Grain",
        emoji: "\u{1F30C}",
        prompt: "Keep a tiny amount of unbiased render grain (no denoise) for cinematic texture; emphasize highlight sparkle and micro-contrast."
      },
      acescgNeutral: {
        name: "ACEScg Neutral Grading",
        emoji: "\u{1F39B}\uFE0F",
        prompt: "Linear \u2192 ACEScg working space with neutral grade; preserved highlight headroom, gentle shoulder, and filmic contrast."
      }
    }
  },
  "Scientific & Abstract": {
    "Exotic Optics & Non-Euclidean Capture": {
      plenopticArray: {
        name: "Plenoptic Light Field",
        emoji: "\u{1F4E1}",
        prompt: "Simulate a microlens-array light-field capture: slight multi-view parallax, re-focusable sharpness, micro-tile structure, subtle vignette between tiles."
      },
      codedAperture: {
        name: "Coded Aperture (Lensless)",
        emoji: "\u{1F9E9}",
        prompt: "Lensless imaging look: sharpness emerges from deconvolved mask patterns; faint cross-correlation ghosts and coded bokeh in highlights."
      },
      schlieren: {
        name: "Schlieren Flow",
        emoji: "\u{1F4A8}",
        prompt: "Edge-lit refractive index mapping: shimmering gradients around heat/airflow, razor black/white knife-edge contrast, lab-grade cleanliness."
      },
      shadowgraph: {
        name: "Shadowgraph",
        emoji: "\u{1F32B}\uFE0F",
        prompt: "High-speed density gradients rendered as soft monochrome shadows; crisp directional edges and scientific plate aesthetics."
      },
      interferometry: {
        name: "Interferometry Fringes",
        emoji: "\u{1F300}",
        prompt: "Phase-wrapped interference fringes contour the face; iridescent bands, ultra-fine lines, moir\xE9-like phase steps."
      },
      polarizationMicroscopy: {
        name: "Cross-Polarized Micro",
        emoji: "\u{1F9FF}",
        prompt: "Cross-polarized crystalline look: birefringent rainbow sheens, black background, angular color shifts, glittering micro-contrast."
      },
      uvivf: {
        name: "UV-Induced Visible Fluorescence",
        emoji: "\u{1F9EC}",
        prompt: "Dark scene with UV excitation: subjects glow in surreal cyans and violets; deep blacks, fluorescent edges, mild lens fluorescence."
      },
      hyperspectralFalseColor: {
        name: "Hyperspectral False Color",
        emoji: "\u{1F308}",
        prompt: "Map invisible bands to visible channels: vegetation-magenta, skin-teal shifts; clinical clarity with unusual material separations."
      },
      catadioptricMirror: {
        name: "Catadioptric Donut Bokeh",
        emoji: "\u{1FA9E}",
        prompt: "Mirror-lens rendering: perfect central sharpness, donut-shaped bokeh highlights, compressed perspective, neutral contrast."
      },
      anamorphicScope: {
        name: "Anamorphic Squeeze",
        emoji: "\u{1F4FD}\uFE0F",
        prompt: "Cinematic anamorphic: oval bokeh, horizontal blue flares, squeezed geometry then unsqueezed feel, gentle edge smear."
      },
      slitScanTime: {
        name: "Temporal Slit-Scan",
        emoji: "\u23F3",
        prompt: "Camera scans over time: facial features stretched along one axis; flowing time-texture, continuous motion ribbons."
      },
      tofDepthFusion: {
        name: "Time-of-Flight Depth Fusion",
        emoji: "\u{1F4CF}",
        prompt: "Depth map fused with albedo: quantized stepped contours, clean Lambertian shading, slight multipath ghosting in edges."
      },
      speckleCoherence: {
        name: "Laser Speckle",
        emoji: "\u2728",
        prompt: "Coherent illumination speckle: granular shimmering patterns on skin, high micro-contrast, tiny pseudo-motion grain."
      },
      holographicOffAxis: {
        name: "Off-Axis Holography",
        emoji: "\u{1FAA9}",
        prompt: "Carrier fringes over the image, metallic diffraction sheen, depth impressions when tilted; crisp interference texture."
      },
      stereographicPlanet: {
        name: "Stereographic \u201CTiny Planet\u201D",
        emoji: "\u{1F30D}",
        prompt: "Non-Euclidean projection: wrap surroundings into a circular planet around the subject; curvilinear lines, edge stretching."
      },
      hyperbolicTiling: {
        name: "Hyperbolic Camera",
        emoji: "\u267E\uFE0F",
        prompt: "Poincar\xE9 disk-style warping: repeating motifs shrink toward circular boundary; face central, space tessellates outward."
      },
      fourDProjection: {
        name: "4D Projection Portrait",
        emoji: "\u{1F9E0}",
        prompt: "Project a 4D object field into 3D: multiple consistent occlusion layers, impossible overlaps, soft parallax contradictions."
      },
      causticImaging: {
        name: "Caustic Camera",
        emoji: "\u{1F4A7}",
        prompt: "Image formed by focused light caustics through patterned glass/water: sharp luminous filigree, dark background, high dynamic range."
      },
      semLike: {
        name: "SEM-Like Micro Relief",
        emoji: "\u{1F52C}",
        prompt: "Scanning electron style (aesthetic only): monochrome metallic relief, extreme micro-contrast, shadowed topology, no color."
      },
      nerfBake: {
        name: "NeRF Reprojection",
        emoji: "\u{1F9F1}",
        prompt: "Neural radiance field vibe: floaters, view-dependent sparkle, mild reconstruction blur on hair/edges, photogrammetry-like bake artifacts."
      }
    },
    "Computer-Vision Diagnostic Layers": {
      gradCam: {
        name: "Grad-CAM Heatmap",
        emoji: "\u{1F525}",
        prompt: "Overlay a semi-transparent Grad-CAM heatmap on the subject; warm colors indicate high class activation. Preserve base detail underneath and add a subtle legend.",
        workflow: "overlay"
      },
      integratedGradients: {
        name: "Integrated Gradients",
        emoji: "\u{1F9EE}",
        prompt: "Render attribution as a faint stippled mask over the face and key features; brighter points mean stronger contribution. Keep tones neutral and scientific.",
        workflow: "overlay"
      },
      saliencyMap: {
        name: "Saliency Map",
        emoji: "\u{1F441}\uFE0F",
        prompt: "Add a high-frequency monochrome saliency layer that highlights edge- and texture-rich regions. Keep background low-contrast.",
        workflow: "overlay"
      },
      segmentationCityscapes: {
        name: "Semantic Seg (Cityscapes Palette)",
        emoji: "\u{1F5FA}\uFE0F",
        prompt: "Apply a crisp semantic segmentation overlay using the Cityscapes color palette; label the person class and keep boundaries anti-aliased.",
        workflow: "overlay"
      },
      instanceMasksCoco: {
        name: "Instance Masks (COCO)",
        emoji: "\u{1F9E9}",
        prompt: "Show each detected instance with a translucent colored mask and a thin white contour; add tiny ID tags at the centroid.",
        workflow: "overlay"
      },
      detectionBoxesYolo: {
        name: "YOLO Boxes + Scores",
        emoji: "\u{1F4E6}",
        prompt: "Draw neon-green 1px bounding boxes with class labels and confidence scores in a compact monospace overlay; anchor labels to top-left of boxes.",
        workflow: "overlay"
      },
      keypointsOpenPose: {
        name: "OpenPose Skeleton",
        emoji: "\u{1F57A}",
        prompt: "Overlay 2D body keypoints with thin joints and small circular nodes; use different hues for limbs, head, and torso; include a tiny confidence scale.",
        workflow: "overlay"
      },
      faceLandmarksArkit: {
        name: "ARKit Landmarks",
        emoji: "\u{1F642}",
        prompt: "Render dense facial landmarks (eyes, brows, lips) as tiny dots and subregion polylines; keep the original portrait visible beneath.",
        workflow: "overlay"
      },
      opticalFlowFarneback: {
        name: "Optical Flow Field",
        emoji: "\u{1F32C}\uFE0F",
        prompt: "Add short motion vectors (arrows) colored by direction with magnitude encoded by length; subtle, as if paused mid-analysis.",
        workflow: "overlay"
      },
      depthTurboColormap: {
        name: "Monodepth (Turbo)",
        emoji: "\u{1F308}",
        prompt: "Compute a depth map and overlay it with the Turbo colormap; near is warm, far is cool; include a slim vertical color bar.",
        workflow: "overlay"
      },
      surfaceNormalsRGB: {
        name: "Surface Normals (RGB)",
        emoji: "\u{1F39B}\uFE0F",
        prompt: "Generate per-pixel surface normals and show them as an RGB shading pass; blend at 40% opacity over the portrait.",
        workflow: "overlay"
      },
      stereoDisparity: {
        name: "Stereo Disparity",
        emoji: "\u{1FAE7}",
        prompt: "Present a quantized disparity map with contour lines at fixed intervals; label a few isolines with depth in centimeters.",
        workflow: "overlay"
      },
      lidarPointCloud: {
        name: "LiDAR Point Cloud",
        emoji: "\u{1F539}",
        prompt: "Render sparse depth points over the image with intensity-based brightness and mild perspective jitter; add a tiny axis gizmo.",
        workflow: "overlay"
      },
      uvUnwrapAtlas: {
        name: "UV Unwrap Atlas",
        emoji: "\u{1F9F5}",
        prompt: "Project a checkerboard UV atlas onto the face; show seams and island borders in red; keep checker scale small and crisp.",
        workflow: "overlay"
      },
      retopoWireframe: {
        name: "Retopo Wireframe",
        emoji: "\u{1F578}\uFE0F",
        prompt: "Overlay a clean quad-only wireframe that follows facial topology; thin white lines with subtle screen-space thickness.",
        workflow: "overlay"
      },
      normalsEdgeOcclusion: {
        name: "X-Ray Edges & AO",
        emoji: "\u{1FA7B}",
        prompt: "Combine stylized edge detection with ambient occlusion shadows in creases; result looks like a technical x-ray sketch over the photo.",
        workflow: "overlay"
      },
      superresArtifacts: {
        name: "Super-Res Residuals",
        emoji: "\u{1F50D}",
        prompt: "Visualize the residual between low-res and super-res as a faint magenta/green difference layer; annotate PSNR/SSIM in a corner.",
        workflow: "overlay"
      },
      demosaicChecker: {
        name: "Demosaic Inspector",
        emoji: "\u{1F7E5}",
        prompt: "Simulate Bayer pattern sampling and show demosaic artifacts at edges (maze/zipper). Add a tiny 2x2 RGGB inset legend.",
        workflow: "overlay"
      },
      jpegQuantViz: {
        name: "JPEG Quantization Grid",
        emoji: "\u{1F9F1}",
        prompt: "Expose 8\xD78 DCT block boundaries with mild ringing around high-contrast edges; include a miniature luminance quant table.",
        workflow: "overlay"
      },
      exifTelemetry: {
        name: "EXIF Telemetry HUD",
        emoji: "\u{1F4CB}",
        prompt: "Add a minimalist HUD with focal length, f-number, shutter, ISO, and timestamp; use small monospace type and corner alignment.",
        workflow: "overlay"
      }
    },
    "Signal Domain Alchemy": {
      fftPhaseOnly: {
        name: "FFT Phase-Only",
        emoji: "\u{1F4C8}",
        prompt: "Reconstruct the portrait using only Fourier phase with flat magnitude; ghostly but recognizable edges, low-contrast textures."
      },
      fftMagOnly: {
        name: "FFT Magnitude-Only",
        emoji: "\u{1F9EE}",
        prompt: "Render using only Fourier magnitude with randomized phase; produces abstract texture resembling the original energy distribution."
      },
      phaseSwap: {
        name: "Phase Swap",
        emoji: "\u{1F501}",
        prompt: "Keep the subject\u2019s magnitude spectrum but swap in a benign face\u2019s phase; uncanny identity drift with preserved global texture energy."
      },
      waveletBands: {
        name: "Wavelet Band Stack",
        emoji: "\u{1F9F1}",
        prompt: "Decompose into multi-scale wavelet bands; amplify mid-frequency detail, compress low-frequency lighting; show tiny band legend."
      },
      multiresPyramid: {
        name: "Laplacian Pyramid",
        emoji: "\u{1F5FC}",
        prompt: "Blend a Laplacian pyramid with boosted fine layers; crisp pores and hair, controlled halos; annotate pyramid levels subtly."
      },
      bilateralCartoon: {
        name: "Edge-Preserving Cartoon",
        emoji: "\u{1F58D}\uFE0F",
        prompt: "Apply strong bilateral smoothing for flat color regions and sharp edge lines; clean posterized tones without banding."
      },
      anisotropicDiffusion: {
        name: "Anisotropic Diffusion",
        emoji: "\u{1F30A}",
        prompt: "Perform Perona\u2013Malik diffusion: denoise within regions while preserving edges; soft watercolor fields with sharp contours."
      },
      seamCarveWarp: {
        name: "Seam-Carve Warp",
        emoji: "\u{1F9F5}",
        prompt: "Compute saliency seams and subtly remove/insert them; face remains intact while background compresses organically."
      },
      poissonRelight: {
        name: "Poisson Relight",
        emoji: "\u{1F4A1}",
        prompt: "Solve Poisson gradient domain to re-shade with a new light direction; preserve texture, shift global illumination smoothly."
      },
      retinexNormalize: {
        name: "Retinex Normalize",
        emoji: "\u{1F313}",
        prompt: "Apply multi-scale Retinex: even out illumination, expand shadow detail, maintain natural color without HDR halos."
      },
      unsharpFilm80: {
        name: "Unsharp Mask 80s",
        emoji: "\u2702\uFE0F",
        prompt: "Classic darkroom unsharp mask look: tight micro-contrast, slight halo near high-contrast edges, tactile \u201Cprint\u201D sharpness."
      },
      harrisCornersHUD: {
        name: "Harris Corners HUD",
        emoji: "\u{1F53A}",
        prompt: "Overlay corner interest points with tiny crosshair markers and scores; keep base portrait intact underneath."
      },
      cannyInk: {
        name: "Canny Ink",
        emoji: "\u{1F58A}\uFE0F",
        prompt: "Extract Canny edges and blend as vector-like ink lines over soft color fill from the original image."
      },
      voronoiCells: {
        name: "Voronoi Cells",
        emoji: "\u{1F9E9}",
        prompt: "Quantize tones into Voronoi regions with thin cell borders; smaller cells on facial features, larger in background."
      },
      delaunayWire: {
        name: "Delaunay Wireframe",
        emoji: "\u{1F578}\uFE0F",
        prompt: "Triangulate the image into a Delaunay mesh and render as a fine wire overlay; densify around eyes and mouth."
      },
      reactionDiffusionSkin: {
        name: "Reaction-Diffusion",
        emoji: "\u{1F9EA}",
        prompt: "Lay a subtle Gray\u2013Scott reaction-diffusion pattern into midtones; organic micro-patterns that follow facial topology."
      },
      sdfContourMap: {
        name: "SDF Contour Map",
        emoji: "\u{1F5FA}\uFE0F",
        prompt: "Generate signed-distance contours from key features; draw iso-lines with labels (1mm, 2mm) like a topographic face map."
      },
      morphologyGranite: {
        name: "Morphological Granite",
        emoji: "\u{1FAA8}",
        prompt: "Apply alternating morphological opening/closing to create granular, stone-like microtexture while preserving silhouettes."
      },
      poissonDiskStipple: {
        name: "Poisson-Disk Stipple",
        emoji: "\u26AB",
        prompt: "Render with evenly-spaced stipple dots sized by local luminance; denser small dots in shadows, sparse large in highlights."
      },
      grayWorldConstancy: {
        name: "Gray-World Constancy",
        emoji: "\u2696\uFE0F",
        prompt: "Auto white-balance via gray-world assumption; neutralize color cast, modestly compress gamut, scientific calibration vibe."
      }
    },
    "Procedural Manifest": {
      hyperbolic_atrium: {
        name: "Hyperbolic Atrium",
        emoji: "\u267E\uFE0F",
        prompt: "Subject: PBR head projected to Poincar\xE9 disk; facial features compress toward boundary with curvature-based rim brightening. Background: Infinite tessellated atrium (Escher-style) with negative curvature; repeating arches shrink to edge. Camera: Stereographic lens; subtle orbit with non-linear dolly. Lighting: Tri-key in ACEScg; soft dome + thin caustic slashes from curved glass. Post-processing: Filmic shoulder, gentle chroma compression near edges to avoid overload. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      meta_liquid_skin: {
        name: "Meta-Liquid Skin",
        emoji: "\u{1FAE7}",
        prompt: "Subject: BRDF morphs along normals: diffuse\u2192thin-film\u2192liquid metal by curvature; micro-displacement ripples under voice. Background: Dark lab with specular strips and rippled water caustics crawling. Camera: 85mm portrait; slow rack focus to reveal surface state changes. Lighting: Area key + moving spec bars to read liquid micro-waves. Post-processing: Highlight bloom only on thin-film peaks; clamp saturated spectra. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      chronos_slices: {
        name: "Chronos Slices",
        emoji: "\u23F3",
        prompt: "Subject: Head extruded through time into 9 parallel slices; each slice a different material (clay\u2192bronze\u2192chrome). Background: Neutral cyclorama with volumetric dust so slices read in depth. Camera: Lateral dolly; motion blur ON along slice axis. Lighting: Bookend rims to separate slices; low fill. Post-processing: Per-slice LUT micro-grades; soft gate weave. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      retopo_molt: {
        name: "Retopo Molt",
        emoji: "\u{1F578}\uFE0F",
        prompt: "Subject: Quad wireframe peels from the face like a second skin; surfels remain beneath with SSS. Background: Matte void with floor card capturing AO. Camera: 35mm close; slight parallax to show peel thickness. Lighting: Broad soft key; rim for peel silhouette; AO boosted in cavities. Post-processing: Edge-only sharpening on wires; grain retained. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      caustic_projector: {
        name: "Caustic Projector",
        emoji: "\u{1F4A7}",
        prompt: "Subject: Facial detail carved only where refracted caustics land; unlit regions stay clay. Background: Black box with moving refractive panels (choppy glass). Camera: Locked tripod; let caustics do the motion. Lighting: Single hard source through animated prisms; photon caustics ON. Post-processing: High local contrast where caustics strike; zero elsewhere. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      voxel_bokeh: {
        name: "Voxel Bokeh",
        emoji: "\u{1F9CA}",
        prompt: "Subject: Head rasterized into dense translucent voxels; bokeh emerges from voxel density (no standard DoF). Background: Night city HDRI downsampled to blocky light islands. Camera: Long lens; slight breathing as voxel density remaps focus. Lighting: IBL only; spec lobes quantized per voxel layer. Post-processing: Glare derived from voxel density, not luminance. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      drape_identity: {
        name: "Drape Identity",
        emoji: "\u{1FAA1}",
        prompt: "Subject: Ultra-thin cloth sim draped over a hidden head collision mesh; features inferred by tension maps. Background: Studio sweep, faint fans moving cloth. Camera: Macro push-ins on nose/lips ridges. Lighting: Grazing softbox to reveal tension wrinkles; SSS in thin areas. Post-processing: High-frequency detail only from normal-to-albedo bake. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      csg_chapel: {
        name: "CSG Chapel",
        emoji: "\u26EA",
        prompt: "Subject: Face carved via SDF boolean ops (union/intersect/subtract) with architectural voids (nave, arch, oculus). Background: Soft volumetric god-rays through the oculus voids. Camera: Slow crane revealing interior voids. Lighting: Sun shaft + fill cards to read SDF curvature. Post-processing: AO cavity lift; slight vignette to anchor interiors. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      lidar_dust_recon: {
        name: "LiDAR Dust Recon",
        emoji: "\u{1F32B}\uFE0F",
        prompt: "Subject: Portrait reconstructed from animated dust particles locked to a scanned point cloud; density follows normals. Background: Warehouse volume with backlights. Camera: Handheld micro-shake; shallow DOF on point density. Lighting: Back rims + thin volumetrics; spec on dust only. Post-processing: Temporal reprojection ghosting as aesthetic. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      hologrid_parallax: {
        name: "Hologrid Parallax",
        emoji: "\u{1F9E9}",
        prompt: "Subject: Semi-transparent lattice volume encodes the head; parallax reveals form as grid deforms with depth. Background: Matte black with faint ground reflection. Camera: Orbit 20\xB0; grid line weight varies by angle. Lighting: Dual blue/orange rims; zero fill. Post-processing: Specular streaks along grid tangents. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      nonnewtonian_face: {
        name: "Non-Newtonian Face",
        emoji: "\u{1F963}",
        prompt: "Subject: Surface behaves as fluid under beat: hardens at impacts, liquefies at rest; viscoelastic shader. Background: Subwoofer-lit studio with subtle screen shake. Camera: Synchronized micro-punch zooms with the beat. Lighting: Hard spec keys to read phase changes. Post-processing: Beat-synced shutter angle modulation. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      nerf_multiview_ghost: {
        name: "NeRF Ghost",
        emoji: "\u{1F47B}",
        prompt: "Subject: Multi-view \u201Cfloaters\u201D, view-dependent sparkles, mild repro blur on hair; identity coalesces at fronto-parallel. Background: Scan-booth cards and light probes visible (diegetic). Camera: Arc from off-axis to fronto-parallel to \u201Csolve\u201D the face. Lighting: IBL from probe captures; no cheating lights. Post-processing: Keep reconstruction noise\u2014no denoiser. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      mandel_dermis: {
        name: "Fractal Dermis",
        emoji: "\u{1F300}",
        prompt: "Subject: Skin roughness driven by iterated fractal noise; pores align to curvature flow lines. Background: Neutral studio with gray rolls. Camera: Macro glide; shallow DOF on cheek/temple. Lighting: Cross-polarized key/fill to separate spec vs albedo. Post-processing: Micro-contrast boost limited to fractal mask. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      prism_identity: {
        name: "Prism Identity",
        emoji: "\u{1F53A}",
        prompt: "Subject: Three BRDF passes for R/G/B rendered from slightly offset normals, recombined with micro mis-registration. Background: Dark velvet, zero reflections. Camera: Static; let spectral fringes imply motion. Lighting: Single hard white key; dispersion in post allowed. Post-processing: Chromatic aberration that\u2019s physically consistent, not vignette glue. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      },
      papercraft_sections: {
        name: "Papercraft Sections",
        emoji: "\u{1F4D0}",
        prompt: "Subject: Portrait built from stacked contour slices (laser-cut card); edges burnished, slight warps. Background: Drafting table with scale, notes, coffee ring. Camera: Top-down tilt; rack focus across layers. Lighting: Soft top light; AO between slices. Post-processing: Fiber grain only on slice edges. Blending: Use a tight matte (4\u20138px feather, 1\u20132px inward choke) with depth-aware mix."
      }
    }
  },
  "Conceptual & Narrative": {
    "Mixed Styles for front and background": {
      renaissance_x_blueprint: {
        name: "Renaissance \xD7 Blueprint",
        emoji: "\u{1F4D0}",
        prompt: "Subject: Paint the person like a Renaissance portrait with chiaroscuro and oil texture. Background: Technical blueprint sheet with cyan paper, white drafting lines, and faint dimensions. Blend: Feather mask 6\u201310px; cool down shadows to match cyan spill.",
        workflow: "subject-bg-blend"
      },
      marbleStatue_x_neonNoir: {
        name: "Marble Statue \xD7 Neon Noir",
        emoji: "\u{1F3DB}\uFE0F\u{1F303}",
        prompt: "Subject: Carve the person as classical white marble with chisel details and smooth specular. Background: Rainy neon-soaked alley, saturated signage, reflective puddles, cinematic haze. Blend: Rim-light statue with magenta/cyan bounce; keep statue albedo neutral.",
        workflow: "subject-bg-blend"
      },
      anime_x_swissGrid: {
        name: "Anime \xD7 Swiss Grid",
        emoji: "\u{1F363}\u{1F4CF}",
        prompt: "Subject: Photorealistic anime character with glossy eyes and stylized hair highlights. Background: Minimal Swiss International grid in light gray with precise rules and typographic modules. Blend: Tame chroma of subject by 10%; align shoulders to grid baseline.",
        workflow: "subject-bg-blend"
      },
      claymation_x_cyanotype: {
        name: "Claymation \xD7 Cyanotype",
        emoji: "\u{1F9F1}\u{1FAD0}",
        prompt: "Subject: Hand-modeled clay character with fingerprints and soft studio light. Background: Cyanotype wash with brush-edge borders and deep Prussian blue. Blend: Add light blue subsurface scatter to clay to echo cyan wash.",
        workflow: "subject-bg-blend"
      },
      baroqueGold_x_microprint: {
        name: "Baroque Gold \xD7 Microprint",
        emoji: "\u{1F451}\u{1F9F5}",
        prompt: "Subject: Baroque oil portrait with gilded accents and rich fabrics. Background: Security microprint lattice that reads as lines from afar and text up close. Blend: Match gold specular hue to microprint ink; vignette softly.",
        workflow: "subject-bg-blend"
      },
      toonRamp_x_guilloche: {
        name: "Toon Ramp \xD7 Guilloch\xE9",
        emoji: "\u{1F58D}\uFE0F\u{1F300}",
        prompt: "Subject: Cel-shaded face with 3-step lighting and crisp ink outline. Background: Intricate banknote-style guilloch\xE9 rosettes in two inks. Blend: Outline thickness adapts to guilloch\xE9 density; avoid moir\xE9.",
        workflow: "subject-bg-blend"
      },
      holoFoil_x_blackVoid: {
        name: "Holo Foil \xD7 Black Void",
        emoji: "\u{1F3B4}\u26AB",
        prompt: "Subject: Holographic foil material with angle-dependent rainbow diffraction. Background: Pure black infinite void with a soft floor reflection. Blend: Add faint bloom; clamp saturation in deep highlights.",
        workflow: "subject-bg-blend"
      },
      photogrammetry_x_risograph: {
        name: "Photogrammetry \xD7 Riso",
        emoji: "\u{1F9F0}\u{1F7E3}",
        prompt: "Subject: High-poly photogrammetry look with baked albedo/normal and minor seams. Background: Two-color Risograph poster (purple + teal), visible registration offset. Blend: Add paper grain to background only; subtle AO contact under jaw.",
        workflow: "subject-bg-blend"
      },
      chromeLiquid_x_pastelStudio: {
        name: "Liquid Chrome \xD7 Pastel Studio",
        emoji: "\u{1FA9E}\u{1F338}",
        prompt: "Subject: Mirror-like liquid chrome head with crisp HDR reflections. Background: Soft pastel sweep (peach\u2192mint) with studio gradient and no texture. Blend: Use large softbox reflections; maintain clean horizon line.",
        workflow: "subject-bg-blend"
      },
      sciIllustration_x_bokehNight: {
        name: "Scientific Plate \xD7 Night Bokeh",
        emoji: "\u{1F52C}\u{1F30C}",
        prompt: "Subject: Engraved scientific-illustration lines and hatching over accurate anatomy. Background: Defocused city bokeh, warm streetlights, gentle chromatic bloom. Blend: Keep hatching only on subject; don\u2019t ink the bokeh.",
        workflow: "subject-bg-blend"
      },
      wireframe_x_paperCollage: {
        name: "Wireframe \xD7 Paper Collage",
        emoji: "\u{1F578}\uFE0F\u{1F4E6}",
        prompt: "Subject: Clean quad-only retopo wireframe over flat diffuse head. Background: Layered paper collage with torn edges and drop shadows. Blend: Cast a subtle paper shadow from head onto collage layers.",
        workflow: "subject-bg-blend"
      },
      lowPoly_x_gradientField: {
        name: "Low-Poly \xD7 Gradient Field",
        emoji: "\u{1F4C9}\u{1F308}",
        prompt: "Subject: Low-poly bust with flat-shaded facets and simple color planes. Background: Smooth multi-stop gradient with slight film grain. Blend: Add 1px white rim between facets and background for pop.",
        workflow: "subject-bg-blend"
      },
      sepiaTintype_x_dataTape: {
        name: "Tintype \xD7 Data-Tape",
        emoji: "\u{1F9EA}\u{1F4FC}",
        prompt: "Subject: Wet-plate collodion portrait with silver halation and shallow depth. Background: Data-tape UI cues: sequence numbers, timestamp strips, sprocket markers rendered as light deboss. Blend: Keep subject monochrome; background low-contrast neutral.",
        workflow: "subject-bg-blend"
      },
      sssSkin_x_archViz: {
        name: "SSS Skin \xD7 ArchViz",
        emoji: "\u{1FA78}\u{1F3DB}\uFE0F",
        prompt: "Subject: Realistic subsurface-scattered skin with shallow red transmission. Background: Clean architectural interior with soft daylight and AO corners. Blend: White balance globally to daylight; avoid mixed color temps.",
        workflow: "subject-bg-blend"
      },
      legoMinifig_x_blueHour: {
        name: "LEGO \xD7 Blue Hour",
        emoji: "\u{1F9F1}\u{1F535}",
        prompt: "Subject: Plastic minifigure likeness with simple facial print and glossy plastic. Background: Blue-hour city skyline with long-exposure light streaks. Blend: Plastic gets cool rim light; keep highlights unclipped.",
        workflow: "subject-bg-blend"
      },
      charcoalSketch_x_causticGlass: {
        name: "Charcoal \xD7 Caustic Glass",
        emoji: "\u{1FAB5}\u{1F4A7}",
        prompt: "Subject: Charcoal portrait with smudged shading and bold contours. Background: Refracted light caustics dancing on a wall as if through rippled glass. Blend: Let caustics spill a little onto shoulders; keep face matte.",
        workflow: "subject-bg-blend"
      },
      nprInk_x_hyperrealLab: {
        name: "NPR Ink \xD7 Hyperreal Lab",
        emoji: "\u{1F58B}\uFE0F\u2697\uFE0F",
        prompt: "Subject: Brush-ink outlines with minimal washes; expressive but controlled. Background: Hyperreal laboratory bench with stainless, glassware bokeh, and spec highlights. Blend: Slight parallax blur on lab; keep ink edges razor sharp.",
        workflow: "subject-bg-blend"
      },
      hologramHUD_x_concreteWall: {
        name: "Hologram HUD \xD7 Concrete",
        emoji: "\u{1F9ED}\u{1F9F1}",
        prompt: "Subject: Semi-transparent holographic bust with scanlines and depth parallax. Background: Raw concrete wall with form-tie marks and soft top light. Blend: Add ground-plane caustic; include faint HUD ticks around head.",
        workflow: "subject-bg-blend"
      },
      ceramicGlaze_x_forestFog: {
        name: "Ceramic Glaze \xD7 Forest Fog",
        emoji: "\u{1F3FA}\u{1F32B}\uFE0F",
        prompt: "Subject: Glazed ceramic head with subtle crazing and specular anisotropy. Background: Foggy forest with volumetric God rays through trees. Blend: Moisture sheen rim on glaze; desaturate greens slightly.",
        workflow: "subject-bg-blend"
      },
      bronzeBust_x_digitalGrid: {
        name: "Bronze \xD7 Digital Grid",
        emoji: "\u{1F9F1}\u{1F7E6}",
        prompt: "Subject: Patinated bronze bust with worn edges and cavity darkening. Background: Digital wire grid receding in perspective, faint scanlines and glow. Blend: Match key light color to grid tint; keep bronze PBR accurate.",
        workflow: "subject-bg-blend"
      }
    },
    "Documents & Security": {
      FOIA_redact: {
        name: "FOIA Redaction",
        emoji: "\u{1F573}\uFE0F",
        prompt: "Apply heavy rectangular black redaction bars over non-facial regions; add faint copier noise, skewed page crop, and tiny page codes."
      },
      watermark_notary: {
        name: "Notary Watermark",
        emoji: "\u{1FAAA}",
        prompt: "Embed a diagonal semi-transparent NOTARIZED-style watermark with microtext grain and embossed paper fibers."
      },
      microprint_border: {
        name: "Microprint Border",
        emoji: "\u{1F9F5}",
        prompt: "Surround the portrait with a security microprint frame that looks solid at a distance but reveals tiny repeated text on close inspection."
      },
      guilloche_plate: {
        name: "Guilloch\xE9 Plate",
        emoji: "\u{1F300}",
        prompt: "Lay intricate guilloch\xE9 linework behind the subject; thin, interwoven sine rosettes in two inks; precise, anti-aliasing preserved."
      },
      stamp_ink_office: {
        name: "Office Stamp Ink",
        emoji: "\u{1F4ED}",
        prompt: "Add overlapping rubber date stamps in red and violet with slight ghosting, uneven ink, and paper bleed around edges."
      },
      hologram_id: {
        name: "ID Holo Patch",
        emoji: "\u{1FAA9}",
        prompt: "Overlay a rectangular iridescent hologram patch with angle-dependent rainbow diffraction and micro-etched icons."
      },
      ocr_tesseract: {
        name: "OCR Scan Lines",
        emoji: "\u{1F524}",
        prompt: "Simulate a flatbed scan with ruler guides, crop ticks, and OCR text boxes; add faint recognition overlays and character confidence numbers."
      },
      barcode_pdf417: {
        name: "PDF417 Stack",
        emoji: "\u{1F3F7}\uFE0F",
        prompt: "Place a dense PDF417 barcode panel with slight print misregistration; keep it sharp and aligned to a margin."
      },
      qr_overlay: {
        name: "QR Overlay",
        emoji: "\u{1F533}",
        prompt: "Include a crisp QR code tag in a corner with light paper shadow and a tiny \u201CScan to verify\u201D caption in monospace."
      },
      tamper_evident: {
        name: "Tamper-Evident Seal",
        emoji: "\u{1F9F7}",
        prompt: "Add a void-pattern security seal partially peeled, leaving repeating VOID residue; subtle adhesive gloss on paper."
      },
      watermark_latent: {
        name: "Latent Watermark",
        emoji: "\u{1F4A7}",
        prompt: "Embed a near-invisible watermark that appears in highlights at glancing angles; soft paper deformation and dandy roll texture."
      },
      cheque_courtesy: {
        name: "Cheque Courtesy Field",
        emoji: "\u{1F4B6}",
        prompt: "Introduce dotted \u201Ccourtesy amount\u201D boxes, microprint rule lines, and anti-photocopy screened backgrounds under the portrait."
      },
      red_ribbon_seal: {
        name: "Red Ribbon & Seal",
        emoji: "\u{1F397}\uFE0F",
        prompt: "Affix a satin red ribbon crossing a circular embossed seal; add raised-deboss shadows and slight paper buckle."
      },
      blue_ink_signature: {
        name: "Blue Wet Ink",
        emoji: "\u{1F58A}\uFE0F",
        prompt: "Add a blue ballpoint signature with pressure variation, ink pooling on curves, and a faint carbon copy offset."
      },
      docket_header: {
        name: "Court Docket Header",
        emoji: "\u2696\uFE0F",
        prompt: "Place a formal docket header with case number, division, page/line counters; modest serif typography and sober margins."
      },
      postal_cancellation: {
        name: "Postal Cancellation",
        emoji: "\u2709\uFE0F",
        prompt: "Overlay wavy postal cancellation marks and a circular date stamp; slight ink overrun and envelope fiber texture."
      },
      perforation_edge: {
        name: "Perforation Edge",
        emoji: "\u{1F9FB}",
        prompt: "Give the frame a perforated ticket border with torn-paper fuzz, shadowed chads, and subtle deckle irregularity."
      },
      ledger_grid: {
        name: "Ledger Grid",
        emoji: "\u{1F4D2}",
        prompt: "Add a pale green/blue accounting ledger grid behind the subject with row numbers, column headers, and pencil checkmarks."
      },
      uv_security_fluor: {
        name: "UV Security Fibers",
        emoji: "\u{1F526}",
        prompt: "Sprinkle fluorescent security fibers and threads that glow subtly; keep baseline view neutral with hints of UV-reactive specks."
      },
      watermark_diagonal_confidential: {
        name: "CONFIDENTIAL Diagonal",
        emoji: "\u{1F6AB}",
        prompt: "Apply a large, low-opacity CONFIDENTIAL watermark diagonally across; slight paper curl, copier banding, and staple shadow."
      }
    },
    "Cognitive / memory Forensics": {
      eideticAfterimage: {
        name: "Eidetic Afterimage",
        emoji: "\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F",
        prompt: "Overlay a faint complementary-color ghost offset a few pixels from the subject, as if a retinal afterimage persists; keep primary image crisp beneath."
      },
      saccadeTrails: {
        name: "Saccade Trails",
        emoji: "\u{1F407}",
        prompt: "Draw short, semi-transparent motion streaks between fixation points on eyes, mouth, and hands; mimic rapid eye jump traces."
      },
      troxlerFade: {
        name: "Troxler Fade",
        emoji: "\u{1F9CA}",
        prompt: "Let the periphery desaturate and blur into a soft field while the central face remains stable; slow radial falloff with subtle noise."
      },
      binocularRivalry: {
        name: "Binocular Rivalry Split",
        emoji: "\u{1FAE5}",
        prompt: "Divide the portrait into alternating vertical bands where two different color/contrast interpretations \u201Ccompete\u201D; slight temporal flicker implied."
      },
      motionInducedBlindness: {
        name: "Motion-Induced Blindness",
        emoji: "\u{1F573}\uFE0F",
        prompt: "Populate the background with faint rotating dot array; intermittently \u201Cdrop out\u201D small features of the face with gentle fade, as if perception blinks."
      },
      scotomaMask: {
        name: "Scotoma Mask",
        emoji: "\u{1F3AF}",
        prompt: "Place a soft-edged circular blind spot near the fovea region; auto-fill the missing area with locally sampled texture that looks too perfect."
      },
      aphantasiaLowImagery: {
        name: "Aphantasia Low-Imagery",
        emoji: "\u{1F9E0}",
        prompt: "Reduce to clean line drawing with minimal shading and sparse landmark hints; keep proportions right but avoid detail \u201Cmemory.\u201D"
      },
      pareidoliaClouds: {
        name: "Pareidolia Emergence",
        emoji: "\u2601\uFE0F",
        prompt: "Let facial features subtly form from cloud-like textures and marble veins; avoid crisp edges until key features lock into place."
      },
      confabulationFill: {
        name: "Confabulation Fill",
        emoji: "\u{1F9E9}",
        prompt: "Where data is missing, invent plausible but wrong details: mismatched earrings, asymmetric stitching; annotate tiny \u26A0 markers at invented zones."
      },
      flashbulbMemory: {
        name: "Flashbulb Memory",
        emoji: "\u26A1",
        prompt: "High-contrast, slightly overexposed \u201Csnapshot\u201D with strong vignette and period color cast; stamp a precise datetime in small type."
      },
      repressionRedactions: {
        name: "Repression Redactions",
        emoji: "\u{1F5C2}\uFE0F",
        prompt: "Apply semi-opaque gray rectangles over emotionally charged regions; surrounding zones blur and desaturate as if avoided."
      },
      dreamSeam: {
        name: "Dream Seam",
        emoji: "\u{1F6CF}\uFE0F",
        prompt: "Stitch the portrait from mismatched patches with visible seams and inconsistent light directions; add faint handwritten dream notes on the edges."
      },
      memoryPalaceCards: {
        name: "Memory Palace Cards",
        emoji: "\u{1F3DB}\uFE0F",
        prompt: "Pin small index cards around the subject with keywords and arrows; each card has paper texture and typewriter font, no extra props."
      },
      tipOfTongue: {
        name: "Tip-of-the-Tongue",
        emoji: "\u{1F445}",
        prompt: "Mask one crucial feature with translucent question-mark glyphs; keep edges sharp elsewhere; add a low-opacity glossary sidebar."
      },
      dejaVuTiling: {
        name: "D\xE9j\xE0 Vu Tiling",
        emoji: "\u267B\uFE0F",
        prompt: "Repeat small patches (hair, skin, background) as subtle tessellations; align repeats imperfectly to feel eerily familiar."
      },
      migraineAura: {
        name: "Migraine Aura",
        emoji: "\u{1F308}",
        prompt: "Superimpose shimmering zigzag scotoma arcs and prismatic fringes near one visual quadrant; base image slightly dimmed underneath."
      },
      changeBlindnessDiptych: {
        name: "Change Blindness",
        emoji: "\u{1F501}",
        prompt: "Render two almost-identical overlays toggled in halves; annotate a tiny legend noting 3\u20135 micro-changes (earring missing, collar flipped)."
      },
      emotionalSalienceMap: {
        name: "Emotional Salience Map",
        emoji: "\u{1F493}",
        prompt: "Heatmap only where the viewer likely feels emotion (eyes, mouth, hands); cool elsewhere; add a minimalist color bar with \u201Clow\u2192high.\u201D"
      },
      reminiscenceBump: {
        name: "Reminiscence Bump",
        emoji: "\u{1F39E}\uFE0F",
        prompt: "Blend the portrait with a faint era-specific film stock from ages 10\u201330; add soft vignettes and a period-typography caption strip."
      },
      forgettingCurve: {
        name: "Forgetting Curve Overlay",
        emoji: "\u{1F4C9}",
        prompt: "Fade detail exponentially from center outward with labeled iso-lines t=1m, 1h, 1d, 1w; keep eyes and mouth least faded."
      }
    },
    "Narrative Artifacts": {
      mythCartographer: {
        name: "Myth Cartographer",
        emoji: "\u{1F5FA}\uFE0F",
        prompt: "Interpret the portrait as a lost myth map. Etch faint routes across the skin, place legend symbols at moles and scars, and add a tiny compass that points to an invented homeland."
      },
      embassyOfDreams: {
        name: "Embassy of Dreams",
        emoji: "\u{1F6C2}",
        prompt: "Render the image as a visa issued by the dream world: stamped entries, dream-duration fields, and a hologram of last night\u2019s weather. Keep the face as the passport photo, slightly misregistered."
      },
      ghostOfProvenance: {
        name: "Ghost of Provenance",
        emoji: "\u{1F4DC}",
        prompt: "Treat the photo like an artifact with a messy ownership trail. Layer auction stickers, curator notes in soft pencil, and a torn customs label. Show delicate tape ghosts where labels once were."
      },
      oralHistoryWeave: {
        name: "Oral History Weave",
        emoji: "\u{1F9F6}",
        prompt: "Overlay translucent \u201Cquotes\u201D from imaginary witnesses around the subject, each tied by threadlike lines to features they mention. Keep typography modest and archival."
      },
      bureaucraticHaunting: {
        name: "Bureaucratic Haunting",
        emoji: "\u{1F3DB}\uFE0F",
        prompt: "Make the portrait look processed by an extinct ministry: redactions that reveal more than they hide, obsolete seals, and a motto in a language that nearly matches but isn\u2019t quite."
      },
      speculativeAutopsy: {
        name: "Speculative Autopsy",
        emoji: "\u{1FA7B}",
        prompt: "Annotate the face like a forensic diagram for an emotion that never had a body. Fine leader lines, invented latinate labels, marginalia about causes and rituals."
      },
      climateMuseumLabel: {
        name: "Climate Museum Label",
        emoji: "\u{1F321}\uFE0F",
        prompt: "Display the portrait as an exhibit from a warmer future. Add a wall label with era, material, and \u201Cobserved behavior,\u201D plus faint salt bloom and micro-cracks from unstable humidity."
      },
      folkRemedyPoster: {
        name: "Folk Remedy Poster",
        emoji: "\u{1F33F}",
        prompt: "Turn the image into a village notice teaching a remedy for sorrow. Hand-drawn diagrams over the face, herbal icons, prices in beans, and a tear-off fringe of blessings."
      },
      archiveLeak: {
        name: "Archive Leak",
        emoji: "\u{1F5C4}\uFE0F",
        prompt: "Simulate a misfiled dossier sheet: photocopied portrait, margin arrows, timestamps that contradict each other, and a faded stapled Post-it with an unhelpful clue."
      },
      ritualCalibration: {
        name: "Ritual Calibration",
        emoji: "\u{1F56F}\uFE0F",
        prompt: "Treat the portrait as a device that requires ritual alignment. Draw small tick marks at eyes and lips, candles-as-calibration icons, and a \u201Clast aligned\u201D date in lunar notation."
      },
      lichenReader: {
        name: "Lichen Reader",
        emoji: "\u{1FAA8}",
        prompt: "Let patterns grow over the image like urban lichens\u2014reading time, stress, and weather. Keep face visible; growth forms act as subtitles of lived conditions."
      },
      borderlandBallad: {
        name: "Borderland Ballad",
        emoji: "\u{1F3BB}",
        prompt: "Frame the portrait with handwritten song verses in two dialects that translate each other poorly. Leave deliberate disagreements in meaning; underline where translation fails."
      },
      planetOfArchives: {
        name: "Planet of Archives",
        emoji: "\u{1FA90}",
        prompt: "Imagine the background as stacks of geological strata made of documents. Each layer carries a tiny card summarizing what the face \u201Cmeant\u201D that century."
      },
      tenderPropaganda: {
        name: "Tender Propaganda",
        emoji: "\u{1F4E2}",
        prompt: "Design a soft, caring propaganda poster about being human. Pastel gradients, small promises in the margins, and a seal of a fictive ministry of gentleness."
      },
      counterfeitMemory: {
        name: "Counterfeit Memory",
        emoji: "\u{1F4B3}",
        prompt: "Issue the image as a \u201Cmemory credit card.\u201D Add EMV-like contacts, microtext of childhood smells, and a spending limit measured in forgiven mistakes."
      },
      fieldNotesFromTomorrow: {
        name: "Field Notes from Tomorrow",
        emoji: "\u{1F4DD}",
        prompt: "Overlay a scientist\u2019s notebook from five years ahead describing the subject in cautious, kind language. Include sketched thumbnails of alternate futures in the margin."
      },
      saintOfSmallActs: {
        name: "Saint of Small Acts",
        emoji: "\u{1F54A}\uFE0F",
        prompt: "Canonize the person as a minor saint of mundane kindness. Add tiny ex-votos (bus tickets, safety pins), a gold leaf halo made from transit maps, and a calendar feast day."
      },
      rumorAtlas: {
        name: "Rumor Atlas",
        emoji: "\u{1F9ED}",
        prompt: "Map rumors as isobands around the face. Warm colors = tender rumors; cool colors = sharp rumors. Place a tiny scale bar labeled \u201Cgossip per meter.\u201D"
      },
      edibleIcon: {
        name: "Edible Icon",
        emoji: "\u{1F96F}",
        prompt: "Render the portrait as if printed on edible paper for a neighborhood bakery holiday. Include a recipe on the back, visible as a ghost through the sheet."
      },
      futureArcheologyKit: {
        name: "Future Archaeology Kit",
        emoji: "\u26CF\uFE0F",
        prompt: "Package the image like a specimen: foam cutout cradle, accession number, silica gel, and a booklet explaining how to excavate the subject\u2019s habits without breaking them."
      }
    },
    "Constraint-Bent Portrait Protocols": {
      causalityFold: {
        name: "Causality Fold",
        emoji: "\u23EA",
        prompt: "Animate the portrait so shading and shadows update from T+1 back toward T, leaving faint temporal \u201Cunupdates.\u201D Hair motion reverses before the head moves; reflections show the next frame."
      },
      observerBias: {
        name: "Observer Bias",
        emoji: "\u{1F9FF}",
        prompt: "Increase resolution and material fidelity only in peripheral vision; the center of gaze remains slightly under-detailed. As the viewer looks away, features sharpen where they are not looking."
      },
      conservationOfSilhouette: {
        name: "Conservation of Silhouette",
        emoji: "\u2712\uFE0F",
        prompt: "No operation may change the outer silhouette. Lighting, micro-displacement, and materials may morph wildly, but the external contour is preserved; the background absorbs any \u201Cforbidden\u201D expansion as inward dents."
      },
      topologyBudget: {
        name: "Topology Budget",
        emoji: "\u{1F4C9}",
        prompt: "Face must render with a hard cap on total edges. When detail exceeds the budget, edges are auctioned away: pores fuse, nostrils decimate, cheekbones pixelate into flat facets; wireframe labels show which edges were \u201Csold.\u201D"
      },
      entropyDrip: {
        name: "Entropy Drip",
        emoji: "\u{1FAD7}",
        prompt: "Image entropy must increase over time unless \u201Cremember\u201D events occur. Without interaction, textures smear, UVs stretch, and normals dephase. On clicks or beats, crispness is restored in concentric rings."
      },
      wavefunctionFace: {
        name: "Wavefunction Face",
        emoji: "\u{1F52C}",
        prompt: "Materials are probabilistic per-pixel (skin 60%, ceramic 30%, chrome 10%). The map collapses to a single material only when the viewer hovers or looks directly; elsewhere it remains a dithered superposition."
      },
      counterfactualReflections: {
        name: "Counterfactual Reflections",
        emoji: "\u{1FA9E}",
        prompt: "All reflective and refractive contributions are rendered from a plausible alternate timeline: the reflection smiles when the subject is neutral, blinks when eyes are open, etc. Direct lighting stays truthful."
      },
      negotiatedLighting: {
        name: "Negotiated Lighting",
        emoji: "\u{1F91D}",
        prompt: "Background and subject \u201Cnegotiate\u201D photon budget each frame. If the background brightens by 1 EV, the subject dims proportionally, maintaining a constant global exposure; a tiny HUD shows the bargaining result."
      },
      borrowedAlbedo: {
        name: "Borrowed Albedo",
        emoji: "\u{1F3A8}",
        prompt: "Subject\u2019s albedo must be sampled from the background only (no native color). Skin tones become reprojected patches of wall, floor, signage; geometry stays accurate but color is diegetic collage."
      },
      vetoedSpecular: {
        name: "Vetoed Specular",
        emoji: "\u{1F6AB}",
        prompt: "Specular highlights only render on beats not divisible by 3 (or on frames where frameIndex % 6 \u2208 {1,2}). On vetoed frames, specular is clamped to diffuse; produces strobing \u201Ctruth windows\u201D in gloss."
      },
      scafFold: {
        name: "Self-Proof Mesh",
        emoji: "\u{1F4D0}",
        prompt: "Wireframe annotates itself with micro-lemmas: each edge prints the rule justifying its existence (crease, curvature, silhouette, seam). Edges without proof fade out until topology re-justifies them."
      },
      depthTax: {
        name: "Depth Tax",
        emoji: "\u{1F4B8}",
        prompt: "Every centimeter behind the focal plane costs \u201Cdepth credits.\u201D When the budget is exceeded, far geometry collapses to billboards; near geometry gains tessellation and SSS. The tax HUD shows current spend."
      },
      antiAliasOath: {
        name: "Anti-Alias Oath",
        emoji: "\u{1F9F5}",
        prompt: "Edges cannot exhibit shimmer. To obey, the renderer snaps subpixel motion to a rational grid; micro-jitter is redirected to the background as grain. Motion looks smoothly quantized, like oath-bound AA."
      },
      puncturedNormals: {
        name: "Punctured Normals",
        emoji: "\u{1F573}\uFE0F",
        prompt: "Normal vectors are forbidden in a masked region (e.g., a ring across the cheeks). In that band the surface renders only from curvature and AO; specular disappears and forms look embossed, almost paper-cut."
      },
      auctionedShadows: {
        name: "Auctioned Shadows",
        emoji: "\u{1FA99}",
        prompt: "Every shadow ray must be purchased. The most \u201Cvaluable\u201D shadows (under nostrils, eye sockets) win the auction; low-value soft shadows fail to render and are replaced by pale placeholders with price tags."
      },
      parallaxDebate: {
        name: "Parallax Debate",
        emoji: "\u{1F5E3}\uFE0F",
        prompt: "Background and subject disagree about camera parallax by a small epsilon. As the camera moves, the subject\u2019s depth cues lead slightly; the background lags, causing intentional micro-parallax dissonance."
      },
      memoryLeakSSS: {
        name: "Memory Leak SSS",
        emoji: "\u{1FA78}",
        prompt: "Subsurface scattering radius increases monotonically in regions the viewer stares at, as if \u201Cheat\u201D accumulates. Look away and the radius cools back slowly, leaving ghostly warmth trails in ears and nose."
      },
      centroidHandoff: {
        name: "Centroid Handoff",
        emoji: "\u{1F3C3}",
        prompt: "Each frame, a random facial region becomes the \u201Ccentroid owner.\u201D Only that region may move the head\u2019s root transform; everything else must compensate locally. Produces peculiar, believable micro-adjustments."
      },
      silentCollision: {
        name: "Silent Collision",
        emoji: "\u{1F507}",
        prompt: "Collisions do not resolve with impulses; instead, interpenetrations are silently \u201Cpainted over\u201D by borrowing nearby albedo and normals, as if reality covers its mistakes. Works eerily well until the camera rakes across."
      }
    },
    "What If...": {
      whatIf_authenticityOutlawed: {
        name: "What if authenticity is illegal?",
        emoji: "\u2696\uFE0F",
        prompt: "Render the portrait only via certified proxies: watermark chains, notarized overlays, and compliance margins. Any uncited region must blur or redact itself. Show a provenance sidebar that contradicts one entry."
      },
      whatIf_faceAsPublicUtility: {
        name: "What if the face is public infrastructure?",
        emoji: "\u{1F687}",
        prompt: "Overlay transit-like schematics across features (service lines for gaze, speech, breath). Mark outages and maintenance windows. Background signage uses neutral civic typography; no branding."
      },
      whatIf_memoryRequiresQuorum: {
        name: "What if memory needs a quorum?",
        emoji: "\u{1F5F3}\uFE0F",
        prompt: "Every detail appears only if three independent \u201Cwitness annotations\u201D agree. Disagreements render as grayscale placeholders with tally marks and confidence intervals."
      },
      whatIf_colorBudget: {
        name: "What if color has a budget?",
        emoji: "\u{1F4B8}\u{1F3A8}",
        prompt: "Assign a strict chroma quota to the image. Spend saturation on the most semantically loaded regions; elsewhere, tones desaturate to near-neutral. Display a small color-ledger with remaining credit."
      },
      whatIf_backgroundOwnsNarrative: {
        name: "What if the background owns the story?",
        emoji: "\u{1F4DA}",
        prompt: "Keep the subject materially plain (matte clay). Shift all metadata, captions, and temporal events into the background: wall notes, taped receipts, light stains indicating prior scenes."
      },
      whatIf_translationIsLossy: {
        name: "What if translation must lose information?",
        emoji: "\u{1F501}",
        prompt: "Render bilingual captions where each language drops a different 12% of meaning. Missing content becomes faint geometric placeholders anchored to the face regions it would have described."
      },
      whatIf_lawAsRecipe: {
        name: "What if law compiles to recipes?",
        emoji: "\u{1F4DC}\u{1F372}",
        prompt: "Express compliance as kitchen operations mapped to facial areas (sift, fold, proof). Add a structured footer: statute \u2192 operation \u2192 outcome, with one deliberate mismatch."
      },
      whatIf_privacyIsSpatial: {
        name: "What if privacy is a physical distance?",
        emoji: "\u{1F4CF}",
        prompt: "Encode \u201Cprivacy radius\u201D as depth: regions within R render sharp; outside, features self-abstract to coarse primitives. Draw the radius as a thin measure ring with tick marks."
      },
      whatIf_ecologyCoauthors: {
        name: "What if ecology co-authors?",
        emoji: "\u{1FAB2}",
        prompt: "Let non-human agents introduce legible edits: lichen edge maps on hairlines, fungal gradients in shadow, insect bite perforations that reveal a second, older print beneath."
      },
      whatIf_receiptsForFeeling: {
        name: "What if feelings issue receipts?",
        emoji: "\u{1F9FE}",
        prompt: "Attach a thermal receipt listing events the image charges you for (attention, care, avoidance) with line-item totals. The receipt must cast a shadow; totals never exactly reconcile with the portrait."
      },
      whatIf_reflectionIsSovereign: {
        name: "What if reflections refuse compliance?",
        emoji: "\u{1FA9E}",
        prompt: "Mirrors and glossy surfaces render their own timeline. Keep direct light truthful; render specular channels from a slightly divergent pose and expression. Annotate delta as a small vector field."
      },
      whatIf_timeAsAxis: {
        name: "What if time runs left\u2192right?",
        emoji: "\u23F3\u27A1\uFE0F",
        prompt: "Age gradients map horizontally across the face. Background signage shows datelines increasing to the right. Shadows shear accordingly; do not use crossfades."
      },
      whatIf_rumorErodesMatter: {
        name: "What if rumor erodes matter?",
        emoji: "\u{1F5E3}\uFE0F\u26F0\uFE0F",
        prompt: "Weather the surface proportionally to \u201Ccirculation.\u201D Highly discussed regions pit and flake; unspoken areas remain sharp. Include a small scale: mm lost per thousand mentions."
      },
      whatIf_archiveResistsReading: {
        name: "What if archives resist being read?",
        emoji: "\u{1F5C4}\uFE0F",
        prompt: "Paper fibers dodge OCR: lines twist slightly when scanned; redactions leak gentler paraphrases in the margins. Keep one visible staple shadow with missing staple."
      },
      whatIf_identityLeased: {
        name: "What if identity is leased, not owned?",
        emoji: "\u{1F511}",
        prompt: "Stamp lease terms onto the portrait frame (duration, scope, penalties). Expired features gray out with \u201Crevert to default\u201D texture; active regions keep color."
      },
      whatIf_gravityIsAttention: {
        name: "What if gravity follows attention?",
        emoji: "\u{1F9F2}",
        prompt: "Areas receiving viewer focus physically sag and crease; ignored regions float and simplify. Provide a minimal attention HUD with current \u201Cpull\u201D values."
      }
    }
  }
};

// src/lib/utils.js
var parseMultiStepPrompt = (prompt) => {
  if (typeof prompt !== "string") return null;
  const subjectMatch = prompt.match(/Subject:(.*?)(?=Background:|$)/s);
  const backgroundMatch = prompt.match(/Background:(.*?)(?=Blend:|$)/s);
  const blendMatch = prompt.match(/Blend:(.*)/s);
  if (subjectMatch && backgroundMatch && blendMatch) {
    return {
      subject: subjectMatch[1].trim(),
      background: backgroundMatch[1].trim(),
      blend: blendMatch[1].trim()
    };
  }
  return null;
};

// src/lib/workflows.js
var workflows = {
  "subject-bg-blend": async ({ gen, model, base64, prompt }) => {
    const parts = parseMultiStepPrompt(prompt);
    if (!parts) {
      throw new Error("Invalid prompt for subject-bg-blend workflow. Missing Subject, Background, or Blend section.");
    }
    const subjectCut = await gen({
      model,
      prompt: "SEGMENT the person. Output a PNG with transparent background (alpha). Preserve fine hair detail with anti-aliased edges. No background, no text.",
      inputFile: base64
    });
    const styledSubject = await gen({
      model,
      prompt: `STYLE the subject (keep alpha; do not add a background): ${parts.subject}. Keep identity, pose, silhouette. Avoid skin plasticity and heavy smoothing.`,
      inputFile: subjectCut
    });
    return await gen({
      model,
      prompt: `COMPOSITE the input subject (with alpha) onto a new background: BACKGROUND: "${parts.background}". BLEND RULES: "${parts.blend}". Match perspective and light; add believable ground contact shadows and subtle rim light; return final PNG (no text).`,
      inputFile: styledSubject
    });
  },
  "grade-only": async ({ gen, model, base64, prompt }) => {
    return await gen({
      model,
      prompt: `Color grade only, no geometry changes. ${prompt}`,
      inputFile: base64
    });
  },
  "overlay": async ({ gen, model, base64, prompt }) => {
    return await gen({
      model,
      prompt: `Overlay only (non-destructive). ${prompt}`,
      inputFile: base64
    });
  }
};

// src/lib/archiva/templates.js
import { Type as Type2 } from "@google/genai";
var templates = {
  Study_Archive: {
    name: "Study Archive",
    type: "Reflective",
    purpose: "Track what you\u2019ve learned over time",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "title", label: "Title", field_type: "string", required: true },
      { field_key: "learning_outcomes", label: "Learning Outcomes", field_type: "markdown", required: false },
      { field_key: "artifacts_references", label: "Artifacts / References", field_type: "markdown", required: false },
      { field_key: "reflection", label: "Reflection", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Process_Journal: {
    name: "Process Journal",
    type: "Reflective",
    purpose: "Chronicle project progress and iteration",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "session", label: "Session", field_type: "string", required: true },
      { field_key: "title", label: "Title", field_type: "string", required: true },
      { field_key: "summary_of_progress", label: "1. Summary of Progress", field_type: "markdown", required: false },
      { field_key: "iteration_notes", label: "2. Iteration Notes", field_type: "markdown", required: false },
      { field_key: "critique_feedback", label: "3. Critique & Feedback", field_type: "markdown", required: false },
      { field_key: "blockers_challenges", label: "4. Blockers & Challenges", field_type: "markdown", required: false },
      { field_key: "action_items_next_steps", label: "5. Action Items / Next Steps", field_type: "markdown", required: false },
      { field_key: "artifacts_references", label: "6. Artifacts & References", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "7. Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Learning_Lab: {
    name: "Learning Lab",
    type: "Reflective",
    purpose: "Run structured mini-experiments",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "experiment_name", label: "Experiment Name", field_type: "string", required: true },
      { field_key: "objective", label: "Objective", field_type: "string", required: true },
      { field_key: "hypothesis", label: "Hypothesis", field_type: "markdown", required: false },
      { field_key: "setup_method", label: "Setup & Method", field_type: "markdown", required: false },
      { field_key: "observations_outcomes", label: "Observations & Outcomes", field_type: "markdown", required: false },
      { field_key: "analysis", label: "Analysis", field_type: "markdown", required: false },
      { field_key: "conclusions_lessons_learned", label: "Conclusions & Lessons Learned", field_type: "markdown", required: false },
      { field_key: "next_steps_follow-up_experiments", label: "Next Steps / Follow-Up Experiments", field_type: "markdown", required: false },
      { field_key: "artifacts_references", label: "Artifacts & References", field_type: "code", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Design_Sketchbook: {
    name: "Design Sketchbook",
    type: "Reflective",
    purpose: "Explore visual styles and interface ideas",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "concept_focus", label: "Concept / Focus", field_type: "string", required: true },
      { field_key: "moodboard_inspiration", label: "Moodboard & Inspiration", field_type: "markdown", required: false },
      { field_key: "wireframes_layouts", label: "Wireframes & Layouts", field_type: "markdown", required: false },
      { field_key: "annotations_feedback", label: "Annotations & Feedback", field_type: "markdown", required: false },
      { field_key: "iteration_notes", label: "Iteration Notes", field_type: "markdown", required: false },
      { field_key: "next_concepts_to_try", label: "Next Concepts to Try", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Code_Notebook: {
    name: "Code Notebook",
    type: "Reflective",
    purpose: "Save useful code with context",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "title", label: "Title", field_type: "string", required: true },
      { field_key: "problem_context", label: "Problem / Context", field_type: "markdown", required: false },
      { field_key: "code_snippet", label: "Code Snippet", field_type: "code", required: false },
      { field_key: "explanation", label: "Explanation", field_type: "markdown", required: false },
      { field_key: "usage", label: "Usage", field_type: "markdown", required: false },
      { field_key: "references", label: "References", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Practice_Log: {
    name: "Practice Log",
    type: "Reflective",
    purpose: "Document completed challenges",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "challenge", label: "Challenge", field_type: "string", required: true },
      { field_key: "difficulty", label: "Difficulty", field_type: "string", required: true },
      { field_key: "duration", label: "Duration", field_type: "string", required: true },
      { field_key: "description", label: "Description", field_type: "markdown", required: false },
      { field_key: "solution", label: "Solution", field_type: "code", required: false },
      { field_key: "outcome_reflection", label: "Outcome & Reflection", field_type: "markdown", required: false },
      { field_key: "next_steps", label: "Next Steps", field_type: "markdown", required: false },
      { field_key: "references", label: "References", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Field_Notes: {
    name: "Field Notes",
    type: "Reflective",
    purpose: "Collect insights from the world",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "location", label: "Location", field_type: "string", required: true },
      { field_key: "context", label: "Context", field_type: "string", required: true },
      { field_key: "observation", label: "Observation", field_type: "markdown", required: false },
      { field_key: "details_artifacts", label: "Details & Artifacts", field_type: "markdown", required: false },
      { field_key: "insights_interpretation", label: "Insights & Interpretation", field_type: "markdown", required: false },
      { field_key: "actions_next_steps", label: "Actions / Next Steps", field_type: "markdown", required: false },
      { field_key: "references", label: "References", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Explorations: {
    name: "Explorations",
    type: "Reflective",
    purpose: "Keep open-ended or curiosity-driven tests",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "title", label: "Title", field_type: "string", required: true },
      { field_key: "concept_inspiration", label: "Concept & Inspiration", field_type: "markdown", required: false },
      { field_key: "steps_taken", label: "Steps Taken", field_type: "markdown", required: false },
      { field_key: "observations", label: "Observations", field_type: "markdown", required: false },
      { field_key: "reflections", label: "Reflections", field_type: "markdown", required: false },
      { field_key: "next_explorations", label: "Next Explorations", field_type: "markdown", required: false },
      { field_key: "artifacts", label: "Artifacts", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Research_and_Prototypes: {
    name: "Research & Prototypes",
    type: "Reflective",
    purpose: "Connect theory with practice",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "topic_question", label: "Topic / Question", field_type: "string", required: true },
      { field_key: "background_motivation", label: "Background & Motivation", field_type: "markdown", required: false },
      { field_key: "research_summary", label: "Research Summary", field_type: "markdown", required: false },
      { field_key: "prototype_details", label: "Prototype Details", field_type: "markdown", required: false },
      { field_key: "results_observations", label: "Results & Observations", field_type: "markdown", required: false },
      { field_key: "analysis_insights", label: "Analysis & Insights", field_type: "markdown", required: false },
      { field_key: "next_steps", label: "Next Steps", field_type: "markdown", required: false },
      { field_key: "artifacts", label: "Artifacts", field_type: "code", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Experiments: {
    name: "Experiments",
    type: "Technical",
    purpose: "Test hypotheses with code",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "experiment_name", label: "Experiment Name", field_type: "string", required: true },
      { field_key: "hypothesis", label: "Hypothesis", field_type: "markdown", required: false },
      { field_key: "setup", label: "Setup", field_type: "markdown", required: false },
      { field_key: "code_execution", label: "Code & Execution", field_type: "code", required: false },
      { field_key: "results", label: "Results", field_type: "markdown", required: false },
      { field_key: "analysis", label: "Analysis", field_type: "markdown", required: false },
      { field_key: "next_iterations", label: "Next Iterations", field_type: "markdown", required: false },
      { field_key: "artifacts", label: "Artifacts", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Sandbox: {
    name: "Sandbox",
    type: "Technical",
    purpose: "Try out wild ideas without pressure",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "project_experiment", label: "Project / Experiment", field_type: "string", required: true },
      { field_key: "overview", label: "Overview", field_type: "markdown", required: false },
      { field_key: "setup", label: "Setup", field_type: "markdown", required: false },
      { field_key: "steps_explorations", label: "Steps & Explorations", field_type: "markdown", required: false },
      { field_key: "observations", label: "Observations", field_type: "markdown", required: false },
      { field_key: "reflection", label: "Reflection", field_type: "markdown", required: false },
      { field_key: "links_artifacts", label: "Links & Artifacts", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Dev_Diaries: {
    name: "Dev Diaries",
    type: "Technical",
    purpose: "Log development progress and learning",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "sprint_week", label: "Sprint/Week", field_type: "string", required: true },
      { field_key: "feature_module", label: "Feature/Module", field_type: "string", required: true },
      { field_key: "summary_of_work", label: "Summary of Work", field_type: "markdown", required: false },
      { field_key: "challenges_resolutions", label: "Challenges & Resolutions", field_type: "markdown", required: false },
      { field_key: "learnings_takeaways", label: "Learnings & Takeaways", field_type: "markdown", required: false },
      { field_key: "next_goals", label: "Next Goals", field_type: "markdown", required: false },
      { field_key: "artifacts_references", label: "Artifacts & References", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Prototypes: {
    name: "Prototypes",
    type: "Technical",
    purpose: "Build fast, test fast",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "prototype_name", label: "Prototype Name", field_type: "string", required: true },
      { field_key: "objective", label: "Objective", field_type: "markdown", required: false },
      { field_key: "tools_setup", label: "Tools & Setup", field_type: "markdown", required: false },
      { field_key: "prototype_description", label: "Prototype Description", field_type: "markdown", required: false },
      { field_key: "quick_demo", label: "Quick Demo", field_type: "markdown", required: false },
      { field_key: "feedback_observations", label: "Feedback & Observations", field_type: "markdown", required: false },
      { field_key: "next_steps", label: "Next Steps", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Code_Studies: {
    name: "Code Studies",
    type: "Technical",
    purpose: "Deep-dive into how things are built",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "subject", label: "Subject", field_type: "string", required: true },
      { field_key: "overview_purpose", label: "Overview & Purpose", field_type: "markdown", required: false },
      { field_key: "structure_analysis", label: "Structure Analysis", field_type: "markdown", required: false },
      { field_key: "key_patterns_architectures", label: "Key Patterns & Architectures", field_type: "markdown", required: false },
      { field_key: "code_walkthrough", label: "Code Walkthrough", field_type: "code", required: false },
      { field_key: "performance_scalability", label: "Performance & Scalability", field_type: "markdown", required: false },
      { field_key: "contrast_comparison", label: "Contrast & Comparison", field_type: "markdown", required: false },
      { field_key: "takeaways_applications", label: "Takeaways & Applications", field_type: "markdown", required: false },
      { field_key: "references", label: "References", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Playground: {
    name: "Playground",
    type: "Technical",
    purpose: "Code for fun",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "title", label: "Title", field_type: "string", required: true },
      { field_key: "idea_prompt", label: "Idea / Prompt", field_type: "markdown", required: false },
      { field_key: "code_experimentation", label: "Code & Experimentation", field_type: "code", required: false },
      { field_key: "outcomes_observations", label: "Outcomes & Observations", field_type: "markdown", required: false },
      { field_key: "reflection", label: "Reflection", field_type: "markdown", required: false },
      { field_key: "next_adventures", label: "Next Adventures", field_type: "markdown", required: false },
      { field_key: "artifacts", label: "Artifacts", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Snippets_and_Sketches: {
    name: "Snippets & Sketches",
    type: "Technical",
    purpose: "Reusable mini code blocks",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "title", label: "Title", field_type: "string", required: true },
      { field_key: "snippet_sketch", label: "Snippet / Sketch", field_type: "code", required: false },
      { field_key: "context_usage", label: "Context & Usage", field_type: "markdown", required: false },
      { field_key: "notes_explanation", label: "Notes & Explanation", field_type: "markdown", required: false },
      { field_key: "refactor_ideas", label: "Refactor Ideas", field_type: "markdown", required: false },
      { field_key: "references", label: "References", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Iterations: {
    name: "Iterations",
    type: "Technical",
    purpose: "Show the evolution of an idea",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "project_feature", label: "Project / Feature", field_type: "string", required: true },
      { field_key: "version_comparison", label: "Version Comparison", field_type: "markdown", required: false },
      { field_key: "decision_log", label: "Decision Log", field_type: "markdown", required: false },
      { field_key: "artifacts", label: "Artifacts", field_type: "markdown", required: false },
      { field_key: "lessons_learned", label: "Lessons Learned", field_type: "markdown", required: false },
      { field_key: "next_iterations", label: "Next Iterations", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Studio_Scraps: {
    name: "Studio Scraps",
    type: "Creative",
    purpose: "Archive rejected or rough ideas",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "project_concept", label: "Project / Concept", field_type: "string", required: true },
      { field_key: "scrap_description", label: "Scrap Description", field_type: "markdown", required: false },
      { field_key: "reason_for_rejection", label: "Reason for Rejection", field_type: "markdown", required: false },
      { field_key: "artifacts", label: "Artifacts", field_type: "markdown", required: false },
      { field_key: "lessons_learned", label: "Lessons Learned", field_type: "markdown", required: false },
      { field_key: "potential_revival", label: "Potential Revival", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  WIP_Work_In_Progress: {
    name: "WIP (Work In Progress)",
    type: "Creative",
    purpose: "Share early or ongoing projects",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "project", label: "Project", field_type: "string", required: true },
      { field_key: "status", label: "Status", field_type: "string", required: true },
      { field_key: "overview", label: "Overview", field_type: "markdown", required: false },
      { field_key: "current_progress", label: "Current Progress", field_type: "markdown", required: false },
      { field_key: "challenges_open_questions", label: "Challenges & Open Questions", field_type: "markdown", required: false },
      { field_key: "next_milestones", label: "Next Milestones", field_type: "markdown", required: false },
      { field_key: "assets_links", label: "Assets & Links", field_type: "markdown", required: false },
      { field_key: "notes", label: "Notes", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Things_I_Tried: {
    name: "Things I Tried",
    type: "Creative",
    purpose: "Showcase one-shot or trial experiments",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "tool_medium", label: "Tool / Medium", field_type: "string", required: true },
      { field_key: "experiment_name", label: "Experiment Name", field_type: "string", required: true },
      { field_key: "objective", label: "Objective", field_type: "markdown", required: false },
      { field_key: "steps_taken", label: "Steps Taken", field_type: "markdown", required: false },
      { field_key: "outcome", label: "Outcome", field_type: "markdown", required: false },
      { field_key: "reflection", label: "Reflection", field_type: "markdown", required: false },
      { field_key: "artifacts_links", label: "Artifacts & Links", field_type: "markdown", required: false },
      { field_key: "next_experiments", label: "Next Experiments", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  The_Backroom: {
    name: "The Backroom",
    type: "Creative",
    purpose: "Reveal personal or raw explorations",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "context_prompt", label: "Context / Prompt", field_type: "string", required: true },
      { field_key: "notes_brainstorm", label: "Notes & Brainstorm", field_type: "markdown", required: false },
      { field_key: "attachments", label: "Attachments", field_type: "markdown", required: false },
      { field_key: "reflections", label: "Reflections", field_type: "markdown", required: false },
      { field_key: "potential_gems", label: "Potential Gems", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Visual_Experiments: {
    name: "Visual Experiments",
    type: "Creative",
    purpose: "Explore aesthetics and visuals",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "technique_tool", label: "Technique / Tool", field_type: "string", required: true },
      { field_key: "concept", label: "Concept", field_type: "markdown", required: false },
      { field_key: "implementation", label: "Implementation", field_type: "code", required: false },
      { field_key: "outputs", label: "Outputs", field_type: "markdown", required: false },
      { field_key: "observations", label: "Observations", field_type: "markdown", required: false },
      { field_key: "refinements", label: "Refinements", field_type: "markdown", required: false },
      { field_key: "next_variations", label: "Next Variations", field_type: "markdown", required: false },
      { field_key: "files_links", label: "Files & Links", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Digital_Messbook: {
    name: "Digital Messbook",
    type: "Creative",
    purpose: "Keep your chaotic but rich collection organized",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "context", label: "Context", field_type: "string", required: true },
      { field_key: "fragments_notes", label: "Fragments & Notes", field_type: "markdown", required: false },
      { field_key: "links_references", label: "Links & References", field_type: "markdown", required: false },
      { field_key: "themes_tags", label: "Themes & Tags", field_type: "markdown", required: false },
      { field_key: "actions", label: "Actions", field_type: "markdown", required: false },
      { field_key: "tools_formats", label: "Tools & Formats", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  },
  Unpolished: {
    name: "Unpolished",
    type: "Creative",
    purpose: "Show work before it's 'ready'",
    fields: [
      { field_key: "date", label: "Date", field_type: "date", required: true },
      { field_key: "project_piece", label: "Project / Piece", field_type: "string", required: true },
      { field_key: "original_version", label: "Original Version", field_type: "markdown", required: false },
      { field_key: "feedback_issues", label: "Feedback & Issues", field_type: "markdown", required: false },
      { field_key: "lessons_learned", label: "Lessons Learned", field_type: "markdown", required: false },
      { field_key: "next_steps", label: "Next Steps", field_type: "markdown", required: false },
      { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false }
    ]
  }
};

// src/lib/actions.js
var get = store_default.getState;
var set = store_default.setState;
var init = () => {
  if (get().didInit) {
    return;
  }
  set((state) => {
    state.didInit = true;
  });
};
var toggleTheme = () => {
  set((state) => {
    state.theme = state.theme === "dark" ? "light" : "dark";
  });
};
var apps = ["ideaLab", "imageBooth", "archiva"];
var switchApp = (direction) => {
  set((state) => {
    const currentIndex = apps.indexOf(state.activeApp);
    let nextIndex;
    if (direction === "next") {
      nextIndex = (currentIndex + 1) % apps.length;
    } else {
      nextIndex = (currentIndex - 1 + apps.length) % apps.length;
    }
    state.activeApp = apps[nextIndex];
  });
};
var selectModule = (moduleId) => {
  set((state) => {
    if (state.activeModuleId === moduleId) {
      state.activeModuleId = null;
    } else {
      state.activeModuleId = moduleId;
      if (!state.assistantHistories[moduleId]) {
        const personality = personalities[moduleId];
        state.assistantHistories[moduleId] = [{ role: "model", responseText: personality.initialMessage }];
      }
    }
  });
};
var sendMessageToOrchestrator = async (message) => {
  if (!message.trim()) return;
  set((state) => {
    state.orchestratorHistory.push({ role: "user", parts: [{ text: message }] });
  });
  if (message.startsWith("/")) {
    const [command, ...args] = message.trim().split(" ");
    if (command === "/invite") {
      const { activeModuleId } = get();
      if (!activeModuleId) {
        set((state) => state.orchestratorHistory.push({ role: "system", parts: [{ text: "*Please select a module before using /invite.*" }] }));
        return;
      }
      const agent = personalities[activeModuleId];
      set((state) => {
        state.orchestratorHistory.push({
          role: "agent-task",
          agentName: agent.name,
          agentIcon: agent.icon,
          task: "Researching initial concepts...",
          result: `**${agent.name}** found the following resources:
- [Link to relevant research paper]
- [Figma Community File]
- [GitHub Repository with similar tech]`
        });
      });
      return;
    }
    if (command === "/document") {
      const templateName = args[0] || "Code_Notebook";
      const entryId = createArchivaEntry(templateName);
      set((state) => {
        state.activeApp = "archiva";
        state.activeEntryId = entryId;
        state.orchestratorHistory.push({ role: "system", parts: [{ text: `*Created a new **${templateName}** document in Archiva. Switched to Archiva app.*` }] });
      });
      return;
    }
    set((state) => {
      state.orchestratorHistory.push({ role: "system", parts: [{ text: `*Unknown command: ${command}*` }] });
    });
    return;
  }
  set({ isOrchestratorLoading: true });
  await new Promise((res) => setTimeout(res, 1500));
  set((state) => {
    state.isOrchestratorLoading = false;
    state.orchestratorHistory.push({ role: "model", parts: [{ text: `This is a simulated response from the Orchestrator about "${message}". In the future, I will be able to reason, invite agents, and use tools to help you.` }] });
  });
};
var toggleAssistant = () => {
  set((state) => {
    state.isAssistantOpen = !state.isAssistantOpen;
  });
};
var sendAssistantMessage = async (content) => {
  const { activeModuleId } = get();
  if (!content.trim() || !activeModuleId) return;
  set((state) => {
    state.assistantHistories[activeModuleId].push({ role: "user", content });
    state.isAssistantLoading = true;
  });
  const currentHistory = get().assistantHistories[activeModuleId];
  const response = await getAssistantResponse(currentHistory, activeModuleId);
  set((state) => {
    state.assistantHistories[activeModuleId].push({ role: "model", ...response });
    state.isAssistantLoading = false;
  });
};
var selectMode = (modeKey) => {
  set({ activeModeKey: modeKey });
};
var setInputImage = (base64) => {
  set({ inputImage: base64, outputImage: null, generationError: null });
};
var generateImage = async () => {
  const { inputImage, activeModeKey } = get();
  if (!inputImage || !activeModeKey) return;
  set({ isGenerating: true, outputImage: null, generationError: null });
  try {
    let modeDetails;
    for (const category of Object.values(modes_default)) {
      for (const subCategory of Object.values(category)) {
        if (subCategory[activeModeKey]) {
          modeDetails = subCategory[activeModeKey];
          break;
        }
      }
      if (modeDetails) break;
    }
    if (!modeDetails) throw new Error("Selected mode not found.");
    const { workflow, prompt } = modeDetails;
    const model = "gemini-2.5-flash-image-preview";
    let result;
    if (workflow && workflows[workflow]) {
      result = await workflows[workflow]({
        gen: llm_default,
        model,
        base64: inputImage,
        prompt
      });
    } else {
      result = await llm_default({
        model,
        prompt,
        inputFile: inputImage
      });
    }
    if (result) {
      set({ outputImage: result });
    } else {
      throw new Error("Image generation failed or was cancelled.");
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    set({ generationError: error.message || "An unknown error occurred during generation." });
  } finally {
    set({ isGenerating: false });
  }
};
var setActiveEntryId = (entryId) => {
  set({ activeEntryId: entryId });
};
var clearActiveEntryId = () => {
  set({ activeEntryId: null });
};
var createArchivaEntry = (templateKey) => {
  const template = templates[templateKey];
  if (!template) {
    console.error(`Template ${templateKey} not found!`);
    return null;
  }
  const newEntryId = `entry_${Date.now()}`;
  const newEntry = {
    id: newEntryId,
    templateKey,
    status: "draft",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    values: {}
  };
  template.fields.forEach((field) => {
    newEntry.values[field.field_key] = "";
  });
  if (template.fields.some((f) => f.field_key === "title")) {
    newEntry.values.title = `New ${template.name}`;
  }
  set((state) => {
    state.archivaEntries[newEntryId] = newEntry;
  });
  return newEntryId;
};
var createNewArchivaEntry = (templateKey) => {
  const newEntryId = createArchivaEntry(templateKey);
  if (newEntryId) {
    setActiveEntryId(newEntryId);
  }
};
var updateArchivaEntry = (entryId, fieldKey, value) => {
  set((state) => {
    if (state.archivaEntries[entryId]) {
      state.archivaEntries[entryId].values[fieldKey] = value;
      state.archivaEntries[entryId].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
  });
};
var updateArchivaEntryStatus = (entryId, status) => {
  set((state) => {
    if (state.archivaEntries[entryId]) {
      state.archivaEntries[entryId].status = status;
      state.archivaEntries[entryId].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
  });
};
init();

// src/components/WelcomeScreen.jsx
import { jsx, jsxs } from "react/jsx-runtime";
function WelcomeScreen({ onStart }) {
  return /* @__PURE__ */ jsx("div", { className: "welcome-screen", children: /* @__PURE__ */ jsxs("div", { className: "welcome-content", children: [
    /* @__PURE__ */ jsx("h1", { children: "Welcome to the GenBooth Idea Lab" }),
    /* @__PURE__ */ jsx("p", { className: "intro", children: "Explore university modules, connect with expert AI assistants for each subject, and generate creative project ideas. Select a module from the panel to begin your journey." }),
    /* @__PURE__ */ jsx("button", { className: "welcome-start-btn", onClick: onStart, children: "Start Exploring" })
  ] }) });
}

// src/components/AppSwitcher.jsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var apps2 = [
  { id: "ideaLab", title: "Gen Project Idea Lab" },
  { id: "imageBooth", title: "Gen Image Booth" },
  { id: "archiva", title: "ArchivaAI" }
];
function AppSwitcher() {
  const activeApp = store_default.use.activeApp();
  const currentIndex = apps2.findIndex((app) => app.id === activeApp);
  return /* @__PURE__ */ jsxs2("div", { className: "app-switcher", children: [
    /* @__PURE__ */ jsx2("button", { className: "switch-btn icon", onClick: () => switchApp("prev"), title: "Previous App", children: "chevron_left" }),
    /* @__PURE__ */ jsx2("h1", { className: "app-title", children: apps2[currentIndex].title }),
    /* @__PURE__ */ jsx2("button", { className: "switch-btn icon", onClick: () => switchApp("next"), title: "Next App", children: "chevron_right" })
  ] });
}

// src/components/ModeSelector.jsx
import { useState } from "react";
import c from "clsx";

// src/lib/thumbnails.js
var thumbnails_default = {
  "banana": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "beard": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "lego": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "adventureTime": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "pixar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "disney": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "ghibli": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "dragonBall": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "sailorMoon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "harryPotter": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "wonderWoman": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "sherlock": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "fridaKahlo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "elvis": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "renaissance": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "19century": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "80s": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "old": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "baroquegold": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "tintype": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "cartoon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "anime": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "comic": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "impressionist": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "fauvism": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "artnouveau": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "cubism": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "ukiyoe": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "watercolor": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "oilimpasto": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "charcoal": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "statue": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "papercraft": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "claymation": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "stainedglass": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "mosaic": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "filmnoir": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "noircolor": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "cinematic": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "polaroid": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "surrealcollage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "graffiti": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "halftoneprint": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "sciillustration": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "psychedelic": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "bauhaus": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "swiss": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "brutalist": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "botanical": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "blueprint": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "anselAdams": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "cartierBresson": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "dorotheaLange": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "richardAvedon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "irvingPenn": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "dianeArbus": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "helmutNewton": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "annieLeibovitz": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "sebastiaoSalgado": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "steveMcCurry": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "robertCapa": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "gordonParks": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "vivianMaier": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "williamEggleston": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "saulLeiter": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "daidoMoriyama": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "peterLindbergh": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "maryEllenMark": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "brassai": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "walkerEvans": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "kodachrome64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "portra400": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "portra800": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "ektachromeE100": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "velvia50": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "provia100f": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "fuji400h": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "cinestill800t": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "vision3_250d": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "vision3_500t": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "polaroid600": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "polaroidSX70": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "fp100c": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "ilfordHP5": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "triX400": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "tmax3200": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "aerochromeIR": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "lomographyPurple": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "crossProcessC41inE6": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "bleachBypass": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "crtPhosphor": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "vhsEpTape": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "betacamSp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "minidvInterlace": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "laserdiscComposite": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "ntscGhosting": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "timebaseWobble": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "macrovisionTear": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "analogPhotocopyGen5": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "faxThermalRoll": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "risographDuotone": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "cyanotypeBlueprint": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "photogramContact": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "pinholeLongExposure": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "slitScanPortrait": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "lenticularPrint": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "hologramDiffraction": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "ccdBloomSmear": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "rollingShutterJello": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "screenMoir\xE9Capture": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "8bit": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "lowpoly": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "blueprint3d": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "vaporwave": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "synthwave": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "cyberpunk": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "glitch": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "neonoutline": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "holofoil": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "xray": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "infrared": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "chrome": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "pbrFilmic": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "clayAoTurntable": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "toonRampNPR": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "matcapStudio": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "sssSkin": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "thinFilmIridescence": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "carPaintFlakes": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "brushedMetalAniso": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "microDisplacement": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "parallaxOcclusion": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "triplanarNoise": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "raymarchSDF": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "pathTraceGI": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "voxelAO": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "volumetricGodRays": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "causticsPhoton": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "bokehDoF": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "wireframeHiddenLine": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "uvCheckerInspect": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "curvatureCavity": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "pointCloudSurfels": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "photogrammetryScan": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "iridescentHolographicFoil": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "stylizedClayToonMix": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "gpuPathNoiseGrain": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "acescgNeutral": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "plenopticArray": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "codedAperture": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "schlieren": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "shadowgraph": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "interferometry": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "polarizationMicroscopy": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "uvivf": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "hyperspectralFalseColor": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "catadioptricMirror": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "anamorphicScope": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "slitScanTime": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "tofDepthFusion": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "speckleCoherence": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "holographicOffAxis": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "stereographicPlanet": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "hyperbolicTiling": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "fourDProjection": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "causticImaging": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "semLike": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "nerfBake": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "gradCam": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "integratedGradients": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "saliencyMap": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "segmentationCityscapes": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "instanceMasksCoco": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "detectionBoxesYolo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "keypointsOpenPose": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "faceLandmarksArkit": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "opticalFlowFarneback": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "depthTurboColormap": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "surfaceNormalsRGB": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "stereoDisparity": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "lidarPointCloud": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "uvUnwrapAtlas": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "retopoWireframe": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "normalsEdgeOcclusion": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "superresArtifacts": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "demosaicChecker": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "jpegQuantViz": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "exifTelemetry": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "fftPhaseOnly": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "fftMagOnly": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "phaseSwap": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "waveletBands": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "multiresPyramid": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "bilateralCartoon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "anisotropicDiffusion": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "seamCarveWarp": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "poissonRelight": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "retinexNormalize": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "unsharpFilm80": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "harrisCornersHUD": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "cannyInk": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "voronoiCells": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "delaunayWire": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "reactionDiffusionSkin": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "sdfContourMap": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "morphologyGranite": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "poissonDiskStipple": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "grayWorldConstancy": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "hyperbolic_atrium": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "meta_liquid_skin": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "chronos_slices": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "retopo_molt": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "caustic_projector": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "voxel_bokeh": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "drape_identity": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "csg_chapel": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "lidar_dust_recon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "hologrid_parallax": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "nonnewtonian_face": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "nerf_multiview_ghost": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "mandel_dermis": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "prism_identity": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "papercraft_sections": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "renaissance_x_blueprint": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "marbleStatue_x_neonNoir": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "anime_x_swissGrid": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "claymation_x_cyanotype": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "baroqueGold_x_microprint": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "toonRamp_x_guilloche": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "holoFoil_x_blackVoid": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "photogrammetry_x_risograph": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "chromeLiquid_x_pastelStudio": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "sciIllustration_x_bokehNight": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "wireframe_x_paperCollage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "lowPoly_x_gradientField": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "sepiaTintype_x_dataTape": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "sssSkin_x_archViz": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "legoMinifig_x_blueHour": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "charcoalSketch_x_causticGlass": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "nprInk_x_hyperrealLab": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "hologramHUD_x_concreteWall": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "ceramicGlaze_x_forestFog": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "bronzeBust_x_digitalGrid": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "FOIA_redact": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "watermark_notary": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "microprint_border": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "guilloche_plate": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "stamp_ink_office": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "hologram_id": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "ocr_tesseract": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "barcode_pdf417": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "qr_overlay": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "tamper_evident": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "watermark_latent": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "cheque_courtesy": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "red_ribbon_seal": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "blue_ink_signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "docket_header": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "postal_cancellation": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "perforation_edge": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "ledger_grid": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "uv_security_fluor": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "watermark_diagonal_confidential": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "eideticAfterimage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "saccadeTrails": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "troxlerFade": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "binocularRivalry": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "motionInducedBlindness": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "scotomaMask": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "aphantasiaLowImagery": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "pareidoliaClouds": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "confabulationFill": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "flashbulbMemory": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "repressionRedactions": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "dreamSeam": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "memoryPalaceCards": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "tipOfTongue": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "dejaVuTiling": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "migraineAura": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "changeBlindness": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "emotionalSalienceMap": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "reminiscenceBump": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "forgettingCurve": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "mythCartographer": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "embassyOfDreams": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "ghostOfProvenance": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "oralHistoryWeave": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "bureaucraticHaunting": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "speculativeAutopsy": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "climateMuseumLabel": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "folkRemedyPoster": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "archiveLeak": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "ritualCalibration": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "lichenReader": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "borderlandBallad": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "planetOfArchives": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "tenderPropaganda": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "counterfeitMemory": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "fieldNotesFromTomorrow": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "saintOfSmallActs": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "rumorAtlas": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "edibleIcon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "futureArcheologyKit": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "causalityFold": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "observerBias": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "conservationOfSilhouette": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "topologyBudget": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "entropyDrip": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "wavefunctionFace": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "counterfactualReflections": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "negotiatedLighting": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "borrowedAlbedo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "vetoedSpecular": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "scafFold": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "depthTax": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "antiAliasOath": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "puncturedNormals": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "auctionedShadows": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "parallaxDebate": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "memoryLeakSSS": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "centroidHandoff": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "silentCollision": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "whatIf_authenticityOutlawed": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "whatIf_faceAsPublicUtility": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "whatIf_memoryRequiresQuorum": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "whatIf_colorBudget": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "whatIf_backgroundOwnsNarrative": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "whatIf_translationIsLossy": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "whatIf_lawAsRecipe": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "whatIf_privacyIsSpatial": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "whatIf_ecologyCoauthors": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "whatIf_receiptsForFeeling": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "whatIf_reflectionIsSovereign": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "whatIf_timeAsAxis": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "whatIf_rumorErodesMatter": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkoAAAAAMAAUoB69wAAAAASUVORK5CYII=",
  "whatIf_archiveResistsReading": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "whatIf_identityLeased": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/epv2AAAAABJRU5ErkJggg==",
  "whatIf_gravityIsAttention": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
};

// src/components/ModeSelector.jsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
function ModeSelector() {
  const activeModeKey = store_default.use.activeModeKey();
  const [openCategories, setOpenCategories] = useState(() => {
    const initialState = {};
    Object.keys(modes_default).forEach((key) => {
      initialState[key] = true;
    });
    return initialState;
  });
  const toggleCategory = (categoryName) => {
    setOpenCategories((prev) => ({ ...prev, [categoryName]: !prev[categoryName] }));
  };
  return /* @__PURE__ */ jsx3("div", { className: "mode-selector", children: Object.entries(modes_default).map(([categoryName, subCategories]) => {
    const isOpen = openCategories[categoryName];
    return /* @__PURE__ */ jsxs3("div", { className: "mode-category", children: [
      /* @__PURE__ */ jsxs3("h2", { onClick: () => toggleCategory(categoryName), children: [
        categoryName,
        /* @__PURE__ */ jsx3("span", { className: "icon", children: isOpen ? "expand_less" : "expand_more" })
      ] }),
      isOpen && Object.entries(subCategories).map(([subCategoryName, modesInCategory]) => /* @__PURE__ */ jsxs3("div", { className: "mode-subcategory", children: [
        /* @__PURE__ */ jsx3("h3", { children: subCategoryName }),
        /* @__PURE__ */ jsx3("div", { className: "mode-grid", children: Object.entries(modesInCategory).map(([modeKey, modeDetails]) => /* @__PURE__ */ jsxs3(
          "button",
          {
            className: c("mode-item", { active: activeModeKey === modeKey }),
            onClick: () => selectMode(modeKey),
            title: modeDetails.name,
            children: [
              /* @__PURE__ */ jsx3("img", { src: thumbnails_default[modeKey], alt: modeDetails.name, loading: "lazy" }),
              /* @__PURE__ */ jsxs3("span", { children: [
                modeDetails.emoji,
                " ",
                modeDetails.name
              ] })
            ]
          },
          modeKey
        )) })
      ] }, subCategoryName))
    ] }, categoryName);
  }) });
}

// src/components/ImageUploader.jsx
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
});
function ImageUploader() {
  const handleFileChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setInputImage(base64);
      } catch (error) {
        console.error("Error converting file to base64:", error);
      }
    }
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => e.preventDefault();
  return /* @__PURE__ */ jsxs4("div", { className: "image-uploader", onDragOver: handleDragOver, onDrop: handleDrop, children: [
    /* @__PURE__ */ jsx4("span", { className: "icon", children: "add_photo_alternate" }),
    /* @__PURE__ */ jsx4("h3", { children: "Upload a Portrait" }),
    /* @__PURE__ */ jsx4("p", { children: "Drag & drop an image here, or click to select a file." }),
    /* @__PURE__ */ jsx4(
      "input",
      {
        type: "file",
        accept: "image/jpeg, image/png, image/webp",
        onChange: handleFileChange,
        title: "Select an image to upload"
      }
    )
  ] });
}

// src/lib/descriptions.js
var descriptions_default = {
  "Artistic & Photographic": {
    description: "Embrace creativity with styles inspired by traditional art, photography, and pop culture. This collection is your gateway to transforming portraits into expressive masterpieces, from classical paintings to modern graphic designs.",
    Playful: {
      description: "Inject a dose of fun into your photos with these lighthearted and whimsical transformations.",
      banana: { description: "Go bananas! This effect places the subject in a silly, bright yellow banana costume." },
      beard: { description: "Give your subject a magnificent, larger-than-life beard for a touch of lumberjack chic or wizardly wisdom." },
      lego: { description: "Reimagine the subject as a classic LEGO minifigure, complete with plastic sheen and iconic blocky form." }
    },
    "Pop Culture Characters": {
      description: "Become an icon from the worlds of animation, film, and art. This category lets you step into the shoes of your favorite characters.",
      adventureTime: { description: "Journey to the Land of Ooo by transforming into a character with the whimsical, noodle-limbed style of Adventure Time." },
      pixar: { description: "Leap into a world of heartfelt animation by reimagining the subject as a 3D character with the signature charm and detail of a Pixar film." },
      disney: { description: "Become royalty with the classic, enchanting animation style of a Disney Prince or Princess, set against a fairy-tale backdrop." },
      ghibli: { description: "Capture the gentle, painterly, and nostalgic atmosphere of a Studio Ghibli masterpiece." },
      dragonBall: { description: "Power up! Transform into a Dragon Ball Z warrior with dynamic lines, intense energy, and iconic spiky hair." },
      sailorMoon: { description: "In the name of the moon, adopt the iconic 90s sh\u014Djo anime style of Sailor Moon, complete with large, sparkling eyes." },
      harryPotter: { description: "Enter the Wizarding World as a student of Hogwarts, complete with robes and a wand." },
      wonderWoman: { description: "Channel your inner Amazonian princess with the iconic tiara and heroic pose of Wonder Woman." },
      sherlock: { description: "Don a deerstalker hat and solve a mystery in the foggy streets of Victorian London as Sherlock Holmes." },
      fridaKahlo: { description: "Embody the surreal and powerful style of Frida Kahlo, featuring her iconic unibrow and bold, symbolic imagery." },
      elvis: { description: "Become the King of Rock and Roll, capturing the stage presence and iconic style of Elvis Presley." }
    },
    Eras: {
      description: "Travel through time and adopt the aesthetics of different historical periods, from classical art to vintage photography.",
      renaissance: { description: "Render your portrait with the dramatic lighting, rich tones, and classical composition of a Renaissance masterpiece." },
      "19century": { description: "Capture the formal, haunting quality of a 19th-century daguerreotype, with period-appropriate clothing and a sepia tint." },
      "80s": { description: "Go back to the decade of big hair and bold colors with a classic 1980s yearbook photo aesthetic." },
      old: { description: "Age the subject gracefully, adding wrinkles, wisdom, and the gentle softness of advanced years." },
      baroquegold: { description: "Embrace the drama and opulence of the Baroque period with dramatic lighting, gilded details, and luxurious textures." },
      tintype: { description: "Recreate the authentic, slightly imperfect look of a wet-plate collodion tintype from the 19th century, known for its unique chemical artifacts." }
    },
    Mediums: {
      description: "Explore a diverse palette of artistic materials and techniques. This category transforms your photo as if it were created with physical media.",
      cartoon: { description: "Simplify your portrait into a clean, friendly cartoon with bold lines and solid colors." },
      anime: { description: "Adopt the expressive and stylized look of a modern anime character, featuring large eyes and detailed hair." },
      comic: { description: "Become a comic book hero, complete with halftone dots, dynamic ink lines, and a graphic sensibility." },
      impressionist: { description: "See the world through the eyes of an Impressionist painter, with soft, visible brushstrokes and a focus on light and color." },
      fauvism: { description: "Unleash bold, non-naturalistic colors and expressive brushwork in the style of the Fauvist art movement." },
      artnouveau: { description: "Embrace the elegant, organic, and decorative style of Art Nouveau, characterized by flowing lines and natural motifs." },
      cubism: { description: "Deconstruct your portrait into geometric forms and multiple viewpoints, in the revolutionary style of Cubism." },
      ukiyoe: { description: "Transform your photo into a traditional Japanese ukiyo-e woodblock print, with flat colors and delicate linework." },
      watercolor: { description: "Achieve the soft, translucent, and flowing effect of a watercolor painting, complete with paper grain." },
      oilimpasto: { description: "Apply thick, textured layers of oil paint with visible palette-knife strokes for a dynamic, tactile surface." },
      charcoal: { description: "Create a classic, expressive charcoal sketch with rich blacks, smudged tones, and a focus on form." },
      statue: { description: "Carve your portrait from classical marble, turning the subject into a timeless, elegant statue." },
      papercraft: { description: "Reconstruct the subject from layers of cut and folded paper, creating a charming, handcrafted 3D effect." },
      claymation: { description: "Mold your portrait from modeling clay, complete with the charming imperfections and soft look of stop-motion animation." },
      stainedglass: { description: "Render the image as a luminous stained glass window, with bold leaded lines and vibrant, transparent colors." },
      mosaic: { description: "Assemble your portrait from tiny, colored tiles (tesserae) to create a timeless mosaic effect." },
      filmnoir: { description: "Enter a world of mystery and shadow with high-contrast black-and-white lighting, sharp shadows, and a moody atmosphere." },
      noircolor: { description: "Combine the dramatic, low-key lighting of film noir with a muted, modern color palette for a stylish, cinematic look." },
      cinematic: { description: "Apply a professional, movie-like color grade with popular palettes like teal-and-orange for a polished, cinematic feel." },
      polaroid: { description: "Capture the nostalgic, slightly faded look of a vintage instant Polaroid photo, complete with its iconic white frame." },
      surrealcollage: { description: "Create a dreamlike and unexpected image by collaging disparate elements in a surrealist style." },
      graffiti: { description: "Become a piece of urban art by stenciling the portrait onto a textured brick wall with spray paint and street art elements." },
      halftoneprint: { description: "Simulate a vintage printing process using visible CMYK dots to build up the image, creating a retro, graphic look." },
      sciillustration: { description: "Transform the portrait into a precise and detailed scientific illustration, as if from an antique textbook." }
    },
    "Poster & Graphic": {
      description: "Apply principles of graphic design to your portrait, turning it into a bold, stylized piece of poster art.",
      psychedelic: { description: "Embrace the vibrant, swirling, and mind-bending aesthetic of 1960s psychedelic poster art." },
      bauhaus: { description: "Reconstruct your portrait using the minimalist principles of the Bauhaus school: geometric shapes, primary colors, and clean composition." },
      swiss: { description: "Adopt the clean, grid-based, and highly functional aesthetic of the Swiss International Style of graphic design." },
      brutalist: { description: "Create a stark, raw, and unapologetically bold image with the heavy forms and textured surfaces of Brutalist design." },
      botanical: { description: "Frame your portrait with elegant, detailed botanical engravings for a calm and natural feel." },
      blueprint: { description: "Redraw your portrait as a technical blueprint, with white lines on a cyan background and precise annotations." }
    },
    "Master Photographers": {
      description: "Emulate the signature styles of some of history's most iconic photographers, from dramatic landscapes to intimate portraits.",
      anselAdams: { description: "Capture the epic, sharp, and tonally rich look of Ansel Adams' black-and-white large-format landscape photography." },
      cartierBresson: { description: "Adopt the 'decisive moment' philosophy of Henri Cartier-Bresson with a candid, geometric, and natural-light 35mm black-and-white style." },
      dorotheaLange: { description: "Channel the humane, empathetic, and documentary spirit of Dorothea Lange's portraiture from the WPA era." },
      richardAvedon: { description: "Create a minimalist, high-key studio portrait against a stark white background, in the style of Richard Avedon." },
      irvingPenn: { description: "Achieve the elegant, sculpted, and immaculate stillness of an Irving Penn studio portrait." },
      dianeArbus: { description: "Capture the direct, intimate, and often unsettling honesty of a flash-lit, square-format Diane Arbus portrait." },
      helmutNewton: { description: "Embrace the glossy, hard-lit, and provocative style of Helmut Newton's black-and-white fashion photography." },
      annieLeibovitz: { description: "Create a rich, cinematic, and grandly narrative portrait with the sculpted lighting and storytelling of Annie Leibovitz." },
      sebastiaoSalgado: { description: "Render an epic, high-contrast, and deeply textured black-and-white documentary image in the style of Sebasti\xE3o Salgado." },
      steveMcCurry: { description: "Capture the vivid, saturated colors and expressive, soulful eyes that define the reportage style of Steve McCurry." },
      robertCapa: { description: "Emulate the gritty, raw immediacy and motion-filled grain of Robert Capa's legendary war photography." },
      gordonParks: { description: "Adopt the lyrical, elegant, and socially conscious documentary style of Gordon Parks, in either black-and-white or muted color." },
      vivianMaier: { description: "Capture the quiet, candid, and reflective moments of street life in the unassuming square-format style of Vivian Maier." },
      williamEggleston: { description: "Find beauty in the banal with the rich, dye-transfer color and subtle geometry of William Eggleston's vernacular photography." },
      saulLeiter: { description: "Create a muted, painterly, and layered color photograph using reflections and obstructions, in the style of Saul Leiter." },
      daidoMoriyama: { description: "Embrace the high-contrast, grainy, and restless energy of Daid\u014D Moriyama's raw black-and-white street photography." },
      peterLindbergh: { description: "Achieve the honest, natural, and timeless monochrome fashion portraiture style of Peter Lindbergh." },
      maryEllenMark: { description: "Capture the intimate, candid, and empathetic realism of Mary Ellen Mark's black-and-white documentary portraits." },
      brassai: { description: "Evoke the romantic, nocturnal atmosphere of Brassa\xEF's Paris, with wet streets, mist, and dramatic streetlights." },
      walkerEvans: { description: "Adopt the formal, restrained, and detailed compositions of Walker Evans' seminal American documentary work." }
    }
  },
  "Technical & Media Emulation": {
    description: "Recreate the distinct aesthetics of analog and digital technologies. This collection is perfect for achieving a vintage, retro, or CG-specific feel by simulating the artifacts and characteristics of different media.",
    "Film & Process Emulations": {
      description: "Simulate the unique color, grain, and character of iconic photographic film stocks and classic darkroom techniques.",
      kodachrome64: { description: "Achieve the sharp, vibrant, and archival look of Kodachrome 64 slide film, famous for its rich reds and clean blues." },
      portra400: { description: "Emulate the soft, natural skin tones and gentle contrast of Kodak Portra 400, a favorite for portrait photography." },
      portra800: { description: "Capture the warm tones and slightly coarser grain of Kodak Portra 800, excellent for low-light situations." },
      ektachromeE100: { description: "Reproduce the clean, neutral, and cool-leaning colors of Ektachrome E100 slide film." },
      velvia50: { description: "Get the high-saturation, punchy contrast, and vivid colors of Fujifilm Velvia 50, a classic choice for landscape photography." },
      provia100f: { description: "Achieve the balanced, refined, and moderately saturated look of Fujifilm Provia 100F slide film." },
      fuji400h: { description: "Emulate the airy, pastel tones and signature mint-green cast of Fujifilm 400H, popular for wedding photography." },
      cinestill800t: { description: "Recreate the unique cinematic look of CineStill 800T, with its signature red halation around highlights in night scenes." },
      vision3_250d: { description: "Capture the muted saturation and wide dynamic range of Kodak Vision3 250D daylight-balanced cinema film." },
      vision3_500t: { description: "Emulate the soft contrast and teal-leaning shadows of Kodak Vision3 500T tungsten-balanced cinema film." },
      polaroid600: { description: "Achieve the soft, cool-toned, and slightly unpredictable look of classic Polaroid 600 instant film." },
      polaroidSX70: { description: "Reproduce the warm, delicate, and vintage tones of the iconic Polaroid SX-70 instant film." },
      fp100c: { description: "Emulate the rich, neutral colors and smooth grain of Fujifilm FP-100C, a classic peel-apart instant film." },
      ilfordHP5: { description: "Get the punchy, grainy, and versatile character of Ilford HP5, a classic black-and-white documentary film stock." },
      triX400: { description: "Achieve the gritty, high-contrast, and timeless reportage look of Kodak Tri-X 400 black-and-white film." },
      tmax3200: { description: "Emulate the heavy grain and dramatic contrast of Kodak T-Max 3200, designed for extremely low-light photography." },
      aerochromeIR: { description: "Create the surreal, false-color look of Kodak Aerochrome infrared film, which turns foliage into vibrant reds and pinks." },
      lomographyPurple: { description: "Achieve the psychedelic color-shifting effect of Lomography Purple film, turning greens into purples." },
      crossProcessC41inE6: { description: "Simulate the unpredictable, high-contrast, and color-shifted look of cross-processing film in the wrong chemicals." },
      bleachBypass: { description: "Recreate the desaturated, high-contrast, and metallic look of the bleach bypass film development process." }
    },
    "Analog Carriers & Signal Path Artifacts": {
      description: "Simulate the charming imperfections and nostalgic artifacts from analog media formats like VHS tapes, CRT screens, and old broadcast signals.",
      crtPhosphor: { description: "Recreate the look of an image displayed on a vintage CRT monitor, complete with scanlines and phosphor dot triads." },
      vhsEpTape: { description: "Emulate the low-fidelity charm of a VHS tape in long-play mode, with chroma bleed, tape noise, and tracking errors." },
      betacamSp: { description: "Achieve the clean, professional look of a Betacam SP broadcast tape, the standard for news gathering in the 90s." },
      minidvInterlace: { description: "Reproduce the distinct interlaced look of early MiniDV camcorders, with characteristic motion artifacts." },
      laserdiscComposite: { description: "Simulate the analog video artifacts of a LaserDisc player, such as dot crawl and rainbowing on fine patterns." },
      ntscGhosting: { description: "Recreate the look of a weak over-the-air NTSC television signal, complete with multipath ghosting and antenna snow." },
      timebaseWobble: { description: "Emulate the horizontal jitter and shimmer of analog tape playback without time-base correction." },
      macrovisionTear: { description: "Simulate the chaotic visual failure of Macrovision VHS copy protection, with unstable brightness and tearing." },
      analogPhotocopyGen5: { description: "Achieve the high-contrast, grainy, and slightly distorted look of a fifth-generation analog photocopy." },
      faxThermalRoll: { description: "Recreate the dithered, streaky, and low-resolution aesthetic of an image sent through a thermal fax machine." },
      risographDuotone: { description: "Emulate the look of a two-color Risograph print, with its characteristic misregistration, coarse halftone, and soy-ink texture." },
      cyanotypeBlueprint: { description: "Achieve the deep Prussian blue and soft, contact-printed look of a classic Cyanotype photographic print." },
      photogramContact: { description: "Create a camera-less photogram image, with object silhouettes and diffuse glows, as if made in a darkroom." },
      pinholeLongExposure: { description: "Simulate the soft focus, wide vignette, and motion blur of a long exposure taken with a simple pinhole camera." },
      slitScanPortrait: { description: "Create a surreal, time-stretched portrait using the slit-scan photography technique, smearing features along one axis." },
      lenticularPrint: { description: "Emulate the ribbed, parallax-shifting effect of a lenticular print, which shows different images from different angles." },
      hologramDiffraction: { description: "Achieve the rainbow diffraction fringes and metallic sheen of an embossed security hologram." },
      ccdBloomSmear: { description: "Reproduce the vertical smear and blooming artifacts from bright highlights characteristic of older CCD digital sensors." },
      rollingShutterJello: { description: "Simulate the 'jello' effect of a rolling shutter on a CMOS sensor, which skews vertical lines during fast motion." },
      screenMoir\u00E9Capture: { description: "Recreate the wavy interference patterns (moir\xE9) that occur when photographing a digital screen." }
    },
    "CGI & Digital": {
      description: "Explore aesthetics born from the world of computer graphics, from early pixel art to futuristic digital styles.",
      "8bit": { description: "Transform your portrait into nostalgic 8-bit pixel art, with a limited color palette and low resolution." },
      lowpoly: { description: "Reconstruct the subject as a low-poly 3D model with flat-shaded, geometric facets." },
      blueprint3d: { description: "Convert your portrait into a clean, technical 3D wireframe, revealing its underlying geometric structure." },
      vaporwave: { description: "Embrace the nostalgic, retro-futuristic aesthetic of Vaporwave, with neon gradients and 80s digital artifacts." },
      synthwave: { description: "Create a dramatic, neon-lit portrait with the cinematic 80s synth-pop aesthetic of Synthwave." },
      cyberpunk: { description: "Enter a high-tech, low-life future with a Cyberpunk portrait featuring neon lights, rain, and cybernetic enhancements." },
      glitch: { description: "Introduce digital errors and artifacts like scan lines, datamoshing, and RGB splits for a chaotic, corrupted look." },
      neonoutline: { description: "Trace the contours of the subject with glowing neon lines against a dark background for a striking, high-contrast effect." },
      holofoil: { description: "Make your portrait appear as if it's printed on iridescent holographic foil with shifting rainbow colors." },
      xray: { description: "Create an artistic x-ray effect, revealing the bone structure beneath the skin in a stylized, translucent way." },
      infrared: { description: "Simulate a thermal infrared camera view, mapping the subject's temperature to a vibrant color gradient." },
      chrome: { description: "Transform the subject into a sleek, reflective liquid chrome sculpture with mirror-like surfaces." }
    },
    "3D Render Qualities & Pipelines": {
      description: "Apply the specific techniques and looks from the world of modern 3D computer graphics, from realistic rendering to stylized shaders.",
      pbrFilmic: { description: "Achieve a photorealistic look with physically-based rendering (PBR), image-based lighting, and a cinematic Filmic tonemap." },
      clayAoTurntable: { description: "Render the subject as a neutral monochrome clay model with strong ambient occlusion to emphasize form." },
      toonRampNPR: { description: "Create a non-photorealistic (NPR) cel-shaded look with stepped color ramps and crisp ink outlines." },
      matcapStudio: { description: "Apply a 'material capture' (MatCap) shader to simulate complex studio lighting and reflections with a single texture." },
      sssSkin: { description: "Simulate realistic skin by adding subsurface scattering (SSS), which mimics light penetrating and diffusing through translucent surfaces." },
      thinFilmIridescence: { description: "Create a beautiful, iridescent, soap-bubble-like effect with a thin-film interference shader." },
      carPaintFlakes: { description: "Recreate the multi-layered look of metallic car paint, complete with base coat, metallic flakes, and a glossy clear coat." },
      brushedMetalAniso: { description: "Simulate the elongated highlights and soft reflections of brushed metal using an anisotropic shader." },
      microDisplacement: { description: "Add incredible surface detail by using micro-displacement to alter the actual geometry of the model at render time." },
      parallaxOcclusion: { description: "Create the illusion of 3D surface detail and self-shadowing on a flat plane using parallax occlusion mapping." },
      triplanarNoise: { description: "Apply a seamless procedural texture, like rock or noise, using triplanar projection to avoid UV mapping artifacts." },
      raymarchSDF: { description: "Render the subject using Signed Distance Fields (SDFs), creating crisp, mathematically perfect shapes and soft ambient occlusion." },
      pathTraceGI: { description: "Achieve ultimate realism with path-traced global illumination, simulating how light bounces and bleeds color in a scene." },
      voxelAO: { description: "Create a stylized, blocky look with voxel-based ambient occlusion and global illumination." },
      volumetricGodRays: { description: "Add dramatic, atmospheric 'God rays' (crepuscular rays) by rendering light shafts through participating media like fog or dust." },
      causticsPhoton: { description: "Simulate the bright, focused patterns of light (caustics) that occur when light passes through or reflects off refractive materials like glass and water." },
      bokehDoF: { description: "Achieve a cinematic, shallow depth-of-field effect with beautifully shaped bokeh, mimicking a real camera lens." },
      wireframeHiddenLine: { description: "Create a technical, hidden-line wireframe view, where only the visible edges of the model are drawn." },
      uvCheckerInspect: { description: "Apply a UV checker map to the subject to visualize the quality and layout of its texture coordinates." },
      curvatureCavity: { description: "Emphasize surface detail by using a curvature map to darken crevices (cavities) and lighten sharp edges, simulating wear and tear." },
      pointCloudSurfels: { description: "Render the subject as a dense cloud of points or 'surfels' (surface elements) for a scanned, reconstructed look." },
      photogrammetryScan: { description: "Simulate the look of a high-poly 3D scan created with photogrammetry, including baked-in lighting and minor texture seams." },
      iridescentHolographicFoil: { description: "Apply a procedural holographic foil material with view-dependent rainbow diffraction and a metallic sheen." },
      stylizedClayToonMix: { description: "Combine the soft, matte look of clay with the crisp ramps and outlines of toon shading for a unique hybrid style." },
      gpuPathNoiseGrain: { description: "Retain a subtle, aesthetically pleasing amount of noise from an unbiased path-traced render to add cinematic texture." },
      acescgNeutral: { description: "Apply a neutral ACEScg color grade, a professional standard in filmmaking for preserving highlight detail and achieving a filmic look." }
    }
  },
  "Scientific & Abstract": {
    description: "Venture into the experimental with styles based on scientific visualization, mathematical concepts, and non-traditional imaging. This collection is for those who want to see the world in a different light, revealing hidden structures and abstract beauty.",
    "Exotic Optics & Non-Euclidean Capture": {
      description: "Explore what's possible beyond a normal lens. This category simulates scientific, abstract, and physically-based optical phenomena that bend the rules of perception.",
      plenopticArray: { description: "Simulate a light-field camera capture, which allows for effects like refocusing after the shot is taken." },
      codedAperture: { description: "Recreate the look of lensless imaging, where the image is computationally reconstructed from a patterned mask." },
      schlieren: { description: "Visualize invisible changes in air density, like heat or airflow, with the razor-sharp edges of Schlieren imaging." },
      shadowgraph: { description: "Capture high-speed density gradients as soft, detailed monochrome shadows, a technique used in fluid dynamics." },
      interferometry: { description: "Wrap the subject in the iridescent, contour-like fringe patterns created by light wave interference." },
      polarizationMicroscopy: { description: "Reveal the hidden crystalline structures and birefringent colors of a subject as seen through a cross-polarized microscope." },
      uvivf: { description: "Simulate UV-induced visible fluorescence, where parts of the subject glow in surreal colors under an ultraviolet light." },
      hyperspectralFalseColor: { description: "Map invisible light spectra (like infrared) to visible colors, revealing details the human eye can't see." },
      catadioptricMirror: { description: "Emulate the look of a mirror lens, characterized by its compressed perspective and distinctive donut-shaped bokeh." },
      anamorphicScope: { description: "Achieve the cinematic look of an anamorphic lens, with its signature oval bokeh and horizontal lens flares." },
      slitScanTime: { description: "Create a surreal, time-stretched portrait using the temporal slit-scan technique, smearing features along a time axis." },
      tofDepthFusion: { description: "Visualize the world as a time-of-flight depth camera does, with clean, stepped contours based on distance." },
      speckleCoherence: { description: "Apply the granular, shimmering pattern of laser speckle that occurs when a surface is illuminated by coherent light." },
      holographicOffAxis: { description: "Recreate the look of an off-axis hologram, complete with carrier fringes and a metallic, diffractive sheen." },
      stereographicPlanet: { description: "Project the entire scene into a 'tiny planet' aound the subject using a stereographic projection." },
      hyperbolicTiling: { description: "Warp the space around the subject into a Poincar\xE9 disk, a two-dimensional model of hyperbolic geometry." },
      fourDProjection: { description: "Imagine the subject as a 3D 'slice' of a 4D object, resulting in impossible overlaps and strange occlusions." },
      causticImaging: { description: "Form the image not with a lens, but with the focused, intricate patterns of light (caustics) passing through water or glass." },
      semLike: { description: "Achieve the monochrome, high-detail, and topological look of a Scanning Electron Microscope (SEM) image." },
      nerfBake: { description: "Simulate the unique look of a NeRF (Neural Radiance Field) reconstruction, with its characteristic floaters and view-dependent sparkle." }
    },
    "Computer-Vision Diagnostic Layers": {
      description: "Visualize the world as a machine sees it. This category applies overlays and transformations inspired by common computer vision algorithms.",
      gradCam: { description: "Overlay a semi-transparent Grad-CAM heatmap to visualize where a neural network 'looks' to make a decision, highlighting important features in warm colors." },
      integratedGradients: { description: "Apply an 'Integrated Gradients' attribution mask, showing which pixels were most influential in a model's prediction." },
      saliencyMap: { description: "Generate a saliency map, which highlights the most visually conspicuous or attention-grabbing parts of the image." },
      segmentationCityscapes: { description: "Apply a crisp semantic segmentation overlay, color-coding each pixel based on its class (e.g., person, sky, car) using the Cityscapes dataset palette." },
      instanceMasksCoco: { description: "Show each detected object instance with a distinct, translucent colored mask, as seen in datasets like COCO." },
      detectionBoxesYolo: { description: "Draw the bounding boxes, class labels, and confidence scores generated by an object detection model like YOLO." },
      keypointsOpenPose: { description: "Overlay a 2D skeletal structure of the person's pose, as detected by an algorithm like OpenPose." },
      faceLandmarksArkit: { description: "Render the dense mesh of facial landmarks used by augmented reality systems like ARKit to track facial expressions." },
      opticalFlowFarneback: { description: "Visualize motion in the scene with an optical flow field, which shows the direction and speed of pixel movement." },
      depthTurboColormap: { description: "Generate a monocular depth map and color-code it with the vibrant 'Turbo' colormap to show distance from the camera." },
      surfaceNormalsRGB: { description: "Visualize the 3D surface orientation of the subject by color-coding the per-pixel surface normals in RGB." },
      stereoDisparity: { description: "Simulate a stereo disparity map, which shows the difference in position of objects as seen from two cameras, indicating depth." },
      lidarPointCloud: { description: "Render the subject as a sparse point cloud, as if it were scanned by a LiDAR sensor." },
      uvUnwrapAtlas: { description: "Project a checkerboard UV atlas onto the subject to visualize its 3D model's texture coordinates." },
      retopoWireframe: { description: "Overlay a clean, quad-based wireframe that follows the natural topology of the face, used in 3D modeling." },
      normalsEdgeOcclusion: { description: "Combine stylized edge detection with ambient occlusion for a technical, x-ray-like sketch effect." },
      superresArtifacts: { description: "Visualize the difference (residual) between a low-resolution image and its AI-super-resolved version, highlighting what the AI added." },
      demosaicChecker: { description: "Simulate the 'demosaicing' process of a digital camera sensor, revealing common artifacts like zipper and maze patterns at edges." },
      jpegQuantViz: { description: "Expose the underlying 8x8 block grid and ringing artifacts of JPEG compression." },
      exifTelemetry: { description: "Add a minimalist, technical HUD (Heads-Up Display) showing the photo's EXIF metadata like shutter speed, ISO, and aperture." }
    },
    "Signal Domain Alchemy": {
      description: "Transform your image not by changing pixels directly, but by manipulating its underlying mathematical representations in the frequency and signal domains.",
      fftPhaseOnly: { description: "Reconstruct the image using only the phase information from its Fourier transform, resulting in ghostly, edge-focused images." },
      fftMagOnly: { description: "Reconstruct the image using only the magnitude (energy) from its Fourier transform, creating abstract textures that lack clear form." },
      phaseSwap: { description: "Create an uncanny hybrid by combining one image's magnitude spectrum with another's phase spectrum." },
      waveletBands: { description: "Decompose the image into multi-scale wavelet bands, allowing for independent manipulation of detail at different frequencies." },
      multiresPyramid: { description: "Blend a Laplacian pyramid of the image, boosting fine layers to sharpen detail while controlling halos." },
      bilateralCartoon: { description: "Apply a strong, edge-preserving bilateral filter to create flat, cartoon-like color regions with sharp outlines." },
      anisotropicDiffusion: { description: "Use anisotropic diffusion to smooth textures within regions while preserving or enhancing the edges between them." },
      seamCarveWarp: { description: "Subtly warp the image using seam carving, a content-aware resizing technique that intelligently removes or inserts low-importance pixel seams." },
      poissonRelight: { description: "Relight the subject by solving a Poisson equation in the gradient domain, preserving texture while shifting illumination." },
      retinexNormalize: { description: "Apply a multi-scale Retinex algorithm to even out illumination and expand shadow detail, mimicking human vision." },
      unsharpFilm80: { description: "Recreate the classic darkroom technique of unsharp masking for crisp micro-contrast and a tactile 'print' feel." },
      harrisCornersHUD: { description: "Overlay Harris corner interest points, used in computer vision to identify significant features in an image." },
      cannyInk: { description: "Extract the edges using the Canny edge detector and blend them as clean, vector-like ink lines over the original image." },
      voronoiCells: { description: "Quantize the image's tones into a Voronoi diagram, dividing the portrait into polygonal cells." },
      delaunayWire: { description: "Triangulate the image's features into a Delaunay mesh and render it as a fine wireframe overlay." },
      reactionDiffusionSkin: { description: "Lay a subtle, organic, Turing-like pattern over the subject using a Gray-Scott reaction-diffusion simulation." },
      sdfContourMap: { description: "Generate and display a topographic-like contour map of the face using Signed Distance Fields (SDFs)." },
      morphologyGranite: { description: "Apply a sequence of morphological operators (opening/closing) to create a granular, stone-like microtexture." },
      poissonDiskStipple: { description: "Render the portrait using Poisson-disk stippling, where dots are placed randomly but are guaranteed to be a minimum distance apart." },
      grayWorldConstancy: { description: "Apply an automatic white balance based on the 'gray-world' assumption, neutralizing any global color cast." }
    },
    "Procedural Manifest": {
      description: "Execute a set of highly detailed, multi-part instructions that define the subject, background, camera, lighting, and post-processing. These complex 'manifests' generate deeply artistic and specific outcomes.",
      hyperbolic_atrium: { description: "Project the subject and their environment into a mind-bending hyperbolic space, reminiscent of an M.C. Escher engraving." },
      meta_liquid_skin: { description: "Create a surreal portrait where the skin's material properties morph and shift based on its curvature, from diffuse to liquid metal." },
      chronos_slices: { description: "Extrude the subject through time, rendering them as a series of parallel slices, each made of a different material." },
      retopo_molt: { description: "Create the illusion of a 3D wireframe 'skin' peeling away from the face to reveal a realistic surface underneath." },
      caustic_projector: { description: "Form the image using only the focused light of caustics, as if projected through moving, distorted glass." },
      voxel_bokeh: { description: "Rasterize the subject into a cloud of translucent 3D pixels (voxels), where depth-of-field emerges from the density of the cloud itself." },
      drape_identity: { description: "Drape a simulated piece of ultra-thin cloth over the subject, inferring their features from the tension and folds of the fabric." },
      csg_chapel: { description: "Carve the portrait using Constructive Solid Geometry (CSG) booleans, creating architectural voids and spaces within the form." },
      lidar_dust_recon: { description: "Reconstruct the portrait from a swirling cloud of animated dust particles, as if captured by a LiDAR scan in a hazy room." },
      hologrid_parallax: { description: "Encode the subject within a semi-transparent 3D lattice, where their form is only revealed through parallax as the camera moves." },
      nonnewtonian_face: { description: "Make the subject's surface behave like a non-Newtonian fluid, hardening on impact and liquefying at rest." },
      nerf_multiview_ghost: { description: "Simulate the unique, ghostly artifacts of a Neural Radiance Field (NeRF) reconstruction, which only resolves into a clear image from a specific viewpoint." },
      mandel_dermis: { description: "Generate skin texture and pores using iterated fractal noise, creating an infinitely detailed and organic surface." },
      prism_identity: { description: "Split the subject into three misaligned RGB passes, as if viewed through a prism, to create a spectral, chromatic aberration effect." },
      papercraft_sections: { description: "Build the portrait from a series of stacked, laser-cut paper contours, like an architectural model." }
    }
  },
  "Conceptual & Narrative": {
    description: "Go beyond aesthetics and re-contextualize your portrait. These styles frame the image within a larger story, a set of rules, or a speculative scenario, turning a simple photo into a piece of narrative art.",
    "Mixed Styles for front and background": {
      description: "Create compelling composite images by combining one distinct artistic style for the subject with a completely different style for the background.",
      renaissance_x_blueprint: { description: "Juxtapose a classical Renaissance oil portrait with a technical, cyan-and-white blueprint background." },
      marbleStatue_x_neonNoir: { description: "Place a timeless, classical marble statue into the rain-soaked, neon-lit alley of a film noir." },
      anime_x_swissGrid: { description: "Combine the expressive, stylized look of an anime character with the clean, minimalist order of a Swiss International design grid." },
      claymation_x_cyanotype: { description: "Set a charming, hand-molded claymation character against the deep, monochromatic blues of a cyanotype print." },
      baroqueGold_x_microprint: { description: "Contrast an opulent, gilded Baroque portrait with the intricate, modern precision of security microprint." },
      toonRamp_x_guilloche: { description: "Merge the flat, bold look of cel-shading with the complex, interwoven linework of banknote guilloch\xE9 patterns." },
      holoFoil_x_blackVoid: { description: "Make a shimmering, iridescent holographic foil subject pop against the infinite depth of a pure black void." },
      photogrammetry_x_risograph: { description: "Combine a high-fidelity, 3D-scanned photogrammetry model with the lo-fi, two-color charm of a Risograph print." },
      chromeLiquid_x_pastelStudio: { description: "Contrast a hyper-reflective, liquid chrome subject with the soft, gentle color gradients of a pastel studio backdrop." },
      sciIllustration_x_bokehNight: { description: "Place a precise, engraved scientific illustration of the subject against the soft, blurry bokeh of city lights at night." },
      wireframe_x_paperCollage: { description: "Set a clean, technical 3D wireframe model against a background of torn, layered, and tactile paper collage." },
      lowPoly_x_gradientField: { description: "Juxtapose a faceted, low-poly 3D subject with a smooth, modern, multi-stop gradient background." },
      sepiaTintype_x_dataTape: { description: "Blend a vintage, wet-plate tintype portrait with the retro-tech aesthetic of data-tape UI elements." },
      sssSkin_x_archViz: { description: "Place a subject with hyperrealistic, subsurface-scattered skin into the clean, minimalist environment of an architectural visualization." },
      legoMinifig_x_blueHour: { description: "Set a glossy, plastic LEGO minifigure against the dramatic, deep blues and light streaks of a blue-hour cityscape." },
      charcoalSketch_x_causticGlass: { description: "Subject: Charcoal portrait with smudged shading and bold contours. Background: Refracted light caustics dancing on a wall as if through rippled glass. Blend: Let caustics spill a little onto shoulders; keep face matte." },
      nprInk_x_hyperrealLab: { description: "Place a stylized, non-photorealistic ink drawing into the hyperrealistic, glossy setting of a modern laboratory." },
      hologramHUD_x_concreteWall: { description: "Project a semi-transparent, futuristic hologram of the subject against the raw, textured surface of a concrete wall." },
      ceramicGlaze_x_forestFog: { description: "Set a portrait with the crazed, glossy finish of glazed ceramic into a moody, atmospheric, and foggy forest." },
      bronzeBust_x_digitalGrid: { description: "Contrast a heavy, patinated bronze bust with a receding, glowing digital wireframe grid." }
    },
    "Documents & Security": {
      description: "Reframe your portrait as an official document or artifact, complete with the textures, stamps, and security features of bureaucratic life.",
      FOIA_redact: { description: "Apply heavy, rectangular black redaction bars, as if the image were part of a declassified government document." },
      watermark_notary: { description: "Embed a semi-transparent, embossed 'NOTARIZED' watermark, giving the image an official, certified look." },
      microprint_border: { description: "Surround the portrait with a security frame made of microprint that appears as a solid line from a distance." },
      guilloche_plate: { description: "Lay intricate, interwoven guilloch\xE9 patterns behind the subject, mimicking the design of currency and certificates." },
      stamp_ink_office: { description: "Add the slightly uneven, ghosting look of overlapping rubber date stamps in classic office ink colors." },
      hologram_id: { description: "Overlay a rectangular, iridescent hologram patch, like those found on ID cards and passports." },
      ocr_tesseract: { description: "Simulate a flatbed scan ready for Optical Character Recognition (OCR), complete with crop marks and text boxes." },
      barcode_pdf417: { description: "Place a dense PDF417 barcode panel next to the portrait, as if it were part of a shipping label or ID." },
      qr_overlay: { description: "Include a crisp QR code in the corner, as if linking to additional verification or information." },
      tamper_evident: { description: "Add a partially peeled, tamper-evident security seal that leaves behind a 'VOID' pattern." },
      watermark_latent: { description: "Embed a subtle, near-invisible latent watermark that is only visible at certain angles, like on high-security documents." },
      cheque_courtesy: { description: "Introduce the microprint lines, dotted boxes, and anti-photocopy screened backgrounds found on a bank cheque." },
      red_ribbon_seal: { description: "Affix a satin red ribbon and an embossed paper seal, as if on a formal diploma or legal document." },
      blue_ink_signature: { description: "Add a realistic, wet-ink blue ballpoint signature with natural pressure variations." },
      docket_header: { description: "Place a formal court docket header at the top, giving the image the context of a legal proceeding." },
      postal_cancellation: { description: "Overlay the wavy lines and circular date stamp of a postal cancellation mark." },
      perforation_edge: { description: "Give the image a perforated edge, as if it were a ticket stub or a stamp." },
      ledger_grid: { description: "Add a pale green or blue accounting ledger grid behind the subject, as if on a page from a logbook." },
      uv_security_fluor: { description: "Sprinkle the image with fluorescent security fibers that would glow under an ultraviolet light." },
      watermark_diagonal_confidential: { description: "Apply a large, low-opacity 'CONFIDENTIAL' watermark diagonally across the image, like a classified document." }
    },
    "Cognitive / memory Forensics": {
      description: "Explore the strange and fascinating artifacts of perception and memory. This category simulates psychological phenomena, turning your portrait into a study of the mind's eye.",
      eideticAfterimage: { description: "Overlay a faint, complementary-color ghost image, mimicking the afterimage that persists after staring at something bright." },
      saccadeTrails: { description: "Draw faint motion streaks between the eyes, mouth, and hands, visualizing the rapid, jerky movements (saccades) of the eye." },
      troxlerFade: { description: "Simulate Troxler's fading, an optical illusion where the periphery of your vision fades away when you fixate on a central point." },
      binocularRivalry: { description: "Create a flickering, patchwork effect that mimics binocular rivalry, where the brain struggles to merge two different images." },
      motionInducedBlindness: { description: "Make small features of the face intermittently 'disappear' when the background is in motion, simulating motion-induced blindness." },
      scotomaMask: { description: "Place a soft, blind-spot-like mask (a scotoma) over part of the image, which is then plausibly 'filled in' by the brain." },
      aphantasiaLowImagery: { description: "Reduce the portrait to a simple line drawing with minimal detail, simulating the 'mind's eye' of someone with aphantasia." },
      pareidoliaClouds: { description: "Make the facial features subtly emerge from an abstract texture, like seeing faces in clouds (pareidolia)." },
      confabulationFill: { description: "Invent plausible but incorrect details where information is missing, mimicking the way the brain confabulates to fill memory gaps." },
      flashbulbMemory: { description: "Recreate the vivid, high-contrast, and emotionally charged look of a 'flashbulb memory' of a significant event." },
      repressionRedactions: { description: "Blur and desaturate emotionally charged regions of the face, as if the memory is being actively repressed." },
      dreamSeam: { description: "Stitch the portrait together from mismatched patches with inconsistent lighting, like the disjointed logic of a dream." },
      memoryPalaceCards: { description: "Annotate the portrait with index cards and keywords, as if it were part of a 'memory palace' mnemonic technique." },
      tipOfTongue: { description: "Mask a crucial feature with question marks, visualizing the frustrating 'tip-of-the-tongue' phenomenon." },
      dejaVuTiling: { description: "Create an eerie sense of familiarity (d\xE9j\xE0 vu) by repeating small, subtle patches of the image." },
      migraineAura: { description: "Superimpose the shimmering, zigzag patterns of a visual migraine aura over part of the image." },
      changeBlindnessDiptych: { description: "Create two almost-identical versions of the portrait and toggle between them, illustrating the difficulty of spotting small changes (change blindness)." },
      emotionalSalienceMap: { description: "Apply a heatmap that highlights the most emotionally salient regions of the face, like the eyes and mouth." },
      reminiscenceBump: { description: "Blend the portrait with an era-specific film stock from the subject's 'reminiscence bump' (ages 10-30), a period we remember most vividly." },
      forgettingCurve: { description: "Fade the image's detail exponentially from the center outward, visualizing the Ebbinghaus forgetting curve." }
    },
    "Narrative Artifacts": {
      description: "Frame your portrait as a fictional or historical object with a story to tell. Each style turns the image into a piece of evidence, a cultural relic, or a mysterious document.",
      mythCartographer: { description: "Interpret the portrait as a lost map from a mythical land, with routes etched on the skin and symbols at scars." },
      embassyOfDreams: { description: "Render the image as a visa to the dream world, complete with entry stamps and a hologram of last night's weather." },
      ghostOfProvenance: { description: "Treat the photo like a museum artifact with a long history, layering it with auction stickers and curator notes." },
      oralHistoryWeave: { description: "Overlay translucent quotes from imaginary witnesses, as if weaving an oral history around the subject." },
      bureaucraticHaunting: { description: "Make the portrait look like a document processed by an extinct, mysterious government ministry." },
      speculativeAutopsy: { description: "Annotate the face like a forensic diagram for an emotion that never existed." },
      climateMuseumLabel: { description: "Display the portrait as an exhibit from a future museum, with a label describing the 'climate-changed' era it came from." },
      folkRemedyPoster: { description: "Turn the image into a village notice for a folk remedy, with hand-drawn diagrams and tear-off blessings." },
      archiveLeak: { description: "Simulate a misfiled dossier from a leaked archive, with contradictory timestamps and cryptic Post-it notes." },
      ritualCalibration: { description: "Treat the portrait as a mystical device that requires ritual alignment, complete with tick marks and candle icons." },
      lichenReader: { description: "Let patterns grow over the image like urban lichens\u2014reading time, stress, and weather. Keep face visible; growth forms act as subtitles of lived conditions." },
      borderlandBallad: { description: "Frame the portrait with handwritten song verses in two dialects that translate each other poorly. Leave deliberate disagreements in meaning; underline where translation fails." },
      planetOfArchives: { description: "Imagine the background as stacks of geological strata made of documents. Each layer carries a tiny card summarizing what the face \u201Cmeant\u201D that century." },
      tenderPropaganda: { description: "Design a soft, caring propaganda poster about being human. Pastel gradients, small promises in the margins, and a seal of a fictive ministry of gentleness." },
      counterfeitMemory: { description: "Issue the image as a \u201Cmemory credit card.\u201D Add EMV-like contacts, microtext of childhood smells, and a spending limit measured in forgiven mistakes." },
      fieldNotesFromTomorrow: { description: "Overlay a scientist\u2019s notebook from five years ahead describing the subject in cautious, kind language. Include sketched thumbnails of alternate futures in the margin." },
      saintOfSmallActs: { description: "Canonize the person as a minor saint of mundane kindness. Add tiny ex-votos (bus tickets, safety pins), a gold leaf halo made from transit maps, and a calendar feast day." },
      rumorAtlas: { description: "Map rumors as isobands around the face. Warm colors = tender rumors; cool colors = sharp rumors. Place a tiny scale bar labeled \u201Cgossip per meter.\u201D" },
      edibleIcon: { description: "Render the portrait as if printed on edible paper for a neighborhood bakery holiday. Include a recipe on the back, visible as a ghost through the sheet." },
      futureArcheologyKit: { description: "Package the image like a specimen in a future archaeology kit, with instructions on how to excavate the subject\u2019s habits without breaking them." }
    },
    "Constraint-Bent Portrait Protocols": {
      description: "Apply a set of rules or 'laws' that the image renderer must obey. The final look emerges not from a style, but from the fascinating consequences of these constraints.",
      causalityFold: { description: "Animate the portrait so shading and shadows update from T+1 back toward T, leaving faint temporal \u201Cunupdates.\u201D Hair motion reverses before the head moves; reflections show the next frame." },
      observerBias: { description: "Increase resolution and material fidelity only in peripheral vision; the center of gaze remains slightly under-detailed. As the viewer looks away, features sharpen where they are not looking." },
      conservationOfSilhouette: { description: "No operation may change the outer silhouette. Lighting, micro-displacement, and materials may morph wildly, but the external contour is preserved; the background absorbs any \u201Cforbidden\u201D expansion as inward dents." },
      topologyBudget: { description: "Face must render with a hard cap on total edges. When detail exceeds the budget, edges are auctioned away: pores fuse, nostrils decimate, cheekbones pixelate into flat facets; wireframe labels show which edges were \u201Csold.\u201D" },
      entropyDrip: { description: "Image entropy must increase over time unless \u201Cremember\u201D events occur. Without interaction, textures smear, UVs stretch, and normals dephase. On clicks or beats, crispness is restored in concentric rings." },
      wavefunctionFace: { description: "Materials are probabilistic per-pixel (skin 60%, ceramic 30%, chrome 10%). The map collapses to a single material only when the viewer hovers or looks directly; elsewhere it remains a dithered superposition." },
      counterfactualReflections: { description: "All reflective and refractive contributions are rendered from a plausible alternate timeline: the reflection smiles when the subject is neutral, blinks when eyes are open, etc. Direct lighting stays truthful." },
      negotiatedLighting: { description: "Background and subject \u201Cnegotiate\u201D photon budget each frame. If the background brightens by 1 EV, the subject dims proportionally, maintaining a constant global exposure; a tiny HUD shows the bargaining result." },
      borrowedAlbedo: { description: "Subject\u2019s albedo must be sampled from the background only (no native color). Skin tones become reprojected patches of wall, floor, signage; geometry stays accurate but color is diegetic collage." },
      vetoedSpecular: { description: "Specular highlights only render on beats not divisible by 3 (or on frames where frameIndex % 6 \u2208 {1,2}). On vetoed frames, specular is clamped to diffuse; produces strobing \u201Ctruth windows\u201D in gloss." },
      scafFold: { description: "Wireframe annotates itself with micro-lemmas: each edge prints the rule justifying its existence (crease, curvature, silhouette, seam). Edges without proof fade out until topology re-justifies them." },
      depthTax: { description: "Every centimeter behind the focal plane costs \u201Cdepth credits.\u201D When the budget is exceeded, far geometry collapses to billboards; near geometry gains tessellation and SSS. The tax HUD shows current spend." },
      antiAliasOath: { description: "Edges cannot exhibit shimmer. To obey, the renderer snaps subpixel motion to a rational grid; micro-jitter is redirected to the background as grain. Motion looks smoothly quantized, like oath-bound AA." },
      puncturedNormals: { description: "Normal vectors are forbidden in a masked region (e.g., a ring across the cheeks). In that band the surface renders only from curvature and AO; specular disappears and forms look embossed, almost paper-cut." },
      auctionedShadows: { description: "Every shadow ray must be purchased. The most \u201Cvaluable\u201D shadows (under nostrils, eye sockets) win the auction; low-value soft shadows fail to render and are replaced by pale placeholders with price tags." },
      parallaxDebate: { description: "Background and subject disagree about camera parallax by a small epsilon. As the camera moves, the subject\u2019s depth cues lead slightly; the background lags, causing intentional micro-parallax dissonance." },
      memoryLeakSSS: { description: "Subsurface scattering radius increases monotonically in regions the viewer stares at, as if \u201Cheat\u201D accumulates. Look away and the radius cools back slowly, leaving ghostly warmth trails in ears and nose." },
      centroidHandoff: { description: "Each frame, a random facial region becomes the \u201Ccentroid owner.\u201D Only that region may move the head\u2019s root transform; everything else must compensate locally. Produces peculiar, believable micro-adjustments." },
      silentCollision: { description: "Collisions do not resolve with impulses; instead, interpenetrations are silently \u201Cpainted over\u201D by borrowing nearby albedo and normals, as if reality covers its mistakes. Works eerily well until the camera rakes across." }
    },
    "What If...": {
      description: "Ask speculative, thought-provoking questions and let the image answer. This category reframes the portrait in fascinating new contexts, turning it into a piece of conceptual art.",
      whatIf_authenticityOutlawed: { description: "What if authenticity is illegal? Render the portrait only via certified proxies: watermark chains, notarized overlays, and compliance margins. Any uncited region must blur or redact itself. Show a provenance sidebar that contradicts one entry." },
      whatIf_faceAsPublicUtility: { description: "What if the face is public infrastructure? Overlay it with transit-like schematics (service lines for gaze, speech, breath). Mark outages and maintenance windows. Background signage uses neutral civic typography; no branding." },
      whatIf_memoryRequiresQuorum: { description: "What if memory needs a quorum? Details appear only if three independent \u201Cwitness annotations\u201D agree. Disagreements render as grayscale placeholders with tally marks and confidence intervals." },
      whatIf_colorBudget: { description: "What if color has a budget? Assign a strict chroma quota to the image. Spend saturation on the most semantically loaded regions; elsewhere, tones desaturate to near-neutral. Display a small color-ledger with remaining credit." },
      whatIf_backgroundOwnsNarrative: { description: "What if the background owns the story? Keep the subject materially plain (matte clay). Shift all metadata, captions, and temporal events into the background: wall notes, taped receipts, light stains indicating prior scenes." },
      whatIf_translationIsLossy: { description: "What if translation must lose information? Render bilingual captions where each language drops a different 12% of meaning. Missing content becomes faint geometric placeholders anchored to the face regions it would have described." },
      whatIf_lawAsRecipe: { description: "What if law compiles to recipes? Express compliance as kitchen operations mapped to facial areas (sift, fold, proof). Add a structured footer: statute \u2192 operation \u2192 outcome, with one deliberate mismatch." },
      whatIf_privacyIsSpatial: { description: "What if privacy is a physical distance? Encode a \u201Cprivacy radius\u201D as depth: regions within R render sharp; outside, features self-abstract to coarse primitives. Draw the radius as a thin measure ring with tick marks." },
      whatIf_ecologyCoauthors: { description: "What if ecology co-authors the image? Let non-human agents introduce legible edits: lichen edge maps on hairlines, fungal gradients in shadow, insect bite perforations that reveal a second, older print beneath." },
      whatIf_receiptsForFeeling: { description: "What if feelings issue receipts? Attach a thermal receipt listing events the image charges you for (attention, care, avoidance) with line-item totals. The receipt must cast a shadow; totals never exactly reconcile with the portrait." },
      whatIf_reflectionIsSovereign: { description: "What if reflections refuse compliance? Mirrors and glossy surfaces render their own timeline. Keep direct light truthful; render specular channels from a slightly divergent pose and expression. Annotate delta as a small vector field." },
      whatIf_timeAsAxis: { description: "What if time runs left\u2192right? Age gradients map horizontally across the face. Background signage shows datelines increasing to the right. Shadows shear accordingly; do not use crossfades." },
      whatIf_rumorErodesMatter: { description: "What if rumor erodes matter? Weather the surface proportionally to \u201Ccirculation.\u201D Highly discussed regions pit and flake; unspoken areas remain sharp. Include a small scale: mm lost per thousand mentions." },
      whatIf_archiveResistsReading: { description: "What if archives resist being read? Paper fibers dodge OCR: lines twist slightly when scanned; redactions leak gentler paraphrases in the margins. Keep one visible staple shadow with missing staple." },
      whatIf_identityLeased: { description: "What if identity is leased, not owned? Stamp lease terms onto the portrait frame (duration, scope, penalties). Expired features gray out with \u201Crevert to default\u201D texture; active regions keep color." },
      whatIf_gravityIsAttention: { description: "What if gravity follows attention? Areas receiving viewer focus physically sag and crease; ignored regions float and simplify. Provide a minimal attention HUD with current \u201Cpull\u201D values." }
    }
  }
};

// src/components/BoothViewer.jsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var getModeDetails = (modeKey) => {
  for (const [categoryName, category] of Object.entries(modes_default)) {
    for (const [subCategoryName, subCategory] of Object.entries(category)) {
      if (subCategory[modeKey]) {
        return {
          ...subCategory[modeKey],
          description: descriptions_default[categoryName]?.[subCategoryName]?.[modeKey]?.description || ""
        };
      }
    }
  }
  return null;
};
var LoadingSpinner = () => /* @__PURE__ */ jsx5("div", { className: "loading-overlay", children: /* @__PURE__ */ jsx5("div", { className: "spinner" }) });
function BoothViewer() {
  const { inputImage, outputImage, isGenerating, activeModeKey, generationError } = store_default.getState();
  const modeDetails = getModeDetails(activeModeKey);
  if (!inputImage) {
    return /* @__PURE__ */ jsx5(ImageUploader, {});
  }
  if (!modeDetails) {
    return /* @__PURE__ */ jsxs5("div", { className: "module-viewer-placeholder", children: [
      /* @__PURE__ */ jsx5("span", { className: "icon", children: "error" }),
      /* @__PURE__ */ jsx5("h2", { children: "Mode not found. Please select a mode from the left." })
    ] });
  }
  return /* @__PURE__ */ jsxs5("div", { className: "booth-viewer", children: [
    /* @__PURE__ */ jsxs5("div", { className: "booth-header", children: [
      /* @__PURE__ */ jsxs5("div", { className: "booth-header-info", children: [
        /* @__PURE__ */ jsxs5("h2", { children: [
          modeDetails.emoji,
          " ",
          modeDetails.name
        ] }),
        /* @__PURE__ */ jsx5("p", { children: modeDetails.description })
      ] }),
      /* @__PURE__ */ jsxs5(
        "button",
        {
          className: "booth-generate-btn",
          onClick: generateImage,
          disabled: isGenerating,
          children: [
            /* @__PURE__ */ jsx5("span", { className: "icon", children: "auto_awesome" }),
            "Generate"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs5("div", { className: "image-previews", children: [
      isGenerating && /* @__PURE__ */ jsx5(LoadingSpinner, {}),
      /* @__PURE__ */ jsxs5("div", { className: "image-container", children: [
        /* @__PURE__ */ jsx5("h4", { children: "Input" }),
        /* @__PURE__ */ jsx5("img", { src: inputImage, alt: "Input" })
      ] }),
      /* @__PURE__ */ jsxs5("div", { className: "image-container", children: [
        /* @__PURE__ */ jsx5("h4", { children: "Output" }),
        outputImage ? /* @__PURE__ */ jsx5("img", { src: outputImage, alt: "Output" }) : /* @__PURE__ */ jsx5("div", { className: "placeholder icon", children: generationError ? "broken_image" : "photo_spark" })
      ] }),
      generationError && /* @__PURE__ */ jsx5("div", { className: "error-message", children: generationError })
    ] })
  ] });
}

// src/components/UserBar.jsx
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function UserBar() {
  const theme = store_default.use.theme();
  return /* @__PURE__ */ jsxs6("div", { className: "user-bar", children: [
    /* @__PURE__ */ jsxs6("div", { className: "user-info", children: [
      /* @__PURE__ */ jsx6("span", { className: "icon", children: "account_circle" }),
      /* @__PURE__ */ jsx6("p", { children: "User" })
    ] }),
    /* @__PURE__ */ jsxs6("div", { className: "user-actions", children: [
      /* @__PURE__ */ jsx6("button", { className: "icon-btn icon", title: "Settings", children: "settings" }),
      /* @__PURE__ */ jsx6(
        "button",
        {
          className: "icon-btn icon",
          onClick: toggleTheme,
          title: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
          children: theme === "dark" ? "light_mode" : "dark_mode"
        }
      )
    ] })
  ] });
}

// src/components/OrchestratorChat.jsx
import { useState as useState2, useEffect, useRef } from "react";
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var AgentTask = ({ message }) => /* @__PURE__ */ jsxs7("div", { className: "agent-task-message", children: [
  /* @__PURE__ */ jsxs7("div", { className: "agent-task-header", children: [
    /* @__PURE__ */ jsx7("span", { className: "icon", children: message.agentIcon }),
    /* @__PURE__ */ jsxs7("h4", { children: [
      message.agentName,
      " is on the job..."
    ] })
  ] }),
  /* @__PURE__ */ jsxs7("div", { className: "agent-task-body", children: [
    /* @__PURE__ */ jsxs7("p", { children: [
      /* @__PURE__ */ jsx7("strong", { children: "Task:" }),
      " ",
      message.task
    ] }),
    /* @__PURE__ */ jsx7("div", { className: "spinner-line", children: /* @__PURE__ */ jsx7("div", { className: "spinner-dot" }) }),
    message.result && /* @__PURE__ */ jsxs7("div", { className: "agent-task-result", children: [
      /* @__PURE__ */ jsx7("strong", { children: "Findings:" }),
      /* @__PURE__ */ jsx7("p", { dangerouslySetInnerHTML: { __html: message.result.replace(/\n/g, "<br />") } })
    ] })
  ] })
] });
function OrchestratorChat() {
  const history = store_default.use.orchestratorHistory();
  const isLoading = store_default.use.isOrchestratorLoading();
  const [input, setInput] = useState2("");
  const historyRef = useRef(null);
  const activeModuleId = store_default.use.activeModuleId();
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history, isLoading]);
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessageToOrchestrator(input);
    setInput("");
  };
  const placeholderText = activeModuleId ? `Message or try /invite @${personalities[activeModuleId]?.name || "Agent"}` : "Select a module to begin...";
  return /* @__PURE__ */ jsxs7("div", { className: "orchestrator-chat-container", children: [
    /* @__PURE__ */ jsxs7("div", { className: "assistant-history", ref: historyRef, children: [
      history.map((msg, index) => {
        if (msg.role === "agent-task") {
          return /* @__PURE__ */ jsx7(AgentTask, { message: msg }, index);
        }
        return /* @__PURE__ */ jsx7("div", { className: `assistant-message ${msg.role}`, children: /* @__PURE__ */ jsx7("p", { dangerouslySetInnerHTML: { __html: msg.parts[0].text.replace(/\n/g, "<br />") } }) }, index);
      }),
      isLoading && /* @__PURE__ */ jsxs7("div", { className: "assistant-message model loading", children: [
        /* @__PURE__ */ jsx7("div", { className: "dot" }),
        /* @__PURE__ */ jsx7("div", { className: "dot" }),
        /* @__PURE__ */ jsx7("div", { className: "dot" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs7("form", { className: "assistant-input-form", onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsx7(
        "input",
        {
          type: "text",
          value: input,
          onChange: (e) => setInput(e.target.value),
          placeholder: placeholderText,
          disabled: isLoading || !activeModuleId,
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsx7("button", { type: "submit", disabled: isLoading || !input.trim(), children: /* @__PURE__ */ jsx7("span", { className: "icon", children: "send" }) })
    ] })
  ] });
}

// src/components/ArchivaDashboard.jsx
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function ArchivaDashboard() {
  return /* @__PURE__ */ jsxs8("div", { className: "archiva-dashboard archiva-home", children: [
    /* @__PURE__ */ jsx8("span", { className: "icon", children: "inventory_2" }),
    /* @__PURE__ */ jsx8("h2", { children: "Welcome to ArchivaAI" }),
    /* @__PURE__ */ jsxs8("p", { children: [
      "This is your space for structured, AI-powered documentation.",
      /* @__PURE__ */ jsx8("br", {}),
      "Select a template from the left to create a new document, or choose an existing document to continue editing."
    ] })
  ] });
}

// src/components/ArchivaSidebar.jsx
import c2 from "clsx";
import { Fragment, jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
function ArchivaSidebar() {
  const entries = store_default((s) => Object.values(s.archivaEntries));
  const activeEntryId = store_default.use.activeEntryId();
  const drafts = entries.filter((e) => e.status === "draft").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const published = entries.filter((e) => e.status === "published").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return /* @__PURE__ */ jsxs9(Fragment, { children: [
    /* @__PURE__ */ jsxs9("div", { className: "semester-group", children: [
      /* @__PURE__ */ jsx9("h2", { children: "Templates" }),
      /* @__PURE__ */ jsx9("div", { className: "module-list", children: Object.entries(templates).map(([key, template]) => /* @__PURE__ */ jsx9(
        "button",
        {
          onClick: () => createNewArchivaEntry(key),
          title: `Create a new ${template.name}`,
          children: /* @__PURE__ */ jsxs9("div", { className: "module-info", children: [
            /* @__PURE__ */ jsx9("span", { className: "icon", children: "add_box" }),
            /* @__PURE__ */ jsx9("p", { children: template.name })
          ] })
        },
        key
      )) })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "semester-group", children: [
      /* @__PURE__ */ jsxs9("h2", { children: [
        "Drafts (",
        drafts.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxs9("div", { className: "module-list", children: [
        drafts.map((entry) => /* @__PURE__ */ jsx9(
          "button",
          {
            className: c2({ active: entry.id === activeEntryId }),
            onClick: () => setActiveEntryId(entry.id),
            children: /* @__PURE__ */ jsxs9("div", { className: "module-info", children: [
              /* @__PURE__ */ jsx9("span", { className: "icon", children: "edit_document" }),
              /* @__PURE__ */ jsx9("p", { children: entry.values.title || "Untitled Entry" })
            ] })
          },
          entry.id
        )),
        drafts.length === 0 && /* @__PURE__ */ jsx9("p", { className: "empty-list-message", children: "No drafts yet." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs9("div", { className: "semester-group", children: [
      /* @__PURE__ */ jsxs9("h2", { children: [
        "Published (",
        published.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxs9("div", { className: "module-list", children: [
        published.map((entry) => /* @__PURE__ */ jsx9(
          "button",
          {
            className: c2({ active: entry.id === activeEntryId }),
            onClick: () => setActiveEntryId(entry.id),
            children: /* @__PURE__ */ jsxs9("div", { className: "module-info", children: [
              /* @__PURE__ */ jsx9("span", { className: "icon", children: "article" }),
              /* @__PURE__ */ jsx9("p", { children: entry.values.title || "Untitled Entry" })
            ] })
          },
          entry.id
        )),
        published.length === 0 && /* @__PURE__ */ jsx9("p", { className: "empty-list-message", children: "No published entries." })
      ] })
    ] })
  ] });
}

// src/components/ArchivaEntryForm.jsx
import { jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
var Field = ({ field, value, onChange }) => {
  const { field_key, label, field_type } = field;
  const renderInput = () => {
    switch (field_type) {
      case "date":
        return /* @__PURE__ */ jsx10("input", { type: "date", value, onChange });
      case "string":
        return /* @__PURE__ */ jsx10("input", { type: "text", value, onChange });
      case "markdown":
      case "multiline":
        return /* @__PURE__ */ jsx10("textarea", { value, onChange });
      case "code":
        return /* @__PURE__ */ jsx10("textarea", { className: "code", value, onChange });
      default:
        return /* @__PURE__ */ jsx10("input", { type: "text", value, onChange });
    }
  };
  return /* @__PURE__ */ jsxs10("div", { className: "form-field", children: [
    /* @__PURE__ */ jsx10("label", { htmlFor: field_key, children: label }),
    renderInput()
  ] });
};
function ArchivaEntryForm() {
  const activeEntryId = store_default.use.activeEntryId();
  const entry = store_default((s) => s.archivaEntries[activeEntryId]);
  if (!entry) {
    return /* @__PURE__ */ jsx10("div", { children: "Error: Entry not found." });
  }
  const template = templates[entry.templateKey];
  const handleFieldChange = (fieldKey, value) => {
    updateArchivaEntry(activeEntryId, fieldKey, value);
  };
  return /* @__PURE__ */ jsxs10("div", { className: "archiva-entry-form", children: [
    /* @__PURE__ */ jsxs10("div", { className: "archiva-form-header", children: [
      /* @__PURE__ */ jsxs10("div", { className: "archiva-form-header-title", children: [
        /* @__PURE__ */ jsx10("h2", { children: entry.values.title || template.name }),
        /* @__PURE__ */ jsxs10("p", { children: [
          "Status: ",
          /* @__PURE__ */ jsx10("span", { className: `status-${entry.status}`, children: entry.status })
        ] })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "archiva-form-actions", children: [
        /* @__PURE__ */ jsxs10("button", { className: "back-btn", onClick: clearActiveEntryId, children: [
          /* @__PURE__ */ jsx10("span", { className: "icon", children: "close" }),
          " Close"
        ] }),
        /* @__PURE__ */ jsx10("button", { className: "secondary", onClick: () => updateArchivaEntryStatus(activeEntryId, "draft"), children: "Save as Draft" }),
        /* @__PURE__ */ jsx10("button", { className: "primary", onClick: () => updateArchivaEntryStatus(activeEntryId, "published"), children: "Publish" })
      ] })
    ] }),
    /* @__PURE__ */ jsx10("div", { className: "archiva-form-content", children: template.fields.map((field) => /* @__PURE__ */ jsx10(
      Field,
      {
        field,
        value: entry.values[field.field_key],
        onChange: (e) => handleFieldChange(field.field_key, e.target.value)
      },
      field.field_key
    )) })
  ] });
}

// src/components/ModuleViewer.jsx
import { jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
function ModuleViewer() {
  const activeModuleId = store_default.use.activeModuleId();
  if (!activeModuleId) {
    return null;
  }
  const module = modules[activeModuleId];
  const personality = personalities[activeModuleId];
  return /* @__PURE__ */ jsxs11("div", { className: "module-viewer", children: [
    /* @__PURE__ */ jsxs11("div", { className: "module-viewer-header", children: [
      /* @__PURE__ */ jsxs11("div", { className: "module-viewer-title", children: [
        /* @__PURE__ */ jsx11("h2", { children: personality.name }),
        /* @__PURE__ */ jsxs11("p", { children: [
          module["Module Code"],
          " - ",
          personality.title
        ] })
      ] }),
      /* @__PURE__ */ jsxs11("div", { className: "module-connectors", children: [
        /* @__PURE__ */ jsx11("button", { className: "icon-btn", title: "Figma", children: /* @__PURE__ */ jsx11("span", { className: "icon", children: "design_services" }) }),
        /* @__PURE__ */ jsx11("button", { className: "icon-btn", title: "GitHub", children: /* @__PURE__ */ jsx11("span", { className: "icon", children: "code" }) }),
        /* @__PURE__ */ jsx11("button", { className: "icon-btn", title: "Notion", children: /* @__PURE__ */ jsx11("span", { className: "icon", children: "article" }) }),
        /* @__PURE__ */ jsx11("button", { className: "icon-btn", title: "Google Drive", children: /* @__PURE__ */ jsx11("span", { className: "icon", children: "folder_open" }) }),
        /* @__PURE__ */ jsx11("button", { className: "icon-btn", title: "Documentation", children: /* @__PURE__ */ jsx11("span", { className: "icon", children: "description" }) }),
        /* @__PURE__ */ jsx11(
          "button",
          {
            className: "icon-btn assistant-chat-icon",
            onClick: toggleAssistant,
            title: `Chat with ${personality.name}`,
            children: /* @__PURE__ */ jsx11("span", { className: "icon", children: "chat" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs11("div", { className: "module-viewer-content", children: [
      /* @__PURE__ */ jsxs11("div", { children: [
        /* @__PURE__ */ jsx11("h3", { children: "Key Contents & Topics" }),
        /* @__PURE__ */ jsx11("p", { children: module["Key Contents / Topics"] })
      ] }),
      /* @__PURE__ */ jsxs11("div", { children: [
        /* @__PURE__ */ jsx11("h3", { children: "Qualification Objectives" }),
        /* @__PURE__ */ jsx11("ul", { children: module["Qualification Objectives"].map((obj, i) => /* @__PURE__ */ jsx11("li", { children: obj }, i)) })
      ] })
    ] })
  ] });
}

// src/components/Assistant.jsx
import { useState as useState3, useEffect as useEffect2, useRef as useRef2 } from "react";
import { jsx as jsx12, jsxs as jsxs12 } from "react/jsx-runtime";
function Assistant() {
  const assistantHistories = store_default.use.assistantHistories();
  const activeModuleId = store_default.use.activeModuleId();
  const history = assistantHistories[activeModuleId] || [];
  const isLoading = store_default.use.isAssistantLoading();
  const [input, setInput] = useState3("");
  const historyRef = useRef2(null);
  const activePersonality = personalities[activeModuleId] || {};
  useEffect2(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history, isLoading]);
  const handleSubmit = (e) => {
    e.preventDefault();
    sendAssistantMessage(input);
    setInput("");
  };
  return /* @__PURE__ */ jsx12("div", { className: "assistant-overlay", onClick: toggleAssistant, children: /* @__PURE__ */ jsxs12("div", { className: "assistant-window", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs12("div", { className: "assistant-header", children: [
      /* @__PURE__ */ jsx12("span", { className: "icon assistant-icon", children: activePersonality.icon || "school" }),
      /* @__PURE__ */ jsxs12("div", { className: "assistant-header-text", children: [
        /* @__PURE__ */ jsx12("h3", { children: activePersonality.name || "Assistant" }),
        /* @__PURE__ */ jsx12("h4", { children: activePersonality.title || "Your creative partner" })
      ] }),
      /* @__PURE__ */ jsx12("button", { className: "close-btn", onClick: toggleAssistant, children: /* @__PURE__ */ jsx12("span", { className: "icon", children: "close" }) })
    ] }),
    /* @__PURE__ */ jsxs12("div", { className: "assistant-history", ref: historyRef, children: [
      history.map((msg, index) => /* @__PURE__ */ jsx12("div", { className: `assistant-message ${msg.role}`, children: /* @__PURE__ */ jsx12("p", { dangerouslySetInnerHTML: { __html: msg.responseText || msg.content } }) }, index)),
      isLoading && /* @__PURE__ */ jsxs12("div", { className: "assistant-message model loading", children: [
        /* @__PURE__ */ jsx12("div", { className: "dot" }),
        /* @__PURE__ */ jsx12("div", { className: "dot" }),
        /* @__PURE__ */ jsx12("div", { className: "dot" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs12("form", { className: "assistant-input-form", onSubmit: handleSubmit, children: [
      /* @__PURE__ */ jsx12(
        "input",
        {
          type: "text",
          value: input,
          onChange: (e) => setInput(e.target.value),
          placeholder: `Ask ${activePersonality.name} for project ideas...`,
          disabled: isLoading,
          autoFocus: true
        }
      ),
      /* @__PURE__ */ jsx12("button", { type: "submit", disabled: isLoading || !input.trim(), children: /* @__PURE__ */ jsx12("span", { className: "icon", children: "send" }) })
    ] })
  ] }) });
}

// src/components/App.jsx
import { Fragment as Fragment2, jsx as jsx13, jsxs as jsxs13 } from "react/jsx-runtime";
var ModuleSelector = () => {
  const activeModuleId = store_default.use.activeModuleId();
  return /* @__PURE__ */ jsx13(Fragment2, { children: Object.entries(modulesBySemester).map(([semester, modules2]) => /* @__PURE__ */ jsxs13("div", { className: "semester-group", children: [
    /* @__PURE__ */ jsx13("h2", { children: semester }),
    /* @__PURE__ */ jsx13("div", { className: "module-list", children: modules2.map((module) => {
      const personality = personalities[module["Module Code"]];
      return /* @__PURE__ */ jsx13(
        "button",
        {
          onClick: () => selectModule(module["Module Code"]),
          className: c3({ active: module["Module Code"] === activeModuleId }),
          children: /* @__PURE__ */ jsxs13("div", { className: "module-info", children: [
            /* @__PURE__ */ jsx13("span", { className: "icon", children: personality?.icon || "school" }),
            /* @__PURE__ */ jsx13("p", { children: personality?.name || module["Module Title"] })
          ] })
        },
        module["Module Code"]
      );
    }) })
  ] }, semester)) });
};
function App() {
  const isWelcomeScreenOpen = store_default.use.isWelcomeScreenOpen();
  const activeApp = store_default.use.activeApp();
  const theme = store_default.use.theme();
  const activeModuleId = store_default.use.activeModuleId();
  const isAssistantOpen = store_default.use.isAssistantOpen();
  const activeEntryId = store_default.use.activeEntryId();
  const handleStart = () => {
    store_default.setState({ isWelcomeScreenOpen: false });
  };
  const renderLeftColumnContent = () => {
    switch (activeApp) {
      case "ideaLab":
        return /* @__PURE__ */ jsx13(ModuleSelector, {});
      case "imageBooth":
        return /* @__PURE__ */ jsx13(ModeSelector, {});
      case "archiva":
        return /* @__PURE__ */ jsx13(ArchivaSidebar, {});
      default:
        return null;
    }
  };
  const renderRightColumnContent = () => {
    switch (activeApp) {
      case "ideaLab":
        return /* @__PURE__ */ jsx13(OrchestratorChat, {});
      case "imageBooth":
        return /* @__PURE__ */ jsx13(BoothViewer, {});
      case "archiva":
        return activeEntryId ? /* @__PURE__ */ jsx13(ArchivaEntryForm, {}) : /* @__PURE__ */ jsx13(ArchivaDashboard, {});
      default:
        return null;
    }
  };
  const isThreeColumnLayout = activeApp === "ideaLab" && activeModuleId;
  return /* @__PURE__ */ jsxs13("main", { "data-theme": theme, className: c3({ "three-column": isThreeColumnLayout }), children: [
    isWelcomeScreenOpen && /* @__PURE__ */ jsx13(WelcomeScreen, { onStart: handleStart }),
    isAssistantOpen && /* @__PURE__ */ jsx13(Assistant, {}),
    /* @__PURE__ */ jsxs13("div", { className: "left-column", children: [
      /* @__PURE__ */ jsx13(AppSwitcher, {}),
      /* @__PURE__ */ jsx13("div", { className: "left-column-content", children: renderLeftColumnContent() }),
      /* @__PURE__ */ jsx13(UserBar, {})
    ] }),
    isThreeColumnLayout && /* @__PURE__ */ jsx13("div", { className: "middle-column", children: /* @__PURE__ */ jsx13(ModuleViewer, {}) }),
    /* @__PURE__ */ jsx13("div", { className: "right-column", children: renderRightColumnContent() })
  ] });
}

// index.tsx
import { jsx as jsx14 } from "react/jsx-runtime";
createRoot(document.getElementById("root")).render(/* @__PURE__ */ jsx14(App, {}));
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
