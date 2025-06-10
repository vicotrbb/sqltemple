# SQLTemple

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" />
</p>

SQLTemple is a modern, AI-powered SQL IDE built with Electron and React. It provides intelligent query assistance, execution plan visualization, and a VS Code-like development experience for database work.

## ✨ Features

### 🚀 Core Features

- **Modern SQL Editor**: Powered by Monaco Editor (VS Code's editor)
- **Multi-tab Interface**: Work with multiple queries simultaneously
- **Schema Explorer**: Browse databases, schemas, tables, and columns
- **Query Execution**: Execute full queries or selected portions
- **Results Grid**: View query results in a responsive data grid
- **Query History**: Track and reuse previous queries
- **Connection Management**: Save and manage multiple database connections

### 🤖 AI-Powered Features

- **Query Generation**: Generate SQL queries from natural language descriptions
- **Query Explanation**: Get detailed explanations of complex SQL queries
- **Query Optimization**: Optimize queries based on execution plans
- **Plan Analysis**: AI-powered analysis of query execution plans
- **Smart Completions**: Context-aware SQL completions

### 📊 Developer Features

- **Execution Plan Visualization**: Interactive tree view of query plans
- **Syntax Highlighting**: Full SQL syntax highlighting
- **Auto-completion**: Table, column, and keyword suggestions
- **Customizable Shortcuts**: Configure your own keyboard shortcuts
- **Dark Theme**: Beautiful VS Code-inspired dark theme

## 🖥️ Supported Databases

- PostgreSQL (including Supabase, Neon, etc.)
- More databases coming soon!

## 📋 Requirements

- macOS 10.15 or later
- Node.js 16 or later (for development)
- OpenAI API key (for AI features)

## 🚀 Installation

### Option 1: Download Pre-built App

1. Go to the [Releases](https://github.com/yourusername/sqltemple/releases) page
2. Download the latest `.dmg` file
3. Open the DMG and drag SQLTemple to your Applications folder
4. Launch SQLTemple from Applications

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/sqltemple.git
cd sqltemple

# Install dependencies
npm install

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

### Query Operations

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| Execute Query | `Cmd+Enter` | `Ctrl+Enter` |
| Explain Query | `Cmd+E` | `Ctrl+E` |
| New Tab | `Cmd+T` | `Ctrl+T` |
| Close Tab | `Cmd+W` | `Ctrl+W` |
| Toggle History | `Cmd+H` | `Ctrl+H` |

### AI Features

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| Explain with AI | `Cmd+Shift+E` | `Ctrl+Shift+E` |
| Optimize with AI | `Cmd+Shift+O` | `Ctrl+Shift+O` |
| Create Query | `Cmd+Shift+N` | `Ctrl+Shift+N` |

## 🤖 AI Features Guide

### Generate Query from Natural Language

1. Click "Create Query" or press `Cmd+Shift+N`
2. Describe what you want in plain English
3. Click "Generate Query"
4. The AI will create an optimized SQL query based on your schema

### Explain Query

1. Select a query (or portion of it)
2. Right-click and choose "Explain Query with AI"
3. Get a detailed explanation of what the query does

### Optimize Query

1. Select a query
2. Right-click and choose "Optimize Query with AI"
3. The AI analyzes the execution plan and suggests optimizations
4. Click "Apply to Editor" to use the optimized version

### Analyze Execution Plan

1. Run "Explain" on any query
2. In the plan visualizer, click "Analyze with AI"
3. Get insights about performance bottlenecks and optimization opportunities

## 🛠️ Development

### Prerequisites

```bash
# Install Node.js 16+
brew install node

# Install dependencies
npm install
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
```

### Project Structure

```text
sqltemple/
├── src/
│   ├── main/           # Electron main process
│   │   ├── database/   # Database connection logic
│   │   ├── ai/         # OpenAI integration
│   │   ├── storage/    # Local storage (SQLite)
│   │   └── ipc/        # IPC handlers
│   └── renderer/       # React application
│       ├── components/ # UI components
│       ├── contexts/   # React contexts
│       └── App.tsx     # Main app component
├── forge.config.js     # Electron Forge configuration
├── webpack.*.js        # Webpack configurations
└── package.json        # Project dependencies
```

## 📦 Building for Distribution

### Build for macOS

```bash
# Build .app bundle
npm run package

# Build distributable (.dmg)
npm run make
```

The built application will be in:

- `.app` bundle: `out/SQLTemple-darwin-*/SQLTemple.app`
- `.dmg` installer: `out/make/SQLTemple-*.dmg`

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

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run typecheck` and `npm run lint`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Editor powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- UI inspired by [Visual Studio Code](https://code.visualstudio.com/)
- AI features powered by [OpenAI](https://openai.com/)

---

<p align="center">Made with ❤️ by developers, for developers</p>
