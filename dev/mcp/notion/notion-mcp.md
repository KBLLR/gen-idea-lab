# Supported tools

Learn what you can do with Notion MCP tools.

Now that you have installed the Notion MCP, let's explore how AI assistants can use Notion MCP tools to create, search, and manage content in your Notion workspace.

These tools work seamlessly together through prompts, and their real power comes from combining them. With a single prompt, you can search your workspace, create new pages from the results, and update properties across multiple pages. Understanding these building blocks helps you craft efficient prompts that tackle complex tasks by combining multiple tools.

[block:parameters]
{
  "data": {
    "h-0": "Name",
    "h-1": "Description",
    "h-2": "Sample prompt",
    "0-0": "search",
    "0-1": "Search across your Notion workspace and connected tools like Slack, Google Drive, and Jira. Falls back to basic workspace search if AI features aren’t available.",
    "0-2": "• \"Check slack for how we have solved this bug in the past\"  \n• \"Search for documents mentioning 'budget approval process'\"  \n• \"Look for meeting notes from last week with John\"  \n• \"Find all project pages that mention 'ready for dev'”",
    "1-0": "fetch",
    "1-1": "Retrieves content from a Notion page or database by its URL",
    "1-2": "• “What are the product requirements still need to be implemented from this ticket `https://notion.so/page-url`\"?",
    "2-0": "create-pages",
    "2-1": "Creates one or more Notion pages with specified properties and content. If a parent is not specified, a private page will be created.",
    "2-2": "• \"Create a project kickoff page under our Projects folder with agenda and team info\"  \n• \"Make a new employee onboarding checklist in our HR database\"  \n• \"Create a meeting notes page for today's standup with action items\"  \n• \"Add a new product feature request to our feature database”",
    "3-0": "update-page",
    "3-1": "Update a Notion page's properties or content.",
    "3-2": "• \"Change the status of this task from 'In Progress' to 'Complete'\"  \n• \"Add a new section about risks to the project plan page\"  \n• \"Update the due date on this project to next Friday\"  \n• \"Replace the old project timeline with the updated version”",
    "4-0": "move-pages",
    "4-1": "Move one or more Notion pages or databases to a new parent.",
    "4-2": "\"Move my weekly meeting notes page to the 'Team Meetings' page\"  \n• \"Reorganize all project documents under the 'Active Projects' section\"",
    "5-0": "duplicate-page",
    "5-1": "Duplicate a Notion page within your workspace. This action is completed async.",
    "5-2": "\"Duplicate my project template page so I can use it for the new Q3 initiative\"  \n• \"Make a copy of the meeting agenda template for next week's planning session\"",
    "6-0": "create-database",
    "6-1": "Creates a new Notion database with the specified properties.",
    "6-2": "\"Create a new database to track our customer feedback with fields for customer name, feedback type, priority, and status\"  \n• \"Set up a content calendar database with columns for publish date, content type, and approval status\"",
    "7-0": "update-database",
    "7-1": "Update a Notion database's properties, name, description, or other attributes.",
    "7-2": "• \"Add a status field to track project completion\"  \n• \"Update the task database to include priority levels\"",
    "8-0": "create-comment",
    "8-1": "Add a comment to a page  \n  \n_Note: block-level comments and discussions within a page are not yet supported_.",
    "8-2": "• \"Add a feedback comment to this design proposal\"  \n• \"Leave a note on the quarterly review page about budget concerns\"  \n• \"Comment on the meeting notes to clarify the action item deadlines\"  \n• \"Add my thoughts to the product roadmap discussion”",
    "9-0": "get-comments",
    "9-1": "Lists all comments on a specific page, including threaded discussions.",
    "9-2": "• List comments on the project requirements section  \n• Get all feedback comments from last week's review",
    "10-0": "get-teams",
    "10-1": "Retrieves a list of teams (teamspaces) in the current workspace.",
    "10-2": "• Search for teams by name, and your membership status in each team  \n• Get a team's ID to use as a filter for a search",
    "11-0": "get-users",
    "11-1": "Lists all users in the workspace with their details.",
    "11-2": "• \"Get contact details for the user who created this page\"  \n• \"Look up the profile of the person assigned to this task”",
    "12-0": "get-user",
    "12-1": "Retrieve your user information by ID",
    "12-2": "• \"What's my email address?\"  \n• ”What’s my Notion user ID?”",
    "13-0": "get-self",
    "13-1": "Retrieves information about your own bot user and the Notion workspace you’re connected to.",
    "13-2": "• “Which Notion workspace am I currently connected to?”  \n• ”What's my file size upload limit for the current workspace?”  "
  },
  "cols": 3,
  "rows": 14,
  "align": [
    "left",
    "left",
    "left"
  ]
}
[/block]


## Rate limits

Standard [API request limits](ref:request-limits) apply per user's usage of Notion MCP (totaled across all tool calls). Currently, this is an average of **180 requests per minute** (3 requests per second).

Some MCP tools have additional, tool-specific rate limits that are stricter. These are subject to change over time, but the current values are listed below for reference:

- **Search**: 30 requests per minute

### Examples

To illustrate the above limitations, you'll experience rate limit errors in your MCP client of choice in any of the following example scenarios (assuming we take the average rate over a large enough time window):

- 35 searches per minute (exceeds search-specific limit)
- 12 searches & 170 fetches per minute (exceeds general 180 requests/min limit)
- 185 fetches per second (exceeds general 180 requests/min limit)

### What to do if you're rate-limited

In most cases, the time it takes to do a complex AI-powered search across Notion and your connected tools means that sequential searches will typically stay under the rate limit. In general, if you encounter rate limit errors, prompt your LLM tool to reduce the amount of parallel searches or operations performed using Notion MCP, and/or try again later.
