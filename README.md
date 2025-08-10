# QKDPX - Fast NPM Publishing Tool

A modern CLI tool for automated npm package publishing with git management, version control, and secure configuration management.

English | [简体中文](README.zh-CN.md)

## Features

- 🔍 **Smart Detection** - Automatically detects uncommitted changes and current version status
- 📝 **Interactive Commits** - Optional commit handling with user-friendly prompts
- 🏷️ **Semantic Versioning** - Support for patch/minor/major version bumps with "none" option
- 🔨 **Auto Build** - Automatically runs build scripts before publishing (if exists)
- 📦 **Safe Publishing** - Secure publishing with temporary .npmrc file management
- 🔐 **Unified Configuration** - Global configuration management with encrypted auth token storage
- 🏷️ **Post-Publish Tagging** - Creates git commits and tags only after successful publication
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

### Basic Usage

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

### Configuration Management

```bash
# Initialize configuration
qkdpx init

# Show current configuration
qkdpx init --show
```

## Workflow

The publishing workflow follows a safe, **publish-first-then-commit** approach:

### 1. 🔍 **Change Detection**
- Checks git working directory status
- Reads current package.json information
- Detects uncommitted changes

### 2. 📝 **Commit Handling** (Optional)
- If uncommitted changes exist, prompts user to commit or skip
- **Skip option**: Continue publishing without committing changes
- **Commit option**: Interactive commit message input and automatic commit

### 3. 🏷️ **Version Preparation**
- Interactive version bump selection (patch/minor/major/none)
- **None option**: Keep current version unchanged
- Updates package.json **without** committing immediately

### 4. ✅ **Final Confirmation**
- Shows package name and target version
- Last chance to cancel before publishing

### 5. 🔨 **Build Verification**
- Automatically runs `npm run build` if build script exists
- Ensures code builds successfully before publishing

### 6. 📦 **Package Publishing**
- Creates temporary `.npmrc` file with registry and auth token
- Publishes to npm with `--access public` flag
- Automatically cleans up temporary `.npmrc` file
- **Safe authentication**: Preserves existing `.npmrc` content if present

### 7. 🏷️ **Post-Publish Git Operations** (Only after successful publish)
- **Version Commit**: Commits package.json changes with conventional message
- **Git Tagging**: Creates version tag (e.g., `v1.0.0`)
- **Tag Conflict Handling**: Detects existing tags and prompts for overwrite
- **Skip Logic**: No commit/tag if version wasn't changed

### 8. 📤 **Remote Push** (Optional)
- Prompts whether to push commits and tags to remote repository
- **Default**: No (safer option)
- Pushes both commits and tags if confirmed

## Error Handling & Recovery

### Publish Failure Recovery
- **Automatic Rollback**: Reverts package.json changes if publishing fails
- **No Git Pollution**: No commits or tags created on failure
- **Clean State**: Working directory returns to pre-publish state

### Tag Conflict Resolution
- **Detection**: Checks if version tag already exists
- **Interactive Resolution**: Prompts user to overwrite existing tag
- **Safe Deletion**: Removes old tag before creating new one

### Configuration Safety
- **Temporary .npmrc**: Uses temporary authentication that doesn't affect global settings
- **Backup & Restore**: Preserves existing .npmrc content if present
- **Cleanup Guarantee**: Always removes temporary files, even on error

## Configuration

### Global Configuration (`~/.qkdpx/config.json`)

QKDPX uses a single global configuration system stored in user's home directory:

```json
{
  "registry": "https://registry.npmjs.org/",
  "authToken": "<encrypted-token>"
}
```

### Security Features

- **Encrypted Auth Token**: Uses AES-256-CBC encryption for token storage
- **File Permissions**: Global configuration files are user-accessible only
- **Display Masking**: Auth tokens are automatically masked as `abc***xyz` format
- **Temporary Authentication**: Uses temporary .npmrc files that are automatically cleaned up

## Development

### Development Commands

