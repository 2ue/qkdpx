# QKDPX - Fast NPM Publishing Tool

A modern CLI tool for automated npm package publishing with git management, version control, GitHub Actions integration, and secure configuration management.

English | [简体中文](README.zh-CN.md)

## Features

- 🔍 **Smart Detection** - Automatically detects uncommitted changes and current version status
- 📝 **Interactive Commits** - Optional commit handling with user-friendly prompts
- 🏷️ **Semantic Versioning** - Support for patch/minor/major version bumps with "none" option
- 🔨 **Auto Build** - Automatically runs build scripts before publishing (if exists)
- 📦 **Safe Publishing** - Secure publishing with temporary .npmrc file management
- 🔐 **Unified Configuration** - Global configuration management with encrypted auth token storage
- 🏷️ **Post-Publish Tagging** - Creates git commits and tags only after successful publication
- 🚀 **GitHub Actions Integration** - Release command for automated CI/CD workflows
- 📤 **Optional Remote Push** - Choose whether to push commits and tags to remote repository
- ⚡ **Modern Toolchain** - Built with TypeScript + Node.js using ES modules

## Installation

### Install from NPM

```bash
# Global installation
npm install -g qkdpx

# Or use with npx
npx qkdpx publish
```

### Development Installation

```bash
# Clone the repository
git clone <repository-url>
cd dpx

# Install dependencies
npm install

# Build the project
npm run build

# Link locally for development
npm link
```

## Usage

### Publish Command

```bash
# Publish current project
qkdpx publish

# Specify version bump type
qkdpx publish --version patch
qkdpx publish --version minor
qkdpx publish --version major

# Skip confirmation prompts
qkdpx publish --skip-confirm

# Dry run (no actual publishing)
qkdpx publish --dry-run
```

### Release Command (GitHub Actions Integration)

```bash
# Interactive release workflow
qkdpx release

# Specify version bump type
qkdpx release --version patch
qkdpx release --version minor  
qkdpx release --version major

# Skip confirmation prompts
qkdpx release --skip-confirm

# Custom commit message
qkdpx release -m "feat: add new features"
```

### Configuration Management

```bash
# Initialize configuration
qkdpx init

# Show current configuration
qkdpx init --show
```

## Commands Overview

| Command | Purpose | GitHub Actions |
|---------|---------|----------------|
| `qkdpx publish` | Publish to npm only | ❌ |
| `qkdpx release` | Commit → Tag → Push → Trigger CI/CD | ✅ |
| `qkdpx init` | Configure authentication | - |

## Workflow

### Publish Workflow (Direct NPM Publishing)

The publishing workflow follows a safe, **publish-first-then-commit** approach:

1. **Change Detection** - Check git status and package.json
2. **Commit Handling** - Optional commit of uncommitted changes
3. **Version Selection** - Interactive or specified version bump
4. **Build Verification** - Run build scripts if available
5. **NPM Publishing** - Secure publish with temporary .npmrc
6. **Post-Publish Git Operations** - Commit version changes and create tags
7. **Optional Remote Push** - Choose whether to push to remote

### Release Workflow (GitHub Actions Integration)

Designed to trigger automated CI/CD pipelines:

1. **Change Detection** - Check git status and package.json
2. **Commit Handling** - Handle uncommitted changes
3. **Version Bump** - Optional version upgrade with user confirmation
4. **Git Operations** - Commit version changes and create version tag
5. **Remote Push** - Push commits and tags to trigger GitHub Actions
6. **CI/CD Trigger** - GitHub Actions handles build and publish automatically

## GitHub Actions Integration

### Setup GitHub Actions

Create `.github/workflows/release.yml`:

```yaml
name: Release and Publish
on:
  push:
    tags: ['v*.*.*']

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: |
          npm ci
          npm run build
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Usage with CI/CD

```bash
# Local development and testing
qkdpx publish --dry-run

# Release to trigger GitHub Actions
qkdpx release --version patch
```

This will:
1. Commit any changes locally
2. Bump version and commit
3. Create and push version tag (`v1.0.1`)
4. GitHub Actions automatically builds and publishes to npm
5. Creates GitHub release with artifacts

## Configuration

### Global Configuration (`~/.qkdpx/config.json`)

```json
{
  "registry": "https://registry.npmjs.org/",
  "authToken": "<encrypted-token>"
}
```

### Security Features

- **Encrypted Auth Token** - AES-256-CBC encryption for token storage
- **File Permissions** - User-accessible only
- **Display Masking** - Tokens shown as `abc***xyz` format
- **Temporary Authentication** - Auto-cleanup of temporary .npmrc files

## Development

### Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Development mode with tsx
npm run build        # Build TypeScript to JavaScript
npm run lint         # ESLint checking
npm run typecheck    # TypeScript type checking
npm run clean        # Clean build artifacts
```

### Project Structure

```
src/
├── commands/
│   ├── init.ts           # Configuration command
│   ├── publish.ts        # NPM publish workflow
│   └── release.ts        # GitHub Actions release workflow
├── modules/              # Business logic
├── utils/                # Utility classes
└── types/                # TypeScript definitions
```

## Advanced Examples

### Version Management

```bash
# Keep current version (just tag and push)
qkdpx release --version none

# Interactive selection with custom message
qkdpx release -m "chore: prepare for release"

# Automated release in CI environment
qkdpx release --version patch --skip-confirm
```

### Error Recovery

Both workflows include automatic error recovery:
- **Publish Failure**: Reverts package.json changes
- **Tag Conflicts**: Interactive overwrite prompts
- **Git Errors**: Clean rollback to previous state

## Troubleshooting

### Common Issues

1. **Authentication**: `qkdpx init` to reconfigure
2. **Build Failures**: Ensure `npm run build` works
3. **Tag Conflicts**: Choose overwrite or manually delete tags
4. **Git Issues**: Check `git config --list`

### Debug Mode

```bash
DEBUG=qkdpx* qkdpx publish
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature/name`)
5. Open Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.