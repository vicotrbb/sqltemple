# Contributing to SQLTemple

Thank you for your interest in contributing to SQLTemple! This document provides guidelines and instructions for contributing to the project.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/vicotrbb/sqltemple.git`
3. Install dependencies: `npm install`
4. Start development: `npm start`
5. Make your changes
6. Test your changes: `npm run typecheck && npm run lint`
7. Submit a pull request

## 📋 Table of Contents

- Code of Conduct
- Development Setup
- Development Workflow
- Coding Standards
- Testing Guidelines
- Commit Guidelines
- Pull Request Process
- Issue Reporting
- Architecture Guidelines

## 📜 Code of Conduct

This project adheres to a code of conduct adapted from the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code. Please report unacceptable behavior to [victor.bona@hotmail.com](mailto:victor.bona@hotmail.com).

### Our Standards

- Use welcoming language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🛠️ Development Setup

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **macOS, Windows, or Linux** (macOS recommended for development)

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/sqltemple.git
cd sqltemple

# Add upstream remote
git remote add upstream https://github.com/victorbona/sqltemple.git

# Install dependencies
npm install

# Start development server
npm start
```

### Development Commands

```bash
# Start development with hot reload
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run make

# Package without distributables
npm run package

# Rebuild native modules
npm run rebuild
```

### IDE Setup

We recommend **Visual Studio Code** with these extensions:

- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- ESLint
- Prettier
- GitLens

## 🔄 Development Workflow

### Branch Naming Convention

```text
feature/your-feature-name     # New features
bugfix/issue-description      # Bug fixes
hotfix/critical-fix          # Critical fixes
docs/documentation-update    # Documentation
refactor/component-name      # Code refactoring
chore/maintenance-task       # Maintenance tasks
```

### Typical Workflow

1. **Sync with upstream:**

   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

2. **Create feature branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit frequently:**

   ```bash
   git add .
   git commit -m "feat: add query export functionality"
   ```

4. **Keep your branch updated:**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

5. **Test your changes:**

   ```bash
   npm run typecheck
   npm run lint
   npm start # Manual testing
   ```

6. **Push and create PR:**

   ```bash
   git push origin feature/your-feature-name
   # Create PR through GitHub UI
   ```

## 📏 Coding Standards

### TypeScript Guidelines

- **Always use TypeScript** - No plain JavaScript files
- **Strict mode enabled** - Follow strict TypeScript configurations
- **Explicit return types** for public methods
- **Interface over type** for object definitions
- **Proper error handling** with typed errors
- **Strong types Always** - Do not use any, and preferrably do not use unkown

```typescript
// ✅ Good
interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
}

async function connectToDatabase(
  config: DatabaseConnection
): Promise<Connection> {
  try {
    // Implementation
    return connection;
  } catch (error) {
    throw new DatabaseConnectionError(`Failed to connect: ${error.message}`);
  }
}

// ❌ Avoid
function connect(config: any) {
  // Implementation without proper typing
}
```

### React Guidelines

- **Functional components** with hooks
- **TypeScript interfaces** for all props
- **Custom hooks** for shared logic
- **Error boundaries** for error handling
- **Proper cleanup** in useEffect

```typescript
// ✅ Good
interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute?: () => void;
}

const QueryEditor: React.FC<QueryEditorProps> = ({ value, onChange, onExecute }) => {
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);

  return (
    // JSX
  );
};

// ❌ Avoid
const QueryEditor = (props) => {
  // Implementation without proper typing
};
```

### Electron Guidelines

- **Context isolation** must be maintained
- **IPC handlers** should be properly typed
- **Security best practices** for all main process code
- **Proper error handling** in IPC communication

### Styling Guidelines

- **Tailwind CSS** for styling
- **Consistent spacing** using Tailwind's spacing scale
- **CSS custom properties** for theme values
- **Responsive design** considerations

```tsx
// ✅ Good
<button className="px-4 py-2 bg-vscode-blue hover:bg-vscode-blue-light text-white rounded transition-colors">
  Execute Query
</button>

// ❌ Avoid inline styles
<button style={{padding: '8px 16px', backgroundColor: '#007acc'}}>
  Execute Query
</button>
```

## 🧪 Testing Guidelines

### Testing Strategy

We follow a comprehensive testing approach:

```text
tests/
├── unit/           # Unit tests (Jest)
├── integration/    # Integration tests
├── e2e/           # End-to-end tests (Playwright)
└── fixtures/      # Test data and mocks
```

### Writing Tests

