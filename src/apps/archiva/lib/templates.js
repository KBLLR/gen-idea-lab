/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Type } from '@google/genai';

// This file translates the provided markdown templates into a structured schema
// that can be used to dynamically generate forms in the Archiva app.

export const templates = {
    Study_Archive: {
        name: "Study Archive",
        type: "Reflective",
        purpose: "Track what you’ve learned over time",
        fields: [
            { field_key: "date", label: "Date", field_type: "date", required: true },
            { field_key: "title", label: "Title", field_type: "string", required: true },
            { field_key: "learning_outcomes", label: "Learning Outcomes", field_type: "markdown", required: false },
            { field_key: "artifacts_references", label: "Artifacts / References", field_type: "markdown", required: false },
            { field_key: "reflection", label: "Reflection", field_type: "markdown", required: false },
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "7. Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
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
            { field_key: "tags_keywords", label: "Tags / Keywords", field_type: "string", required: false },
        ]
    }
};