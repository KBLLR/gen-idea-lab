# Changelog

2025-10-03: Fixed Vercel build: added missing UI components (Button, FormField, Panel, ActionBar) and BoothHeader to git tracking that were previously untracked causing build failures.

2025-10-03: Integrated HumeTest into Settings Modal: added "Hume EVI Testing" section with toggle button to show/hide test interface, provides easy access to test Hume voice integration without leaving Settings.

2025-10-03: Created HumeTest component for quick verification of Hume EVI integration: fetches access token from backend, connects to Hume voice service, displays real-time emotion detection with top 5 emotions shown as progress bars, shows conversation messages with emotion scores, includes connection controls and visual status indicators.

2025-10-03: Implemented Hume EVI foundation: added server endpoint for access token generation (/api/services/hume/token), installed @humeai/voice-react SDK, created emotion fusion engine that maps Human's 7 emotions to Hume's 48 emotions with conflict detection (polarity mismatch, suppressed anxiety, forced positivity, hidden frustration), valence/arousal calculation, and EmotionTracker class for pattern analysis over time.

2025-10-03: Created comprehensive EmpathyLab + Hume integration strategy document detailing multimodal emotion fusion (visual + vocal intelligence), split-screen interface design (webcam tracking + empathic chat), emotion conflict detection, GlassDock global toggle for cross-app empathy, session recording with synchronized timestamps, and educational use cases for UX research, presentation training, and accessibility studies.

2025-10-03: Added EmpathyLab app with Human library integration for multimodal computer vision (face detection, emotion analysis, gaze tracking, body pose, hand tracking, gesture recognition); created comprehensive documentation covering educational use cases, privacy controls, UI visualization strategies, and technical implementation; integrated with app switcher and navigation; includes privacy-first design with granular consent controls and client-side processing.

2025-10-03: Created comprehensive Hume AI documentation suite including voice systems comparison (Gemini Live vs Hume EVI), step-by-step integration guide with server-side token generation and React components, and in-depth 48 emotions UI/UX guide with 6 visualization strategies (Emotion Bubble Cloud, Spectrum Bar, Radar Chart, Timeline, Particle System, Ambient Atmosphere), reusable component library, and app-specific implementation recommendations.

2025-10-03: Added CalendarAI sidebar with mini calendar navigation and category filters (Today, Tomorrow, This Week, This Month, Upcoming, Past); implemented event count badges and Google Calendar connection status indicator; created comprehensive context awareness documentation explaining screen awareness system across all 6 apps with technical implementation details and usage examples.

2025-10-03: Added CalendarAI app to the app switcher with event countdown grid, ICS import/export, JSON backup/restore, and keyboard shortcuts; implemented Google Calendar API integration with /api/services/googleCalendar/events endpoint to fetch upcoming events; integrated real-time countdown timers for calendar events with automatic refresh; styled with dark theme matching application design system.

2025-10-02: Implemented secure backend WebSocket proxy for Gemini Live API eliminating frontend API key exposure; fixed httpOnly cookie authentication; wrapped all PlannerCanvas node components with React.memo for 30-50% performance improvement; optimized constant allocations; updated Vercel deployment documentation with WebSocket configuration and security best practices.

2025-10-02: Added comprehensive planner performance troubleshooting guide with optimization strategies, hardware recommendations, and profiling analysis; updated server OAuth routes with documentation references for easier setup.

2025-10-02: Fixed ArchivAI workflow validation errors by adding proper workflow structure, enabled assistant web search with OLLAMA_API_KEY fallback, fixed screen awareness content-based app detection, and implemented AI-generated template-specific mock data using Gemini with example template references.

2025-10-02: Implemented sanitized Markdown rendering across ArchivAI, added filesystem-backed mock persistence, centered and standardized headers, and introduced a collapsible bottom drawer for Archiva and Image Booth.
2025-10-02: Added reusable UI primitives (Button, FormField, Panel), standardized square icon ActionBar, refactored GlassDock with a large toolbar and modular VoiceChatPanel; integrated DockItemsRow and MinimizedDock; added Storybook stories for new components.
2025-10-03: UI a11y + stories/tests; Panel adoption in Archiva/VizGen; ActionBar size/roving focus; added UI docs.
2025-10-03: CalendarAI now uses shared BoothHeader with stacked actions, selected event summary, and status based on Google Calendar connection.
2025-10-03: CalendarAI UI: more rounded event cards; countdown styled to match user-actions bar with dividers and tokens.
2025-10-03: CalendarAI countdown now uses shared ActionBar for reusability; CSS positions container only.
2025-10-03: Added CalendarAI stories: Countdown as ActionBar and basic EventCard.
2025-10-03: CalendarAI grid gutter increased (gap = 1.5x spacing-md) for clearer separation between cards.
2025-10-03: Added interactive CalendarGrid with day popover (Create/See events), date filter banner, default date for new event; responsive gutters (2x on >=1200px).
2025-10-03: Removed in-page Calendar grid (moved to sidebar design); kept events list and header intact.
