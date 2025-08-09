# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **QKDPX** - a fast and modern CLI tool for npm package publishing with automated workflow. It's built with TypeScript and Node.js, providing an interactive publishing experience that handles git commits, version bumping, building, and npm publishing automatically.

## Architecture

### Core Structure
```
src/
├── index.ts              # CLI entry point with commander.js
├── commands/             # CLI command implementations
│   └── publish.ts        # Main publish command with Listr workflow
├── modules/              # Core business logic modules
│   ├── ChangeDetector.ts # Git status and package.json detection  
│   ├── CommitManager.ts  # Interactive git commit handling
│   ├── VersionManager.ts # Semantic version bumping with inquirer
│   └── PublishManager.ts # Registry config and npm publishing
├── utils/                # Utility classes
│   ├── ConfigManager.ts  # .qkdpxrc configuration management
│   └── GitHelper.ts      # Native git command wrapper
└── types/                # TypeScript type definitions
    └── index.ts          # Shared interfaces and types
```

### Key Dependencies
- **commander**: CLI framework for command parsing
- **inquirer**: Interactive command line user interfaces
- **listr2**: Task list runner with progress indicators
- **semver**: Semantic versioning utilities
- **chalk**: Terminal styling
- **ora**: Terminal spinners
- **fs-extra**: Enhanced file system operations

### Workflow Architecture
The publish command follows a 7-phase workflow implemented as Listr tasks:
1. **Change Detection** - Check git status and read package.json
2. **Commit Management** - Handle uncommitted changes with user prompts
3. **Version Bumping** - Interactive version selection and package.json update
4. **Build Verification** - Run build scripts if available
5. **Version Commit** - Auto-commit version bump with git tag
6. **Publish Configuration** - Configure npm registry and authentication
7. **Package Publishing** - Execute npm publish with confirmation

## Development Commands

```bash
# Development
npm run dev                # Run with tsx for development
npm run build             # Compile TypeScript to dist/
npm run build:watch       # Watch mode compilation

# Code Quality  
npm run lint              # ESLint checking
npm run lint:fix          # Fix ESLint issues
npm run format            # Prettier formatting
npm run typecheck         # TypeScript type checking

# Testing & Publishing
npm run clean             # Remove dist/ folder
npm start                 # Run compiled version
```

## Key Features

### Interactive Workflow
- Uses **inquirer** for user prompts (commit messages, version selection, registry config)
- **Listr2** provides visual task progress with skip conditions
- **chalk** and **ora** for enhanced terminal UI

### Git Integration
- **Native git commands** via child_process.spawn for lightweight operation
- Detects uncommitted changes and prompts for commit
- Auto-commits version bumps with conventional commit messages
- Creates git tags for versions
- GitHelper utility class wraps all git operations

### Version Management  
- **semver** for semantic version calculations
- Interactive version bump selection (patch/minor/major)
- Updates package.json and commits changes automatically

### Publishing Safety
- Build verification before publishing
- Registry configuration detection (.npmrc)
- Interactive authentication setup (login/token)
- Final confirmation before npm publish
- Dry-run mode support

## Configuration

Supports `.qkdpxrc` JSON configuration file in project root with options:
- `defaultVersionBump`: Default version increment type
- `autoCommit`: Whether to auto-commit changes  
- `skipTests`/`skipBuild`: Skip test/build phases
- `registry`: Default npm registry URL
- `generateChangelog`: Enable changelog generation

## Development Notes

- Uses ES modules (see package.json "type": "module")
- CLI executable is `bin/qkdpx.js` which imports compiled `dist/index.js`
- TypeScript strict mode enabled with comprehensive compiler options
- ESLint + Prettier configured for code consistency
- All modules use async/await for promise handling
- Error handling includes user-friendly messages and graceful exits
- Native git commands eliminate external dependencies for git operations