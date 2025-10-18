# Workflow Creation Guide

## Overview

This guide teaches you how to create powerful AI-driven workflows using the GenBooth Idea Lab planner. Learn to combine Google services, AI models, and interactive components to automate your productivity tasks.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Workflow Concepts](#basic-workflow-concepts)
3. [Step-by-Step Tutorials](#step-by-step-tutorials)
4. [Advanced Patterns](#advanced-patterns)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

Before creating workflows, ensure you have:
- ✅ Connected Google services (Calendar, Drive, Photos, Gmail)
- ✅ At least one AI model provider configured
- ✅ Basic understanding of the planner interface

### Workflow Canvas Overview

The planner canvas is where you build visual workflows by:
1. **Dragging components** from the sidebar
2. **Connecting nodes** with workflow edges
3. **Configuring prompts** via double-click
4. **Testing and running** your workflows

### Component Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Google Services** | Data sources and actions | Calendar events, Drive files |
| **AI Models** | Processing and analysis | GPT-4, Claude, Gemini |
| **Media Components** | Content handling | Image viewer, Audio player |
| **Connectors** | Flow control | Sequence, Parallel, Decision |

## Basic Workflow Concepts

### Node Types

#### Data Nodes
Components that provide or consume data:
- **Google Calendar**: Calendar events and scheduling
- **Google Drive**: Files and folder structures
- **Gmail**: Email messages and threads
- **Google Photos**: Albums and image collections

#### Processing Nodes
Components that transform or analyze data:
- **AI Models**: Text generation, analysis, summarization
- **Media Components**: File processing, format conversion
- **ArchivAI Templates**: Structured document generation

#### Control Nodes
Components that manage workflow execution:
- **Sequence**: Execute steps in order
- **Parallel**: Run multiple branches simultaneously
- **Decision**: Conditional branching based on criteria
- **Loop**: Repeat operations until condition met

### Connection Patterns

#### Linear Flow
```
Calendar → AI Analysis → Email Summary → Send
```

#### Branching Flow
```
Drive Files → Content Analysis → {
  Documents → Archive
  Images → Photo Album
  Code → Repository
}
```

#### Feedback Loop
```
Gmail → Priority Analysis → Action Required? → {
  Yes → Create Task → Update Calendar
  No → Archive → Return to Gmail
}
```

## Step-by-Step Tutorials

### Tutorial 1: Calendar-Driven Task Planning

**Goal**: Automatically create preparation tasks for upcoming meetings

#### Step 1: Set Up Calendar Source
1. Drag **Google Calendar** component to canvas
2. Double-click to configure AI prompt:
   ```
   Analyze my calendar for the next 7 days. For each meeting longer than 30 minutes,
   identify if preparation is needed. Focus on client meetings, project reviews,
   and presentations. Extract meeting titles, attendees, and agenda items when available.
   ```
3. Set date range to "Next Week"

#### Step 2: Add AI Analysis
1. Drag **OpenAI GPT-4** model to canvas
2. Connect Calendar output to GPT-4 input
3. Configure analysis prompt:
   ```
   Based on the calendar events provided, create a preparation task list. For each meeting:

   1. Determine preparation requirements
   2. Estimate time needed (15min, 30min, 1hr, 2hr+)
   3. Suggest specific preparation activities
   4. Identify required materials or research

   Format as structured task list with priorities.
   ```

#### Step 3: Create Task Output
1. Drag **Text Renderer** component to canvas
2. Connect GPT-4 output to Text Renderer
3. Set mode to "Markdown" for formatted task lists
4. Configure for task export to your preferred system

#### Step 4: Test and Refine
1. Click "Run Workflow" to test
2. Review generated tasks for accuracy
3. Adjust prompts based on results
4. Save workflow as "Meeting Prep Automation"

### Tutorial 2: Email Priority Management

**Goal**: Analyze incoming emails and categorize by priority and action needed

#### Step 1: Connect Gmail
1. Drag **Gmail** component to canvas
2. Configure to show recent unread messages
3. Set AI prompt:
   ```
   Analyze these email messages for priority and required actions. Consider:
   - Sender importance (client, boss, team, automated)
   - Urgency indicators (deadline, meeting requests, urgent keywords)
   - Content type (question, information, request, notification)
   - Required response time (immediate, same day, this week, FYI only)
   ```

#### Step 2: Priority Analysis
1. Add **Claude** model for analysis
2. Connect Gmail → Claude
3. Configure analysis prompt:
   ```
   For each email, provide:

   1. Priority Score (1-5, where 5 is most urgent)
   2. Category (Client, Internal, Administrative, Newsletter, Spam)
   3. Action Required (Reply Needed, Review Only, Follow-up, Archive)
   4. Suggested Response Timeline (Immediate, Today, This Week, No Response)
   5. Key Points Summary (one sentence)

   Format as structured JSON for further processing.
   ```

#### Step 3: Action Routing
1. Add **Decision Connector** to split by priority
2. Create branches for different priority levels:
   - **High Priority (4-5)**: → Immediate notification
   - **Medium Priority (2-3)**: → Daily review list
   - **Low Priority (1)**: → Weekly batch processing

#### Step 4: Response Generation
1. For high-priority emails, add response generation:
2. Connect to **GPT-4** with prompt:
   ```
   Generate a professional email response based on the analysis.
   Include appropriate tone, address key points, and suggest next steps.
   Keep responses concise but complete.
   ```

### Tutorial 3: Drive Organization Workflow

**Goal**: Analyze and organize Google Drive files based on content patterns

#### Step 1: File Analysis
1. Drag **Google Drive** component
2. Configure to scan specific folders or entire drive
3. Set analysis prompt:
   ```
   Analyze these Drive files for organization opportunities:
   - Identify file types and common patterns
   - Suggest folder structure improvements
   - Find potential duplicates or outdated versions
   - Recommend archival candidates (old, unused files)
   ```

#### Step 2: Content Classification
1. Add **Gemini** model for content analysis
2. For each file type, configure specific analysis:
   - **Documents**: Topic analysis, project association
   - **Images**: Content recognition, event grouping
   - **Spreadsheets**: Data type identification
   - **Presentations**: Subject matter classification

#### Step 3: Organization Suggestions
1. Add **Text Renderer** for organization report
2. Generate structured recommendations:
   ```markdown
   # Drive Organization Report

   ## Folder Structure Suggestions
   - Project-based organization
   - Date-based archival system
   - File type segregation

   ## Duplicate Files Found
   - List with confidence scores
   - Size savings potential

   ## Archival Candidates
   - Files not accessed in 6+ months
   - Outdated versions of documents
   ```

### Tutorial 4: Photo Memory Creation

**Goal**: Create automated photo albums and memory summaries from Google Photos

#### Step 1: Photo Analysis
1. Drag **Google Photos** component
2. Browse recent photos or specific albums
3. Configure AI analysis:
   ```
   Analyze these photos for memory creation:
   - Identify events, locations, and time periods
   - Recognize people and recurring subjects
   - Detect special occasions (birthdays, holidays, trips)
   - Group related photos by theme or event
   ```

#### Step 2: Memory Generation
1. Add **GPT-4** for creative writing
2. Configure memory prompt:
   ```
   Based on the photo analysis, create engaging memory summaries:

   1. Write narrative descriptions of events
   2. Highlight special moments and details
   3. Create album titles and descriptions
   4. Suggest photo book layouts or arrangements

   Use warm, personal tone suitable for family sharing.
   ```

#### Step 3: Album Organization
1. Add organization logic for photos
2. Create themed collections:
   - **Travel memories**: Group by location and date
   - **Family events**: Organize by occasions
   - **Yearly highlights**: Best photos by month
   - **People focus**: Collections by individual

## Advanced Patterns

### Multi-Service Integration

#### Cross-Platform Workflow
Combine multiple Google services for comprehensive automation:

```
Calendar Events →
├─ Drive: Meeting prep documents
├─ Gmail: Send invites and reminders
└─ Photos: Event documentation
```

#### Data Correlation
Use AI to find connections across services:
- **Email context** for calendar events
- **Drive files** related to project emails
- **Photo timestamps** matching calendar entries

### Conditional Logic

#### Smart Routing
Use decision connectors for intelligent flow control:

```javascript
// Example decision logic
if (email.priority >= 4) {
  route = 'immediate_response';
} else if (email.category === 'client') {
  route = 'daily_review';
} else {
  route = 'weekly_batch';
}
```

#### Dynamic Prompts
Adjust AI prompts based on context:

```
Base prompt: "Analyze this calendar data"
+ Meeting type: "Focus on presentation requirements"
+ Attendee count: "Consider group dynamics"
+ Duration: "Account for extended preparation needs"
```

### Parallel Processing

#### Simultaneous Analysis
Process multiple data streams concurrently:

```
Drive Files → {
  Content Analysis (Claude)
  Security Scan (GPT-4)
  Organization Review (Gemini)
} → Combine Results
```

#### Batch Operations
Handle large datasets efficiently:
- Process photos in batches of 50
- Analyze emails in daily chunks
- Update calendars in weekly batches

### Loop Operations

#### Iterative Improvement
Continuously refine results:

```
Initial Analysis → Review Quality → {
  Good enough? → Output Results
  Needs work? → Refine Prompts → Loop Back
}
```

#### Progress Tracking
Monitor long-running workflows:
- Progress indicators for large operations
- Intermediate result checkpoints
- Error recovery and continuation

## Best Practices

### Prompt Engineering

#### Specific Instructions
- **Bad**: "Analyze my calendar"
- **Good**: "Analyze my calendar for the next 7 days, focusing on meetings longer than 30 minutes that require preparation"

#### Context Provision
- Include relevant background information
- Specify output format requirements
- Define success criteria clearly

#### Iterative Refinement
- Start with simple prompts
- Test with sample data
- Gradually add complexity
- Monitor and adjust based on results

### Performance Optimization

#### Component Sizing
- Resize panels to show relevant content
- Use appropriate data preview limits
- Cache frequently accessed data

#### Connection Management
- Verify service connections before running
- Handle connection failures gracefully
- Implement retry logic for temporary issues

#### Resource Usage
- Monitor API rate limits
- Use batch processing for large datasets
- Implement appropriate caching strategies

### Error Handling

#### Graceful Degradation
- Provide fallback options for failed services
- Show meaningful error messages
- Allow manual intervention when needed

#### Data Validation
- Verify input data formats
- Check for required fields
- Validate AI output quality

#### User Feedback
- Show progress indicators for long operations
- Provide status updates during processing
- Alert users to completion or errors

### Security Considerations

#### Data Privacy
- Use minimal required permissions
- Avoid storing sensitive data unnecessarily
- Implement data retention policies

#### Access Control
- Regular review of connected services
- Monitor for unusual activity
- Revoke unused permissions promptly

## Troubleshooting

### Common Issues

#### Workflow Not Running
**Symptoms**: Components don't execute or show errors
**Solutions**:
1. Check service connections (green indicators)
2. Verify node connections are complete
3. Review AI prompt configurations
4. Test with smaller datasets

#### Poor AI Results
**Symptoms**: Irrelevant or low-quality outputs
**Solutions**:
1. Refine prompt specificity
2. Provide more context in prompts
3. Try different AI models
4. Adjust input data quality

#### Performance Issues
**Symptoms**: Slow execution or timeouts
**Solutions**:
1. Reduce data batch sizes
2. Check API rate limits
3. Optimize prompt complexity
4. Use parallel processing where possible

#### Connection Failures
**Symptoms**: Service connection errors
**Solutions**:
1. Refresh OAuth tokens
2. Check internet connectivity
3. Verify service status
4. Review API quotas

### Debug Strategies

#### Incremental Testing
- Test components individually
- Add one connection at a time
- Verify each step before proceeding

#### Data Inspection
- Use Text Renderer to view intermediate results
- Check data formats at each stage
- Validate API responses

#### Log Analysis
- Monitor browser console for errors
- Check network requests for failures
- Review service response codes

### Getting Help

#### Documentation Resources
- Component reference guides
- Service integration docs
- API documentation links

#### Community Support
- GitHub issues for platform bugs
- User forums for workflow ideas
- Example workflows repository

#### Professional Services
- Custom workflow development
- Integration consulting
- Performance optimization

---

## Workflow Templates

### Ready-to-Use Examples

#### Daily Productivity Suite
- Morning calendar review with task generation
- Email priority sorting and response drafting
- Drive file organization and cleanup
- Photo memories for yesterday's events

#### Project Management Helper
- Project file analysis and organization
- Team communication summarization
- Progress tracking across multiple services
- Resource allocation optimization

#### Creative Assistant
- Photo curation for social media
- Content idea generation from various sources
- Creative brief development
- Asset organization and tagging

#### Personal Life Manager
- Family calendar coordination
- Photo album creation for events
- Travel planning and documentation
- Home organization and inventory

Start with these templates and customize them for your specific needs. Remember that the best workflows are those that solve real problems in your daily routine!