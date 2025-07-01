# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm start` - Start development server with hot reload
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint across the codebase
- `npm run rebuild` - Rebuild native modules for Electron

### Building and Distribution

- `npm run package` - Create .app bundle for current platform
- `npm run make` - Build distributables (.dmg for macOS)
- `npm run publish` - Publish to configured distribution channels

### Post-Installation

- `npm run postinstall` - Automatically rebuilds better-sqlite3 after npm install

## Architecture Overview

SQLTemple is an Electron-based SQL IDE with a clean separation between main and renderer processes:

### Main Process (`src/main/`)

- **Database Operations**: PostgreSQL connections, query execution, schema introspection
- **AI Integration**: OpenAI API calls for query generation, explanation, and optimization
- **Local Storage**: SQLite database for connection profiles, settings, and query history
- **IPC Handlers**: Bridge between UI and system-level operations
- **Menu System**: Application menu with keyboard shortcuts

### Renderer Process (`src/renderer/`)

- **React Application**: Modern React 19 with hooks and context
- **Monaco Editor**: VS Code editor integration for SQL editing
- **Component Architecture**: Modular components with clear responsibilities
- **State Management**: React Context for settings and application state

### Key Technologies

- **Electron + React + TypeScript**: Core stack
- **Monaco Editor**: SQL syntax highlighting and auto-completion
- **PostgreSQL (pg)**: Database connectivity
- **Better SQLite3**: Local application data storage
- **OpenAI**: AI-powered query assistance
- **Tailwind CSS**: Utility-first styling

## IPC Communication Patterns

The app uses Electron's contextBridge for secure communication between processes:

### Database Operations

- `database:connect` - Establish database connection
- `database:execute` - Execute SQL queries
- `database:getSchema` - Retrieve database schema information

### AI Features

- `ai:generateQuery` - Generate SQL from natural language
- `ai:explainQuery` - Get query explanations
- `ai:optimizeQuery` - Optimize queries based on execution plans

### Settings and Storage

- `storage:get` / `storage:set` - Manage application settings
- `history:add` / `history:get` - Query history management

## Component Structure

### Core Components

- `App.tsx` - Main application shell with tab management
- `TabManager.tsx` - Multi-tab interface for query sessions
- `ResultsGrid.tsx` - Data display with virtualization support
- `SchemaExplorer.tsx` - Database schema tree view
- `QueryEditor.tsx` - Monaco editor wrapper with SQL features

### Dialog Components

- `ConnectionDialog.tsx` - Database connection configuration
- `AIDialog.tsx` - AI feature configuration and usage
- `AboutDialog.tsx` - Application information
- `PreferencesDialog.tsx` - User settings

### Utility Components

- `LoadingSpinner.tsx` - Loading indicators
- `ErrorBoundary.tsx` - Error handling
- `ConfirmDialog.tsx` - User confirmations

## State Management

### React Context Usage

- `SettingsContext` - Global application settings and preferences
- `ConnectionContext` - Active database connections and profiles
- `HistoryContext` - Query history and session state

### Local Storage Schema

The app uses SQLite for local persistence:

- `connections` table - Database connection profiles
- `history` table - Query execution history
- `settings` table - Application preferences and AI configuration

## Build Configuration

### Webpack Setup

- **Main Process**: `webpack.main.config.js` - Node.js environment
- **Renderer Process**: `webpack.renderer.config.js` - Browser environment with React
- **Monaco Integration**: Monaco Editor webpack plugin for proper worker loading

### Electron Forge

- **Packaging**: Configured for macOS (.app, .dmg) with Windows/Linux support
- **Code Signing**: Ready for Apple Developer ID signing
- **Auto-unpack**: Native modules (better-sqlite3) properly unpacked

## Security Considerations

### Context Isolation

- Renderer process has no direct Node.js access
- All system operations go through secure IPC channels
- Database credentials stored in local SQLite with proper access controls

### API Key Management

- OpenAI API keys stored locally and never transmitted except to OpenAI
- No telemetry or usage data collection
- SSL/TLS support for all database connections

## Testing and Quality

### Type Safety

- Strict TypeScript configuration
- Path aliases configured (@/*maps to src/*)
- Comprehensive type definitions for all IPC channels

### Code Quality

- ESLint configuration for consistent code style
- Automatic rebuilding of native modules on install
- Hot reload during development for faster iteration

## Common Development Patterns

### Adding New IPC Handlers

1. Define handler in `src/main/ipc/handlers.ts`
2. Define handler in `src/renderer/global.d.ts`
3. Add type definitions in `src/renderer/types/window.d.ts`
4. Expose via preload script in `src/main/preload.ts`
5. Use in renderer via `window.electron.ipcRenderer`

### Adding New Components

- Follow existing component patterns with proper TypeScript interfaces
- Use Tailwind classes for styling consistency
- Implement proper error boundaries and loading states
- Add to appropriate context providers when needed

### Database Operations Constraints

- Always use parameterized queries to prevent SQL injection
- Handle connection failures gracefully with user feedback
- Cache schema information to reduce database round trips
- Support both full query and selection execution

### AI Feature Integration

- Check for API key availability before making requests
- Provide clear error messages for API failures
- Support multiple OpenAI models (GPT-4, GPT-3.5-turbo, O1)
- Include schema context in AI requests for better results