```bash
# Install dependencies
npm install

# Development mode with tsx
npm run dev

# Build TypeScript to JavaScript
npm run build

# Watch mode for development
npm run build:watch

# Code quality checks
npm run lint              # ESLint checking
npm run lint:fix          # Fix ESLint issues automatically
npm run format            # Prettier formatting
npm run typecheck         # TypeScript type checking

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run the built CLI
npm start

# Test with development version
npm run dev -- publish --dry-run
```

## Architecture

### Core Dependencies

- **commander.js** - CLI framework and command parsing
- **inquirer** - Interactive command line interfaces
- **listr2** - Task list runner with progress indicators
- **semver** - Semantic versioning utilities
- **fs-extra** - Enhanced file system operations
- **chalk** - Terminal styling and colors
- **ora** - Elegant terminal spinners

### Design Principles

- **Native Git Commands** - Uses `child_process.spawn` for git operations, no external dependencies
- **ES Modules** - Full support for modern JavaScript module system
- **TypeScript** - Type safety and enhanced developer experience
- **Modular Architecture** - Clear separation of concerns and code organization
- **Encrypted Storage** - Uses Node.js native crypto module for sensitive information
- **Publish-First Philosophy** - Only creates git commits/tags after successful npm publication

### Project Structure

```
src/
├── commands/              # CLI command implementations
│   ├── init.ts           # Configuration initialization command
│   └── publish.ts        # Main publish command with workflow orchestration
├── modules/              # Core business logic modules
│   ├── ChangeDetector.ts # Git status and package.json detection
│   ├── CommitManager.ts  # Git commit and tag management (post-publish)
│   ├── VersionManager.ts # Version selection and package.json updates
│   └── PublishManager.ts # NPM publishing with temporary .npmrc handling
├── utils/                # Utility classes
│   ├── ConfigManager.ts  # Global configuration management with encryption
│   └── GitHelper.ts      # Git command wrapper utilities
├── types/                # TypeScript type definitions
│   └── index.ts          # Shared interfaces and types
└── index.ts              # CLI entry point with commander setup
```

## Advanced Usage

### Version Selection Options

```bash
# Interactive version selection (default)
qkdpx publish

# Keep current version unchanged
qkdpx publish --version none

# Specific version bumps
qkdpx publish --version patch    # 1.0.0 → 1.0.1
qkdpx publish --version minor    # 1.0.0 → 1.1.0
qkdpx publish --version major    # 1.0.0 → 2.0.0
```

### Commit Handling Options

When uncommitted changes are detected:
- **Commit**: Enter commit message and commit before publishing
- **Skip**: Continue publishing without committing changes
- **Cancel**: Abort the publishing process

### Configuration Management

```bash
# Interactive configuration setup
qkdpx init

# View current configuration (tokens are masked)
qkdpx init --show

# Reconfigure existing setup
qkdpx init  # Will show current values and allow updates
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```bash
   # Reconfigure authentication
   qkdpx init
   ```

2. **Build Failures**
   ```bash
   # Ensure build script exists and works
   npm run build
   ```

3. **Git Permission Issues**
   ```bash
   # Check git configuration
   git config --list
   ```

4. **Tag Conflicts**
   - Choose "overwrite" when prompted
   - Or manually delete conflicting tags: `git tag -d v1.0.0`

### Debug Information

Enable verbose logging by setting environment variable:
```bash
DEBUG=qkdpx* qkdpx publish
```

## Roadmap

### v0.2.0
- [ ] Support for custom build command configuration
- [ ] Pre-publish test execution options
- [ ] Monorepo project structure support
- [ ] Publishing history tracking

### v0.3.0
- [ ] Automatic changelog generation
- [ ] Conventional commits integration
- [ ] Multi-registry publishing support
- [ ] Rollback functionality

### v1.0.0
- [ ] Complete plugin system
- [ ] Web UI for configuration
- [ ] CI/CD integration templates
- [ ] Comprehensive documentation and examples

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.