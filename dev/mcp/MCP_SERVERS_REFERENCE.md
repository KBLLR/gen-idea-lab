# MCP Servers Reference Guide

*A comprehensive list of Model Context Protocol (MCP) server implementations and examples*

## What is MCP?

The Model Context Protocol (MCP) is an open standard that enables seamless integration between LLM applications and external data sources and tools. It transforms the M×N integration problem into a simpler M+N equation, where any MCP-compliant data source can serve context to any MCP-enabled AI client.

---

## 🔧 Development & DevOps

### **GitHub MCP Server** ⭐
- **Description**: Official GitHub integration for repository management
- **Capabilities**: File operations, PR/issue handling, repository browsing, workflow management
- **Use Cases**: Code review automation, issue triage, project management
- **Repository**: [github/github-mcp-server](https://github.com/github/github-mcp-server)
- **Status**: Generally Available (2025)

### **GitLab MCP**
- **Description**: GitLab API integration for project management
- **Capabilities**: Project management, CI/CD pipeline control, merge request handling
- **Use Cases**: DevOps automation, code deployment, project coordination

### **Kubernetes MCP**
- **Description**: Cluster management via natural language
- **Capabilities**: Pod management, service deployment, cluster monitoring
- **Use Cases**: Infrastructure as code, automated scaling, troubleshooting

### **AWS MCP**
- **Description**: Amazon Web Services integration
- **Capabilities**: EC2, S3, Lambda operations, resource management
- **Use Cases**: Cloud infrastructure management, cost optimization, deployment automation

### **Cloudflare MCP**
- **Description**: Cloudflare services integration
- **Capabilities**: Workers, KV, R2, D1 database management
- **Use Cases**: Edge computing, CDN management, serverless functions

### **DevOps-MCP**
- **Description**: Dynamic Azure DevOps integration
- **Capabilities**: Work items, repositories, builds, pipelines, multi-project management
- **Use Cases**: Sprint planning, build automation, release management

---

## 🌐 Web & Browser Automation

### **Playwright MCP**
- **Description**: Microsoft Playwright integration for web automation
- **Capabilities**: Web scraping, form filling, UI testing, accessibility snapshots
- **Use Cases**: E2E testing, data extraction, web monitoring

### **Browserbase MCP**
- **Description**: Headless browser operations platform
- **Capabilities**: Web navigation, data extraction, form filling
- **Use Cases**: Web scraping at scale, automated testing, content monitoring

### **Puppeteer MCP**
- **Description**: Chrome/Chromium browser automation
- **Capabilities**: Page automation, screenshot capture, PDF generation
- **Use Cases**: Report generation, visual testing, performance monitoring

---

## 💬 Communication & Messaging

### **Slack MCP**
- **Description**: Slack workspace integration
- **Capabilities**: Channel management, message posting, user management
- **Use Cases**: Team notifications, automated responses, workflow integration

### **Telegram MCP**
- **Description**: Telegram bot and messaging integration
- **Capabilities**: Bot interactions, message retrieval, channel management
- **Use Cases**: Customer support, notification systems, content distribution

### **iMessage MCP**
- **Description**: Apple iMessage integration
- **Capabilities**: Query conversations, send messages, contact management
- **Use Cases**: Personal automation, message analysis, communication insights

---

## 🗄️ Data & Storage

### **Filesystem MCP** ⭐
- **Description**: Secure file operations with configurable access controls
- **Capabilities**: File reading/writing, directory navigation, permission management
- **Use Cases**: Document processing, file organization, content management
- **Repository**: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

### **Memory MCP** ⭐
- **Description**: Knowledge graph-based persistent memory system
- **Capabilities**: Information storage, relationship mapping, context retention
- **Use Cases**: Long-term conversation memory, knowledge management
- **Repository**: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

### **SQLite MCP**
- **Description**: SQLite database integration
- **Capabilities**: Database queries, schema management, data manipulation
- **Use Cases**: Local data storage, analytics, application backends

### **Postgres MCP**
- **Description**: PostgreSQL database operations
- **Capabilities**: Advanced SQL queries, transaction management, database administration
- **Use Cases**: Enterprise data management, complex analytics, multi-user applications

---

## 🎯 Specialized Domains

### **Sentry MCP**
- **Description**: Error tracking and monitoring integration
- **Capabilities**: Issue retrieval, error analysis, performance monitoring
- **Use Cases**: Bug triage, performance optimization, incident response

### **PubMed MCP**
- **Description**: Biomedical research paper access
- **Capabilities**: Research paper search, citation management, abstract analysis
- **Use Cases**: Literature review, research assistance, medical information

### **Museum Collection MCP**
- **Description**: Art and cultural artifact search
- **Capabilities**: Artwork database access, collection browsing, metadata retrieval
- **Use Cases**: Cultural research, educational content, art discovery

### **FHIR MCP**
- **Description**: Healthcare data integration (Fast Healthcare Interoperability Resources)
- **Capabilities**: Patient data access, medical record management, healthcare workflows
- **Use Cases**: Clinical decision support, patient care coordination, medical research

---

## 🤖 AI & Automation

### **Sequential Thinking MCP** ⭐
- **Description**: Dynamic problem-solving through thought sequences
- **Capabilities**: Multi-step reasoning, reflective problem-solving, workflow orchestration
- **Use Cases**: Complex analysis, decision trees, automated reasoning
- **Repository**: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

### **Serena Coding Agent MCP**
- **Description**: Autonomous code reading, editing, and execution
- **Capabilities**: Symbolic code operations, automated refactoring, code analysis
- **Use Cases**: Code maintenance, automated improvements, development assistance

### **RepoMapper MCP**
- **Description**: Dynamic repository visualization and mapping
- **Capabilities**: Project structure analysis, dependency mapping, code relationship visualization
- **Use Cases**: Codebase exploration, architecture documentation, onboarding

---

## 🔍 Search & Retrieval

### **Brave Search MCP**
- **Description**: Brave Search API integration
- **Capabilities**: Web search, local search, privacy-focused results
- **Use Cases**: Research assistance, fact-checking, content discovery

### **Fetch MCP** ⭐
- **Description**: Web content fetching and conversion for LLM usage
- **Capabilities**: URL content extraction, format conversion, web scraping
- **Use Cases**: Content analysis, research automation, data aggregation
- **Repository**: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

### **Everything MCP** ⭐
- **Description**: Reference/test server with comprehensive capabilities
- **Capabilities**: Prompts, resources, and tools demonstration
- **Use Cases**: Development testing, feature demonstration, learning
- **Repository**: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

---

## ⚙️ Aggregators & Middleware

### **MetaMCP**
- **Description**: Unified middleware managing multiple MCP connections with GUI
- **Capabilities**: Multi-server orchestration, connection management, unified interface
- **Use Cases**: Complex workflows, server coordination, simplified management

### **1mcp/agent**
- **Description**: Unified MCP server aggregating multiple servers
- **Capabilities**: Single endpoint for multiple services, load balancing, service discovery
- **Use Cases**: Simplified integration, service consolidation, performance optimization

### **Mastra/mcp**
- **Description**: Client implementation for Mastra framework
- **Capabilities**: Seamless integration with MCP-compatible AI models and tools
- **Use Cases**: Framework integration, rapid prototyping, production deployment

---

## 🕒 Utility & System

### **Time MCP** ⭐
- **Description**: Time and timezone conversion capabilities
- **Capabilities**: Timezone conversions, date formatting, temporal calculations
- **Use Cases**: Global scheduling, time-based automation, calendar integration
- **Repository**: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

### **Git MCP** ⭐
- **Description**: Git repository operations and manipulation
- **Capabilities**: Repository reading, searching, Git operations
- **Use Cases**: Version control automation, code history analysis, branch management
- **Repository**: [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

---

## 🚀 Getting Started

### Official Resources
- **MCP Specification**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Official Servers**: [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
- **OpenAI Integration**: [OpenAI Agents SDK MCP Documentation](https://openai.github.io/openai-agents-python/mcp/)

### Community Collections
- **Awesome MCP Servers**: [github.com/punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)
- **Curated List**: [github.com/wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers)

### Integration Libraries
- **Python**: `agents-mcp` package for OpenAI Agents SDK
- **JavaScript/TypeScript**: Official MCP SDK implementations
- **Go**: High-performance implementations (like GitHub's server)

---

## 💡 Building Your Own MCP Server

### Key Components
1. **Tools**: Functions that AI models can call
2. **Resources**: Data that can be included in context
3. **Prompts**: Templates that guide model interactions

### Transport Options
- **stdio**: Local subprocess execution
- **HTTP + SSE**: Server-Sent Events for streaming
- **WebSocket**: Real-time bidirectional communication

### Security Considerations
- User consent and authorization flows
- Access control and sandboxing
- Rate limiting and timeout management
- Audit logging and monitoring

---

*Last updated: 2025 - This reference reflects the current state of the MCP ecosystem*