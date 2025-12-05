# SQLTemple

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" />
</p>

SQLTemple is a modern, AI-powered SQL IDE built with Electron and React. It provides intelligent query assistance, execution plan visualization, and a VS Code-like development experience for database work.

> **_IMPORTANT DISCLAIMER:_** This app is not yet notorized by a valid Apple Developer ID, thus might have problems when installing on latest MacOS computers.

## ✨ Features

### 🚀 Core Database Features

- **Modern SQL Editor**: Powered by Monaco Editor (VS Code's editor) with syntax highlighting and auto-completion
- **Multi-tab Interface**: Work with multiple queries simultaneously with tab management
- **Advanced Schema Explorer**: Browse databases, schemas, tables, columns with unified explorer interface
- **Query Execution**: Execute full queries or selected portions with real-time feedback
- **Enhanced Results Grid**: View query results with virtualization for large datasets, column resizing, and adjustable row heights
- **Query History**: Track and reuse previous queries with full history management
- **Connection Management**: Save and manage multiple database connections with secure credential storage
- **Export Capabilities**: Export query results to multiple formats (CSV, JSON, Excel, etc.)

### 🤖 AI-Powered Intelligence

- **Natural Language Query Generation**: Generate SQL queries from plain English descriptions
- **Query Explanation**: Get detailed explanations of complex SQL queries with step-by-step breakdowns
- **Query Optimization**: AI-powered query optimization based on execution plans and database schema
- **Execution Plan Analysis**: Intelligent analysis of query performance with specific recommendations
- **Data Analysis**: AI-powered insights and pattern recognition from query results
- **Smart Completions**: Context-aware SQL completions based on your database schema
- **Multiple AI Models**: Support for GPT-4, GPT-4o, GPT-3.5, and O1 models
- **Autonomous Agent Sidebar**: ReAct-style AI agent that can explore schemas, run tools, and stream answers while keeping a full conversation history

### 📊 Advanced Visualization & Analysis

- **Execution Plan Visualizer**: Interactive tree view of query execution plans with performance metrics
- **Table Topology Viewer**: Visual relationship mapping with Mermaid diagrams showing foreign key relationships
- **Column Statistics**: Real-time statistics and data type information with hover tooltips
- **Relationship Discovery**: Automatic detection and visualization of table relationships
- **Results Analysis Modal**: Deep dive analysis of query results with AI insights
- **Foreign Key Navigation**: Click-through navigation between related records

### 🔍 Search & Navigation

- **Spotlight Search**: Powerful fuzzy search across connections, tables, columns, and database objects
- **Quick Navigation**: Jump to any database object with keyboard shortcuts
- **Schema Browsing**: Expandable tree view with lazy loading for large schemas
- **Object Filtering**: Filter and search within schema explorer

### ⚡ Performance & Productivity

- **Virtualized Data Grids**: Handle millions of rows with smooth scrolling performance
- **Background Query Execution**: Non-blocking query execution with progress indicators
- **Customizable Keyboard Shortcuts**: Fully configurable shortcuts with recording capability
- **Resizable Panels**: Drag-to-resize interface components for optimal workflow
- **Dark Theme**: Beautiful VS Code-inspired dark theme optimized for long coding sessions
- **Query Limiting**: Automatic query result limiting to prevent browser crashes

### 🛠️ Developer Experience

- **TypeScript Architecture**: Fully typed codebase with comprehensive error handling
- **Hot Reload Development**: Fast development cycle with webpack hot module replacement
- **Secure Context Isolation**: Electron security best practices with IPC communication
- **Local Storage**: SQLite-based local storage for connections, history, and settings
- **Cross-Platform**: macOS app bundle ready today, with Windows and Linux installers produced via our CI builds

## 🖥️ Supported Databases

- PostgreSQL (including Supabase, Neon, etc.)
- More databases coming soon!

## 📋 Requirements

- macOS 10.15 or later (for the prebuilt DMG)
- Node.js 18 or later (for development/build tooling)
- OpenAI API key (for AI features)

## 🚀 Installation

### Option 1: Homebrew (macOS)

```bash
brew tap victorbona/sqltemple https://github.com/vicotrbb/sqltemple
brew install --cask sqltemple
```

- If macOS Gatekeeper blocks the first launch, right-click the app in Finder and choose **Open** (current build is not yet notarized).
- Homebrew will download the signed/notarized DMG once it is published to the GitHub release matching the version in `Casks/sqltemple.rb`.

### Option 2: Download Pre-built App

1. Visit the [SQLTemple Releases](https://github.com/vicotrbb/sqltemple/releases) page
2. Download the installer for your platform:
   - `.dmg` for macOS
   - `.exe` / `.msi` for Windows
   - `.deb` / `.rpm` / `.AppImage` (when available) for Linux
3. Install as you would any native application for that platform
4. Launch SQLTemple from Applications / Start Menu / your desktop environment

### Option 3: Build from Source

```bash
# Clone the repository
git clone https://github.com/vicotrbb/sqltemple.git
cd sqltemple

# Install dependencies
npm ci

# Run in development mode
npm start

# Build for macOS
npm run make
```

## 🎯 Getting Started

### 1. Connect to a Database

1. Click "Connect" in the toolbar
2. Enter your database credentials:
   - **Name**: A friendly name for your connection
   - **Host**: Database host (e.g., `db.example.com`)
   - **Port**: Database port (default: 5432)
   - **Database**: Database name
   - **Username**: Your database username
   - **Password**: Your database password
   - **SSL**: Enable for secure connections

### 2. Configure AI Features

1. Click "⚙️ AI" in the toolbar
2. Enter your OpenAI API key
3. Select your preferred model (recommended: gpt-4o-mini)
4. Click "Save"

### 3. Write and Execute Queries

- Write SQL in the editor
- Press `Cmd+Enter` to execute the entire query
- Select text and press `Cmd+Enter` to execute only the selection
- Right-click for more options

## ⌨️ Keyboard Shortcuts

### File Operations

| Action        | macOS         | Windows/Linux  |
| ------------- | ------------- | -------------- |
| New Tab       | `Cmd+T`       | `Ctrl+T`       |
| Open Query    | `Cmd+O`       | `Ctrl+O`       |
| Save Query    | `Cmd+S`       | `Ctrl+S`       |
| Save Query As | `Cmd+Shift+S` | `Ctrl+Shift+S` |
| Preferences   | `Cmd+,`       | `Ctrl+,`       |

### Edit Operations

| Action     | macOS         | Windows/Linux |
| ---------- | ------------- | ------------- |
| Undo       | `Cmd+Z`       | `Ctrl+Z`      |
| Redo       | `Cmd+Shift+Z` | `Ctrl+Y`      |
| Cut        | `Cmd+X`       | `Ctrl+X`      |
| Copy       | `Cmd+C`       | `Ctrl+C`      |
| Paste      | `Cmd+V`       | `Ctrl+V`      |
| Select All | `Cmd+A`       | `Ctrl+A`      |

### View & Navigation

| Action               | macOS         | Windows/Linux  |
| -------------------- | ------------- | -------------- |
| Find                 | `Cmd+F`       | `Ctrl+F`       |
| Find & Replace       | `Cmd+Shift+F` | `Ctrl+Shift+F` |
| Toggle History       | `Cmd+H`       | `Ctrl+H`       |
| Toggle Agent Sidebar | `Cmd+L`       | `Ctrl+L`       |
| Spotlight Search     | `Cmd+K`       | `Ctrl+K`       |
| Zoom In              | `Cmd++`       | `Ctrl++`       |
| Zoom Out             | `Cmd+-`       | `Ctrl+-`       |
| Reset Zoom           | `Cmd+0`       | `Ctrl+0`       |

### Tabs & Windows

| Action          | macOS       | Windows/Linux |
| --------------- | ----------- | ------------- |
| Switch to Tab 1 | `Cmd+1`     | `Ctrl+1`      |
| Switch to Tab 2 | `Cmd+2`     | `Ctrl+2`      |
| Switch to Tab 3 | `Cmd+3`     | `Ctrl+3`      |
| Execute Query   | `Cmd+Enter` | `Ctrl+Enter`  |

## 🤖 AI Features Guide

### Setup AI Features

1. Click the "AI" button in the toolbar
2. Enter your OpenAI API key
3. Select your preferred model:
   - **gpt-4o**: Latest and most capable model (recommended)
   - **gpt-4o-mini**: Fast and cost-effective
   - **o1-preview**: Advanced reasoning model
   - **gpt-4-turbo**: High performance model
   - **gpt-3.5-turbo**: Fast and economical

### Generate Query from Natural Language

1. Click "Create Query" in the AI dialog
2. Describe what you want in plain English (e.g., "Show me all users who signed up last month")
3. The AI will create an optimized SQL query based on your database schema
4. Click "Apply to Editor" to use the generated query

### Explain Query

1. Select a query (or portion of it) in the editor
2. Right-click and choose "Explain Query with AI"
3. Get a comprehensive explanation including:
   - What the query does (high-level summary)
   - Step-by-step breakdown of operations
   - Key concepts and techniques used
   - Potential issues or improvements

### Optimize Query Performance

1. Execute your query to get the execution plan
2. In the plan visualizer, click "Analyze with AI"
3. The AI analyzes performance bottlenecks and provides:
   - Specific optimization recommendations
   - Index suggestions
   - Query rewriting opportunities
   - Performance insights

### Analyze Query Results

1. After executing a query, click "AI Analysis" in the results toolbar
2. Get intelligent insights about your data:
   - Data patterns and trends
   - Quality issues (nulls, duplicates, outliers)
   - Business insights and observations
   - Recommendations for further analysis

### Table Relationship Discovery

1. Use the Table Topology viewer to visualize relationships
2. The AI can help explain complex relationship patterns
3. Navigate foreign key relationships with visual feedback

## 🔍 Advanced Features

### Spotlight Search

SQLTemple includes a powerful spotlight search feature similar to VS Code's Command Palette:

1. Press `Cmd+K` (or `Ctrl+K` on Windows/Linux) to open Spotlight Search
2. Search across:
   - Database connections
   - Tables and views
   - Columns and their data types
   - Database objects
3. Use fuzzy matching to quickly find what you're looking for
4. Navigate with arrow keys and press Enter to jump to any object

### Table Topology Visualization

Explore your database relationships with interactive topology diagrams:

1. Right-click on any table in the schema explorer
2. Select "View Topology" to see relationship diagrams
3. Features include:
   - Interactive Mermaid diagrams showing foreign key relationships
   - Zoom and pan controls for large relationship trees
   - Expandable nodes to explore deeper relationships
   - Visual distinction between incoming and outgoing relationships
   - Click to navigate between related tables

### Enhanced Results Grid

The results grid includes advanced features for data analysis:

- **Virtualized Rendering**: Handle millions of rows with smooth performance
- **Column Statistics**: Hover over column headers to see data distribution
- **Relationship Tooltips**: Hover over foreign key values to see related data
- **Export Options**: Export to CSV, JSON, Excel, and other formats
- **Adjustable Row Heights**: Customize display for different data types
- **Column Resizing**: Drag column borders to optimize view
- **Data Type Awareness**: Smart formatting based on PostgreSQL data types

### Query Performance Tools

Built-in tools to help optimize your queries:

- **Execution Plan Visualizer**: Interactive tree view of query execution plans
- **Cost Analysis**: Visual representation of query costs and timing
- **AI-Powered Optimization**: Get specific recommendations for query improvements
- **Query Limiting**: Automatic safeguards to prevent runaway queries

## 🛠️ Development

### Prerequisites

```bash
# Install Node.js 18+
brew install node   # or use nvm / volta on any platform

# Install dependencies
npm ci
```

### Development Commands

```bash
# Start in development mode
npm start

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Build for production
npm run make

# Package without making distributables
npm run package

# Rebuild native dependencies (after switching Node/Electron versions)
npm run rebuild
```

### Project Structure

```text
sqltemple/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── database/           # Database connection logic
│   │   │   ├── PostgresClient.ts
│   │   │   └── interfaces.ts
│   │   ├── ai/                 # OpenAI integration
│   │   │   └── AIService.ts
│   │   ├── storage/            # Local storage (SQLite)
│   │   │   └── StorageManager.ts
│   │   ├── menu/               # Application menu system
│   │   │   ├── menuBuilder.ts
│   │   │   └── menuConfig.ts
│   │   ├── ipc/                # IPC handlers
│   │   │   └── handlers.ts
│   │   ├── main.ts             # Main process entry point
│   │   └── preload.ts          # Secure preload script
│   └── renderer/               # React application
│       ├── components/         # UI components
│       │   ├── ResultsGrid/    # Advanced data grid components
│       │   ├── SpotlightSearch/ # Search functionality
│       │   ├── icons/          # Icon library
│       │   ├── SQLEditor.tsx   # Monaco editor wrapper
│       │   ├── SchemaExplorer.tsx
│       │   ├── TableTopology.tsx
│       │   ├── EnhancedResultsGrid.tsx
│       │   └── ...
│       ├── contexts/           # React contexts
│       │   ├── SettingsContext.tsx
│       │   └── ConfigContext.tsx
│       ├── hooks/              # Custom React hooks
│       │   ├── useResultsExport.ts
│       │   ├── useColumnResize.ts
│       │   ├── useRowHeight.ts
│       │   └── ...
│       ├── types/              # TypeScript definitions
│       └── App.tsx             # Main app component
├── forge.config.js             # Electron Forge configuration
├── webpack.*.js                # Webpack configurations
├── CLAUDE.md                   # AI assistant instructions
└── package.json                # Project dependencies
```

## 📦 Building for Distribution

Forge produces platform-specific installers. You must run the packaging commands on the matching operating system (or rely on the GitHub Actions workflow, which builds macOS, Windows, and Linux artifacts for each tagged release).

### Build for macOS (local)

```bash
# Build .app bundle
npm run package

# Build distributable (.dmg)
npm run make
```

The built application will be in:

- `.app` bundle: `out/SQLTemple-darwin-*/SQLTemple.app`
- `.dmg` installer: `out/make/SQLTemple-*.dmg`

### Build for Windows or Linux (local)

Run the same commands on a Windows or Linux machine respectively:

```bash
npm run make
```

Forge will emit installers under `out/make/` (Squirrel `.exe/.msi` on Windows, `.deb/.rpm/.zip` on Linux).

### Continuous Delivery

The `build-*` GitHub Actions jobs run `npm run make` on macOS, Windows, and Ubuntu runners, uploading the resulting installers as workflow artifacts. The `release` job downloads those artifacts and attaches them to GitHub Releases, giving you ready-to-share download links for every platform.

### Code Signing (Optional)

To sign your app for distribution:

1. Get an Apple Developer certificate
2. Update `forge.config.js` with your signing identity
3. Run `npm run make`

## 🔒 Security

- Database credentials are stored locally using secure storage
- AI API keys are never sent to any server except OpenAI
- All database connections support SSL/TLS
- No telemetry or usage data is collected

## 🐛 Troubleshooting

### Connection Issues

- **"getaddrinfo ENOTFOUND"**: Check your host URL, remove `https://` prefix
- **SSL errors**: Try toggling the SSL option
- **Permission denied**: Ensure your user has proper database permissions

### AI Features Not Working

- Check your OpenAI API key is valid
- Ensure you have credits in your OpenAI account
- Try a different model if one isn't working
- Check the browser console for detailed error messages

### Performance Issues

- For large result sets, the app automatically limits display
- Close unused tabs to free memory
- Restart the app if it becomes unresponsive

### Packaging Errors (Missing Native Modules)

- If you see `Cannot find module 'better-sqlite3'` in a packaged app, ensure `npm run rebuild` has been executed and rerun `npm run make`
- When packaging via CI, confirm that `@timfish/forge-externals-plugin` and the `externalModules` list in `forge.config.js` include every native dependency

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run typecheck` and `npm run lint`
5. Submit a pull request

## 📄 License

Apache 2.0 - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Editor powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- UI inspired by [Visual Studio Code](https://code.visualstudio.com/)
- AI features powered by [OpenAI](https://openai.com/)

---

<p align="center">Made with ❤️ by developers, for developers</p>
## 🤖 SQLTemple Agent Sidebar

SQLTemple now includes a fully autonomous agent that lives in the right-hand sidebar (toggle with `Cmd+L` / `Ctrl+L` or the toolbar button).

### Key Capabilities

- **Streaming Conversations**: Every response streams tokens in real time and is grouped into collapsible “Processing” traces so you can audit the agent’s ReAct loop.
- **Database-Aware Tools**: The agent can inspect schemas, run SQL safely, perform fuzzy searches across schemas/tables/views/columns, and suggest finished SQL for you to insert or execute.
- **Conversation History**: Sessions are stored locally. Reopen past conversations from the left list, duplicate them, or start a new draft with one click.
- **SQL Suggestions with Actions**: When the agent proposes SQL, it renders a card with “Insert” (append to the current tab without losing your work) and “Run” (execute immediately and open results) buttons.
- **Contextual Awareness**: The agent automatically reuses the currently-connected database and configured AI provider/model, so there’s nothing else to set up.

### Using the Agent

1. **Open the Sidebar**: Press `Cmd+L` / `Ctrl+L` or click the side-panel button in the toolbar.
2. **Start or Pick a Conversation**: Use “New Conversation” for a blank session or select any previous session from the list.
3. **Describe Your Intent**: Type natural language instructions—e.g., “Build me a query to fetch all task_executions with their artifacts”.
4. **Watch the Trace**: Expand “Processing” to see tool calls (schema inspection, database search, SQL runner, etc.).
5. **Apply SQL Suggestions**: Click **Insert** or **Run** on any SQL card the agent generates. Insert keeps your editor content, while Run executes the SQL immediately and streams rows into the grid.
6. **Resume Later**: All turns are persisted, so you can revisit a conversation, continue asking questions, or duplicate its SQL.

> Tip: Because the agent uses the same AI provider/model you configure in AI Settings, you can swap providers (OpenAI, Claude, local models) without changing your workflow.
