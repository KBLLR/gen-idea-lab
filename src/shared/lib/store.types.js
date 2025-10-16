/**
 * @file Type definitions for the Zustand store
 * @description JSDoc types for store slices, actions, and state shape
 */

/**
 * @typedef {Object} User
 * @property {string} email
 * @property {string} [name]
 * @property {string} [picture]
 * @property {string} [id]
 */

/**
 * @typedef {Object} Toast
 * @property {string} id
 * @property {string} message
 * @property {'info' | 'success' | 'warning' | 'error'} type
 * @property {number} duration
 */

/**
 * @typedef {Object} ServiceConnection
 * @property {boolean} connected
 * @property {'connected' | 'disconnected' | 'connecting' | 'error'} status
 * @property {Object} [info]
 * @property {string} [info.name]
 * @property {string} [info.transport]
 * @property {string} [info.url]
 * @property {string} [lastChecked]
 * @property {string} [error]
 */

/**
 * @typedef {Object.<string, ServiceConnection>} ConnectedServices
 */

/**
 * @typedef {Object} CalendarEvent
 * @property {string} id
 * @property {string} title
 * @property {string} [name]
 * @property {string | Object} when
 * @property {string} [when.dateTime]
 * @property {string} [when.date]
 * @property {string} [where]
 * @property {string} [description]
 * @property {string} [image]
 * @property {string} [source]
 * @property {string} [htmlLink]
 * @property {Object} [organizer]
 * @property {Array} [attendees]
 */

/**
 * @typedef {Object} CalendarAIState
 * @property {CalendarEvent[]} events
 * @property {Object} preferences
 * @property {'contain' | 'cover'} preferences.imageFit
 * @property {Object} ui
 * @property {string | null} ui.filterDate - 'YYYY-MM-DD' format
 * @property {string} ui.newEventDate - ISO string
 */

/**
 * @typedef {Object} EmpathyLabConsent
 * @property {boolean} faceDetection
 * @property {boolean} emotionAnalysis
 * @property {boolean} bodyTracking
 * @property {boolean} handTracking
 * @property {boolean} gazeTracking
 * @property {boolean} dataExport
 */

/**
 * @typedef {Object} EmpathyLabOverlays
 * @property {boolean} drawBoxes
 * @property {boolean} drawPoints
 * @property {boolean} drawPolygons
 * @property {boolean} drawLabels
 * @property {boolean} drawFaceMesh
 * @property {boolean} drawIris
 * @property {boolean} drawGaze
 * @property {boolean} drawAttention
 * @property {boolean} drawBodySkeleton
 * @property {boolean} drawBodyPoints
 * @property {boolean} drawHandSkeleton
 * @property {boolean} drawHandPoints
 * @property {boolean} showGazeOverlay
 * @property {boolean} showEmotionFusion
 */

/**
 * @typedef {Object} EmpathyLabState
 * @property {EmpathyLabConsent} consent
 * @property {string | null} selectedHumeConfigId
 * @property {Object | null} humeConfig
 * @property {boolean} isModelLoaded
 * @property {EmpathyLabOverlays} overlays
 */

/**
 * @typedef {Object} GestureLabState
 * @property {'whiteboard' | '3d-navigation' | 'ui-control'} mode
 * @property {Object} examples
 * @property {boolean} examples.Whiteboard
 * @property {boolean} examples['3D Navigation']
 * @property {boolean} examples['UI Control']
 */

/**
 * @typedef {Object} ChatMessage
 * @property {'user' | 'model' | 'system'} role
 * @property {string} content
 * @property {string} [responseText]
 * @property {string} [chatId]
 * @property {string} [agentId]
 * @property {string} [agentName]
 * @property {string} [agentIcon]
 * @property {Array} [toolsUsed]
 * @property {string} [timestamp]
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {'pending' | 'in_progress' | 'completed' | 'blocked'} status
 * @property {number} [priority]
 * @property {string} [assignedTo]
 * @property {string} [dueDate]
 * @property {string[]} [tags]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} RiggingTask
 * @property {string} id
 * @property {string} modelUrl
 * @property {'pending' | 'processing' | 'completed' | 'failed'} status
 * @property {number} [progress]
 * @property {string} [riggedUrl]
 * @property {string} [error]
 * @property {string} createdAt
 * @property {string} [completedAt]
 */