```typescript
// Unit test example
describe("DatabaseService", () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = new DatabaseService();
  });

  it("should connect to database with valid config", async () => {
    const config: DatabaseConnection = {
      host: "localhost",
      port: 5432,
      database: "test",
    };

    const result = await service.connect(config);
    expect(result.success).toBe(true);
  });

  it("should handle connection errors gracefully", async () => {
    const invalidConfig: DatabaseConnection = {
      host: "invalid",
      port: 0,
      database: "",
    };

    await expect(service.connect(invalidConfig)).rejects.toThrow(
      DatabaseConnectionError
    );
  });
});
```

### Test Requirements

- **Unit tests** for all services and utilities
- **Integration tests** for IPC communication
- **Component tests** for React components
- **E2E tests** for critical user workflows
- **Minimum 80% code coverage** for new code

## 📝 Commit Guidelines

We follow [Conventional Commits](https://conventionalcommits.org/) specification:

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Commit Format

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Examples

```bash
feat(ai): add Claude AI provider support
fix(database): resolve connection timeout issue
docs(readme): update installation instructions
refactor(components): extract Monaco editor service
test(database): add integration tests for PostgreSQL client
```

### Commit Best Practices

- **Keep commits atomic** - One logical change per commit
- **Write descriptive messages** - Explain what and why, not how
- **Reference issues** - Use `fixes #123` or `closes #123`
- **Use imperative mood** - "Add feature" not "Added feature"

## 🔍 Pull Request Process

### Before Creating a PR

1. **Sync with upstream main**
2. **Run all checks locally:**

   ```bash
   npm run typecheck
   npm run lint
   # npm test (when tests are available)
   ```

3. **Test your changes manually**
4. **Update documentation** if needed
5. **Add/update tests** for new functionality

### PR Requirements

- **Clear title and description**
- **Link to related issues**
- **Screenshots/GIFs** for UI changes
- **All checks must pass**
- **At least one approving review**
- **Up-to-date with main branch**

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** of functionality
4. **Approval** and merge

## 🐛 Issue Reporting

### Before Reporting

1. **Check existing issues** - Search for similar problems
2. **Try latest version** - Ensure you're using the current release
3. **Gather information** - Steps to reproduce, error messages, environment

### Issue Types

#### Bug Report

```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**

1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**

- OS: [e.g., macOS 12.0]
- Node.js version: [e.g., 18.17.0]
- SQLTemple version: [e.g., 1.0.0]

**Additional context**
Any other information
```

#### Feature Request

```markdown
**Is your feature request related to a problem?**
Description of the problem

**Describe the solution you'd like**
Clear description of desired feature

**Describe alternatives considered**
Alternative solutions or workarounds

**Additional context**
Mockups, examples, or other context
```

## 🏗️ Architecture Guidelines

### Project Structure

```text
src/
├── main/              # Electron main process
│   ├── ai/           # AI service providers
│   ├── database/     # Database clients and interfaces
│   ├── ipc/          # IPC handlers
│   ├── menu/         # Application menu
│   ├── storage/      # Local storage management
│   └── main.ts       # Main process entry
└── renderer/         # React application
    ├── components/   # React components
    ├── contexts/     # React contexts
    ├── hooks/        # Custom hooks
    ├── services/     # Client-side services
    └── types/        # Type definitions
```

### Adding New Features

#### Database Providers

1. Extend `DatabaseClient` interface
2. Implement provider in `src/main/database/`
3. Add IPC handlers
4. Update UI components
5. Add tests

#### AI Providers

1. Implement `AIProvider` interface
2. Register in `AIProviderRegistry`
3. Add configuration options
4. Update settings UI
5. Add integration tests

#### Components

1. Create in appropriate directory
2. Follow naming conventions
3. Include TypeScript interfaces
4. Add to export index
5. Write component tests

### Security Considerations

- **Never expose sensitive data** to renderer process
- **Validate all IPC inputs** in main process
- **Use parameterized queries** for database operations
- **Encrypt sensitive storage** data
- **Follow Electron security guidelines**

## 📚 Resources

### Documentation

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)

### Tools

- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/)
- [Better SQLite3](https://github.com/WiseLibs/better-sqlite3)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🆘 Getting Help

- **GitHub Discussions** - For questions and discussions
- **GitHub Issues** - For bug reports and feature requests
- **Discord** - [Join our community](https://discord.gg/sqltemple) (if available)
- **Email** - [victor.bona@hotmail.com](mailto:victor.bona@hotmail.com)

## 🎉 Recognition

Contributors are recognized in:

- README.md contributors section
- Release notes for their contributions
- Special thanks in major releases

Thank you for contributing to SQLTemple! 🚀
