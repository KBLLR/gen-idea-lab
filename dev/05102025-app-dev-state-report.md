# 05102025 App Dev State Report

This document provides a high-level overview of the GenBooth project as of October 5, 2025. It is intended to serve as a baseline for future documentation and development efforts.

## 1. Tech Stack

*   **Frontend:** React, Vite, Storybook, Zustand, React Flow, Three.js
*   **Backend:** Node.js, Express
*   **Authentication:** JWT, Google OAuth
*   **Database:** MongoDB
*   **AI/ML:** Google Gemini, OpenAI, Ollama, Hume AI, MediaPipe
*   **Styling:** Style Dictionary, CSS Modules, SCSS
*   **Testing:** Jest, Vitest, React Testing Library

## 2. Architecture

The application is a full-stack React + Express project.

*   **Frontend (`src`):** The frontend is a modern React application built with Vite. It uses Zustand for state management, React Flow for building node-based UIs, and Three.js for 3D graphics. Storybook is used for UI component development and testing.
*   **Backend (`server.js`):** The backend is a Node.js application built with Express. It handles authentication, API proxying to various AI services, and database interactions with MongoDB.
*   **Authentication:** Authentication is handled via JWTs, with Google OAuth as the primary authentication provider.
*   **AI/ML Integrations:** The application is integrated with a variety of AI/ML services, including Google Gemini, OpenAI, Ollama, Hume AI, and MediaPipe. All AI provider calls are proxied through the backend.
*   **Styling:** The application uses a design token-based styling system managed by Style Dictionary. Components are styled using a combination of CSS Modules and SCSS.

## 3. Key Features

*   **Idea Lab:** A space for exploring and developing ideas, with a focus on multi-agent collaboration.
*   **Image Booth:** A tool for generating images using various AI models.
*   **Archiva:** A knowledge base and documentation system.
*   **Workflows:** A tool for creating and managing automated workflows.
*   **Planner:** A node-based planning tool.
*   **CalendarAI:** An AI-powered calendar assistant.
*   **Empathy Lab:** A tool for analyzing and understanding emotions in video and audio.
*   **Gesture Lab:** A tool for experimenting with gesture-based UI control.
*   **Glass Dock:** A floating, voice-activated orchestrator that provides access to various tools and services.

## 4. `/docs/git-references` Directory

The `/docs/git-references` directory contains several subdirectories that appear to be complete copies of other Git repositories. This is not a recommended practice for the following reasons:

*   **Version Control:** It is difficult to track the history of these sub-projects and keep them updated.
*   **Repository Bloat:** It significantly increases the size of the main repository.
*   **Confusion:** It is unclear if this code is used directly or is just for reference.

**Recommendation:** Replace the `/docs/git-references` directory with either:
*   **Git Submodules:** If the code is used directly, Git submodules are a good way to include external repositories in a project.
*   **Markdown Links:** If the code is just for reference, a markdown file with links to the external repositories would be a better solution.

## 5. Next Steps for Documentation

With this "Current State" document as a baseline, the following steps are recommended for improving the project's documentation:

1.  **Prioritize Critical Documents:** Focus on updating the high-level architecture and integration guides to reflect the current state of the project.
2.  **Establish a Documentation Process:** Implement a "docs-as-code" approach, where documentation is treated like code and updated as part of the development process.
3.  **Automate Documentation:** Where possible, use tools to automatically generate documentation from the code.
4.  **Regular Audits:** Periodically review the documentation to ensure its accuracy.
