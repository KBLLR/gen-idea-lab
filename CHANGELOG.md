# Changelog

2025-10-07: Dev auth bypass, pane layout, store refactor, ActionBar cleanup, COOP headers
- Dev-only auth bypass: added .env.development.local with VITE_AUTH_BYPASS=1 and AUTH_BYPASS=1. Client seeds a dev user and skips the login gate when VITE_AUTH_BYPASS=1. Server requireAuth/optionalAuth short-circuit when AUTH_BYPASS=1 and inject a dev user.
- Pane providers and conditional layout: wrapped app with LeftPaneProvider and RightPaneProvider. Render left/right columns only when pane content exists. Added useLeftPaneNode/useRightPaneNode hooks to detect pane presence safely.
- App-owned sidebars: moved sidebars to their corresponding apps via useLeftPane. CalendarAI (CalendarAISidebar), GestureLab (GestureLabSidebar), EmpathyLab (EmpathyLabSidebar), Archiva (ArchivaSidebar), Planner (PlannerSidebar). Chat and Workflows use the right pane.
- Store refactor: lifted createAuthSlice, createServiceConnectionSlice, and createAppSwitchingSlice to top-level so per-key selectors (useStore.use.user, useStore.use.activeApp, etc.) are generated. Introduced actions proxy to preserve state.actions.* usage. Added setDockPosition/setDockDimensions and toggleKnowledgeSection/setShowKnowledgeSection.
- ActionBar normalization: standardized DS ActionBar API to items = [{ id, label, icon, onClick }]; fixed aria-label casing; removed unsupported showDividers prop; added stable keys for list items in ModuleViewer and related lists to resolve React key warnings.
- COOP/COEP dev headers: ensured Vite dev server and Storybook add headers Cross-Origin-Opener-Policy: same-origin-allow-popups and Cross-Origin-Embedder-Policy: unsafe-none to avoid noisy postMessage warnings and keep OAuth popups working.
2025-10-06: DS + Orchestrator + Server inversion
- Orchestrator → Tasks ingestion: added normalizeTask, upsertTasksFromAgent, extractTasksFromMarkdown; added ingestPlanAsTasks(plan) and exported storeApi; Kanban can now ingest agent plans and docs.
- Design System primitives: implemented ActionBar, SidebarItemCard, StatCard with polymorphic ref-forward, tokens-only CSS, and stories; added icon-only variant to ActionBar; migrated key callsites to @ui.
- Storybook visual tests: added Playwright snapshots for Button, Panel, ActionBar, SidebarItemCard, StatCard.
- CalendarAI: countdown now rendered via DS ActionBar using children for stability.
- Server flip: centralized boot at server/index.js (calls startServer from server.js).
- Server imports: pointed server.js to src/shared/lib/{logger,secureTokens,metrics,auth,liveApiProxy,db}.
- Chat routes extracted to server/routes/chat.js and mounted under /api.
- Additional server modularization: extracted models (GET /api/models, GET /api/ollama/models), embeddings (POST /api/embeddings/ollama), tools (web search + ollama web_search/web_fetch/search + POST /api/search), module-chats (save/list), and planner (POST /api/planner/generate-from-context) into server/routes/* and mounted under /api.

2025-10-06: Micro-app slugs unified to lowercase (idealab, imagebooth, calendarai, empathylab, gesturelab, planner, archiva, workflows, chat). Router and server SPA fallbacks updated; added VITE_DEFAULT_APP env toggle for optional / → /idealab redirect this sprint while retaining legacy shell at /. Added route helpers via @routes (getAppPath/getAppIdFromPath) with a single APP_ID→slug map.

2025-10-06: Centralized Zustand store behind @store with persist + selector functions; left src/lib/store.js as a shim for one release cycle. Introduced Vite aliases: @ui (design system), @shared, @routes, @store, @apps. Began DS extraction: added src/design-system with tokens, utilities, and first batch shims (Button, ActionBar, SidebarItemCard, StatCard, Panel, ImageViewer, SidebarTooltip). Old UI paths remain for now; ESLint rule added to forbid new imports from src/components/ui.

2025-10-06: Server modularization: extracted auth, university, services, and image routes into separate files in `server/routes` directory. Created `server/config/env.js` for URL and environment helpers.

2025-10-06: Server modularization: extracted auth, university, and image routes into separate files in `server/routes` directory. Created `server/config/env.js` for URL and environment helpers.

2025-10-05: Added GestureLab app for hand tracking UI experiments: pinch-to-draw whiteboard using MediaPipe Hands, real-time hand landmark visualization with cyan skeleton overlay, smoothed drawing with configurable stroke width, glass-style controls matching design system, sidebar with gesture guide and tips; supports up to 2 hands tracking with 21 landmarks per hand; dynamically loads MediaPipe CDN scripts, includes small video preview in corner, clear canvas function, error handling for camera permissions.
2025-10-05: GestureLab polish: corrected MediaPipe drawing utils usage (drawConnectors/drawLandmarks) and aligned SidebarItemCard props for gestures/examples.
2025-10-05: GestureLab header + layout: adopted BoothHeader with Start/Stop/Clear actions in the header actions slot; canvas now fills remaining space; added draggable glass preview window for hand-tracking video.
2025-10-05: GestureLab switched to MediaPipe Tasks Vision ESM import (@mediapipe/tasks-vision) and loads only WASM assets from CDN; removed dynamic script loader and camera preview (landmarks-only overlay on whiteboard); added gesture mode buttons with selected state (Pinch/Fist/Two Hands/Open Palm) and gated drawing to Pinch.
2025-10-05: GestureLab: theme-aware whiteboard + eraser mode. Whiteboard background follows theme (light/dark), hand overlay colors invert for contrast, and Fist gesture erases using destination-out compositing. Footer brush palette pins to bottom; canvas grows to fill remaining space.
2025-10-05: GestureLab: footer actions (Save, Upload, Gallery) added using user-actions styling. Save downloads PNG and stores to an in-memory gallery; Upload sets a background image (contained) under strokes; Gallery shows saved thumbnails with download and set-as-background options.
2025-10-05: GestureLab: added Eraser control with three sizes (8/12/20). Selecting an eraser size activates erase mode (Fist) and uses destination-out compositing for clean removal. Footer actions aligned to the right; palette and brush/eraser controls on the left.
2025-10-05: GestureLab Sidebar: removed redundant “Supported Gestures” panel (controls exist in header); moved example descriptions into About; changed Examples to toggle-row design consistent with EmpathyLab’s sidebar (reusing SidebarToggleItemCard).
2025-10-05: GestureLab 3D Stellar: integrated Three.js scene with star core, dust field, aura sprite, dynamic flare lines, and post-processing (bloom + afterimage). Added pulse() and rotate(dx, dy) APIs and wired fist → pulse and two-hands → rotate. Sidebar “Examples” now controls mode (Whiteboard vs 3D Navigation) exclusively.
2025-10-05: GestureLab 3D overlay: render hand landmarks above the Stellar scene (red theme), fixed sizing when whiteboard canvas isn’t present, and relaxed loop guard to allow overlay-only rendering in 3D.
2025-10-05: GestureLab UI Control: added interactive UI canvas with tiles (Wi‑Fi/Lights/Music) and a volume slider. Mirrored pointer aligned to landmarks; pinch to toggle tiles or set volume. Implemented ref-based hover/press/bounce states with springy animations for tiles and knob. Fixed draw guard to avoid errors when non-whiteboard modes are active.
2025-10-05: Module Assistant Chat: added model selector (Gemini + service-aware models for Ollama/OpenAI/Claude) and per‑module system prompt editor. sendAssistantMessage now uses selected model + override prompt. Added Save button to persist current chat in module profile.

2025-10-05: EmpathyLab layout restructure: removed middle AllEmotionsList column for 2-panel layout (camera + chat) with more space; added EmotionsFooter component showing top 10 active emotions as horizontal scrollable chips with icons, colors, and percentage scores; each panel now has dedicated footer (camera: StatsRow stats, chat: EmotionsFooter with emotion chips).

2025-10-05: Redesigned HumeVoiceChat to match empathic-ai UI pattern: scrollable messages with emotion cards (top 3 emotions as colored progress bars at bottom of each message), floating controls bar at bottom with gradient fade, MicFFT audio visualization (24-bar SVG using real FFT data from Hume), mute toggle button, cleaner layout with auto-scroll on new messages; emotion cards use Hume's official color palette and show emotion name + percentage + animated progress bar.

2025-10-05: EmpathyLab enhancements: added AllEmotionsList component displaying all 52 Hume emotions with real-time sorting (active emotions at top), emotion-specific icons and colors from Hume's official color palette, circular color indicators, scrollable list with overflow handling; integrated sci-fi GazeOverlay (animated SVG with pulsing focus point, direction line, strength display) and EmotionFusionDisplay (multimodal analysis with conflict detection, valence/arousal metrics); added comprehensive sidebar visualization controls (9 overlay toggles including face mesh, gaze, body/hand skeletons, advanced overlays); fixed real-time overlay toggling via useRef pattern in useHumanWebcam hook; fixed loading state stuck on stop; added extensive Hume debug logging for connection troubleshooting; fixed 3-panel grid layout overflow by adding proper flex constraints to Panels (min-height: 0, overflow-y: auto on .image-content) ensuring emotion analysis column is scrollable and stats bar always visible as footer.

2025-10-03: Added reusable ImageViewer (image/camera modes) and useHumanWebcam hook with requestVideoFrameCallback fallback and device picker support; integrated EmpathyLab to use the hook (clean start/stop, smoother loop, selectable camera) and replaced VideoFrame usage to centralize canvas/video rendering; added Storybook stories for ImageViewer (image, camera placeholder, canvas overlay mock).

2025-10-03: Added WebcamStream component docs and stories; created Empathy/StatsRow story. WebcamStream wraps useHumanWebcam for a self-contained camera + overlay experience and is intended for EmpathyLab and related apps.

2025-10-03: Designed glassy stat cards for EmpathyLab StatsRow (stat-card--glass) with backdrop blur, glass border/shadow, and subtle hover micro-interaction; added Storybook variant to preview the glass style.

2025-10-03: Extracted reusable StatCard component and refactored StatsRow to use it. Added StatCard stories (solid, glass, grid) and short docs.

2025-10-03: Updated StatCard layout to a two-row design (top: icon + value, bottom: label) and added default per-icon colors with optional override.

2025-10-03: IdeaLab spacing tokens pass (Module Viewer): replaced hard-coded px with 8px-based tokens for padding, gaps, and list spacing in `.module-viewer`, header, connectors, info row, and content (using `--panel-padding-*`, `--space-*`, and semantic typography tokens).

2025-10-03: Implemented full multimodal EmpathyLab integration with Hume EVI + Human library: created HumeVoiceChat component with purple wave animations (#6e42cc), EmotionFusionDisplay combining facial + vocal emotions with conflict detection, GazeOverlay for eye tracking visualization (bearing/strength/focus point); added advanced Human library features following official demo patterns (result interpolation via human.next(), real-time FPS monitoring with 30-frame rolling average, TensorFlow tensor memory tracking, enhanced config with minConfidence/maxDetected/warmup); integrated session storage with 4 API endpoints (POST/GET/DELETE /api/empathylab/sessions) storing metadata in-memory Map (MongoDB-ready schema); added Save Session and Export JSON buttons to UI; updated orchestrator context with comprehensive EmpathyLab capabilities (7 facial emotions, 48 voice emotions, gaze tracking, multimodal fusion, use cases); fixed server.js duplicate variable declaration; updated Vite config COOP headers to 'same-origin-allow-popups'; all processing local in browser, privacy-first design.

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

2025-10-03: Sidebar calendar: added day click tooltip with 'Create event' and 'See events' actions; integrates with CalendarAI via localStorage + setActiveApp.

2025-10-03: Sidebar day-actions tooltip: raised z-index and increased semi-solid backgrounds (dark/light) with hover; added backdrop blur.

2025-10-03: Sidebar tooltip now closes on outside click and Escape; added dialog role and ref containment.

2025-10-03: Sidebar tooltip positioned to the right of day; vertical stack; added caret arrow matching theme.
2025-10-03: Docs: added sidebar pattern and Storybook Episode 2 plan; linked from README and AGENTS.md.
2025-10-03: Storybook: added AppSwitcher and UserBar stories using real store/actions (no mocks).
2025-10-03: Storybook: added small sidebar element stories (MiniCalendarHeader, DayActionsTooltip, SidebarCategoryItem, CalendarConnectionStatus).
2025-10-03: EmpathyLab: extracted VideoFrame and RecordingIndicator; replaced inline markup; added aria-live to error display; added presentational components + Storybook stories (ConsentItem, UseCaseItem).
2025-10-03: EmpathyLabSidebar layout: enforce single-column rows (full-width panels), remove nested scrolling for cleaner sidebar behavior.
2025-10-03: EmpathyLabSidebar restructure: sticky top preset bar, Tracking Permissions panel only, sticky privacy banner; removed Use Cases/About from sidebar.
2025-10-03: EmpathyLab: wrapped VideoFrame in Panel titled 'Webcam Viewer'; sidebar now shows individual consent mini-cards (no permissions panel wrapper).
2025-10-03: Fix HumeTest rendering: guard against object children (status, message.role/content); normalize to strings to avoid React object child error).
2025-10-03: Fix Hume connect(): pass default audioConstraints to avoid destructuring error in VoiceProvider.
2025-10-03: Docs: added Hume EVI technical guide (server token endpoint, client VoiceProvider, session settings timing, function calling, TTS).
2025-10-03: Server: added Hume proxy routes (/api/hume/configs|prompts|tools) using server-side API key; kept existing /api/services/hume/token.
2025-10-03: Client: added src/lib/services/hume.js (token + configs/prompts/tools helpers).
2025-10-03: EmpathyLab sidebar: added EVI Configuration accordion with form + Saved EVI Configs list; uses /api/hume/configs via client helper; persisted to localStorage.
2025-10-03: Storybook: added Planner sidebar coverage (PlannerSidebar, DraggableItem stories); exported DraggableItem for reuse in stories.
2025-10-03: IdeaLab sidebar: enforce inline icon+text for module cards; added reusable SidebarItemCard component with Storybook stories; Storybook now loads Material Symbols via preview-head.
2025-10-03: EmpathyLab sidebar: normalized consent rows to SidebarItemCard with toggles (new SidebarToggleItemCard) and added stories for toggle variant.
2025-10-03: Planner sidebar: DraggableItem now uses base SidebarItemCard with right-side Connect CTA and status dot for consistent cards; kept drag behavior and data attributes for service-specific styles.
2025-10-03: Storybook: added Planner/ServiceStates story to showcase Connect CTA and status dots for OAuth/API‑key items without invoking real OAuth.
2025-10-03: Sidebar Subheader: added reusable SidebarSubheader component + stories; EmpathyLab sidebar now uses it and supports an optional 'distribute-evenly' layout mode to evenly space sections in the column.
2025-10-03: EmpathyLab presets: SidebarSubheader now hosts a 3‑button ActionBar (Full Research, Presentation, Minimal) using userbar styling; replaced old preset buttons.
2025-10-03: Privacy banner: added glass-style overlay banner centered in EmpathyLab right column with close button; reusable UI/GlassBanner component + story.
2025-10-03: Privacy notice moved: removed old sidebar privacy notice from EmpathyLab sidebar (left column); keep only floating glass banner in the right column.
2025-10-03: Agent docs: added UI spacing migration note to AGENTS.md, CODEX.md, CLAUDE.md, GEMINI.md (use --space-* or semantic tokens when touching styles).
2025-10-03: Sidebar tooltips: added generic SidebarTooltip (glass style, high z-index, smooth animation); integrated with EmpathyLab consent items to show explanations on hover; added story.
2025-10-03: EmpathyLab sidebar: added glass-style section separators between Presets, Tracking, EVI Configuration, and Saved Configs for clearer grouping.
2025-10-03: Settings UI: refactored services into a responsive card grid with status light, help tooltip (auto left/right placement), API key/URL inputs, and confirm actions; added help icon to show provider instructions.
2025-10-03: Settings UI (tiles): switched to small service tiles (icon + title). Clicking opens a centered modal card with full provider configuration (inputs, instructions, actions). Reused existing ServiceConnector inside the dialog.
2025-10-03: UI: added ThumbCard (thumbnail + title) component reusing image booth card style; Settings tile grid now uses ThumbCard for visual consistency.
2025-10-03: Modal polish: applied semantic typography tokens (title/subtitle/body line-heights) to Settings inner content; softened button micro‑interactions (removed scale, subtle translateY/shadow with 120ms ease).
2025-10-03: Settings UI Customization: added Accent Color selector with 10 day/night palettes (split-circle swatches). Added store `accentTheme` with persistent override for accent variables; applied via injected CSS for dark/light.
2025-10-06: Bootstrap micro-app scaffolds and AppProviders placeholder; added src/apps/* wrappers that set activeApp and render existing App (no routing wired yet) to enable gradual migration.
2025-10-06: Wire router with lazy micro-app routes; update AppSwitcher and CommandPalette to navigate via URL; add SPA fallbacks in server for new routes.
2025-10-06: Navigation sync: updated VoiceCommand, GlassDock, ModuleViewer, CalendarAISidebar, and PlannerCanvas to navigate via routes alongside setting store state.
2025-10-06: Server modularization: extracted auth, university, services, and image routes into separate files in `server/routes` directory. Created `server/config/env.js` for URL and environment helpers.
