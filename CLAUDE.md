# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SQLTemple is an AI-powered desktop SQL IDE built with Electron and React. It provides intelligent query assistance, execution plan visualization, and a modern development experience for database work.

## Architecture

### Tech Stack

- **Desktop Framework**: Electron
- **Frontend**: React, TypeScript, Tailwind CSS
- **SQL Editor**: Monaco Editor
- **Database Support**: PostgreSQL (initial), extensible to other databases
- **AI Integration**: OpenAI API
- **Local Storage**: SQLite
- **Build Tool**: Electron Forge

### Process Architecture

- **Main Process**: Handles database connections, AI API calls, and system operations
- **Renderer Process**: React UI with Monaco Editor
- **IPC Communication**: Secure message passing between processes

## Development Commands

Since the project is not yet initialized, use the following commands to set up:

```bash
# Initial setup (following implementation_plan.md Step 1)
npm init -y
npm install --save-dev electron electron-forge @electron-forge/cli
npx electron-forge init . --template=webpack-typescript

# After initialization, typical commands will be:
npm start          # Run in development mode
npm run make       # Build distributables
npm run lint       # Run linting
npm test          # Run tests
```

## Key Implementation Guidelines

1. **Database Abstraction**: Use interface-based design in `src/database/` to support multiple database types
2. **Security**: Never expose database credentials in renderer process; handle all DB operations in main process
3. **State Management**: Use React Context API or Zustand for global state
4. **AI Features**: Implement rate limiting and error handling for OpenAI API calls
5. **Performance**: Use React.memo and useMemo for query result rendering optimization

## Project Structure (Planned)

```
src/
├── main/              # Electron main process
│   ├── database/      # Database connection logic
│   ├── ai/           # OpenAI integration
│   └── ipc/          # IPC handlers
├── renderer/         # React application
│   ├── components/   # UI components
│   ├── hooks/       # Custom React hooks
│   └── utils/       # Frontend utilities
└── shared/          # Shared types and constants
```

## Important References

- **Product Requirements**: documentation/prd.md
- **Implementation Plan**: documentation/implementation_plan.md (follow the 23-step plan)
- **Database Connections**: Store encrypted in SQLite using electron-store
- **Query History**: Implement with timestamps and search functionality