/**
 * @typedef {Object} StoreActions
 * @property {function(User | null): void} setUser
 * @property {function(): Promise<void>} logout
 * @property {function(boolean): void} setCheckingAuth
 * @property {function(ConnectedServices): void} setConnectedServices
 * @property {function(string, Partial<ServiceConnection>): void} updateServiceConnection
 * @property {function(string): void} removeServiceConnection
 * @property {function(string, Object): void} storeServiceCredentials
 * @property {function(string, boolean): Promise<void>} toggleService
 * @property {function(string): Promise<void>} connectService
 * @property {function(string): Promise<void>} disconnectService
 * @property {function(string): Promise<Object>} testServiceConnection
 * @property {function(): Promise<void>} fetchConnectedServices
 * @property {function(string): Promise<void>} fetchServiceConfig
 * @property {function(string): void} setActiveApp
 * @property {function(string): void} setActiveModuleId
 * @property {function(string): void} setActiveChatId
 * @property {function(boolean): void} setIsSettingsOpen
 * @property {function(): void} toggleSettings
 * @property {function(boolean): void} setIsLiveVoiceChatOpen
 * @property {function(string, 'info' | 'success' | 'warning' | 'error', number): string} showToast
 * @property {function(Toast): string} addToast
 * @property {function(string): void} removeToast
 * @property {function(RiggingTask): void} addRiggingTask
 * @property {function(string, Partial<RiggingTask>): void} updateRiggingTask
 * @property {function(string): void} removeRiggingTask
 */

/**
 * @typedef {Object} StoreState
 * @property {boolean} didInit
 * @property {User | null} user
 * @property {boolean} checkingAuth
 * @property {boolean} isWelcomeScreenOpen
 * @property {boolean} isSettingsOpen
 * @property {boolean} isSystemInfoOpen
 * @property {boolean} isLiveVoiceChatOpen
 * @property {Object} ui
 * @property {boolean} ui.isSettingsOpen
 * @property {'dark' | 'light'} theme
 * @property {string} accentTheme
 * @property {Toast[]} toasts
 * @property {Object} dockPosition
 * @property {number} dockPosition.x
 * @property {number} dockPosition.y
 * @property {Object} dockDimensions
 * @property {number} dockDimensions.width
 * @property {number} dockDimensions.height
 * @property {'chat' | 'node'} dockMode
 * @property {boolean} dockMinimized
 * @property {string | null} activeApp
 * @property {string | null} activeModuleId
 * @property {string | null} activeChatId
 * @property {boolean} showModuleChat
 * @property {Object.<string, ChatMessage[]>} assistantHistories
 * @property {boolean} isAssistantLoading
 * @property {ChatMessage[]} orchestratorHistory
 * @property {string} orchestratorModel
 * @property {string} workflowAutoTitleModel
 * @property {boolean} orchestratorHasConversation
 * @property {Array} orchestratorSavedSessions
 * @property {Object} firstVisit
 * @property {boolean} firstVisit.ideaLab
 * @property {boolean} firstVisit.chat
 * @property {boolean} firstVisit.workflows
 * @property {boolean} firstVisit.planner
 * @property {boolean} firstVisit.calendarAI
 * @property {boolean} firstVisit.imageBooth
 * @property {boolean} firstVisit.empathyLab
 * @property {boolean} firstVisit.gestureLab
 * @property {boolean} firstVisit.kanban
 * @property {string} activeModeKey
 * @property {string | null} inputImage
 * @property {string | null} outputImage
 * @property {boolean} isGenerating
 * @property {string | null} generationError
 * @property {string} imageProvider
 * @property {string | null} imageModel
 * @property {Object} archivaEntries
 * @property {string | null} activeEntryId
 * @property {Object | null} selectedTemplateForPreview
 * @property {CalendarAIState} calendarAI
 * @property {EmpathyLabState} empathyLab
 * @property {string} assistantModel
 * @property {Object.<string, string>} assistantSystemPrompts
 * @property {Object} moduleAssistantSavedChats
 * @property {GestureLabState} gestureLab
 * @property {Object} appTransition
 * @property {Object} resourceManager
 * @property {Set<string>} loadedResourceIds
 * @property {Object} moduleKnowledgeCache
 * @property {boolean} showKnowledgeSection
 * @property {boolean} showGallery
 * @property {ConnectedServices} connectedServices
 * @property {Object} serviceConfig
 * @property {Object} serviceCredentials
 * @property {Object} settings
 * @property {Task[]} tasks
 * @property {RiggingTask[]} riggingTasks
 * @property {Object | null} selectedWorkflow
 * @property {Object | null} plannerGraph
 * @property {Array} customWorkflows
 * @property {number} rightColumnWidth
 * @property {number} leftColumnWidth
 * @property {StoreActions} actions
 */

export {};
