# QKDPX - 快速 NPM 发布工具

一个现代化的 CLI 工具，用于 npm 包的自动化发布，支持 git 管理、版本控制、GitHub Actions 集成和安全配置管理。

[English](README.md) | 简体中文

## 功能特性

- 🔍 **智能检测** - 自动检测未提交的更改和当前版本状态
- 📝 **交互式提交** - 可选的提交处理，提供用户友好的提示
- 🏷️ **语义化版本** - 支持 patch/minor/major 版本升级和"不变"选项
- 🔨 **自动构建** - 发布前自动运行构建脚本（如果存在）
- 📦 **安全发布** - 使用临时 .npmrc 文件进行安全发布
- 🔐 **统一配置** - 全局配置管理，支持加密的身份验证令牌存储
- 🏷️ **发布后标签** - 仅在发布成功后创建 git 提交和标签
- 🚀 **GitHub Actions 集成** - 发布命令支持自动化 CI/CD 工作流
- 📤 **可选远程推送** - 选择是否推送提交和标签到远程仓库
- ⚡ **现代工具链** - 使用 TypeScript + Node.js 构建，支持 ES 模块

## 安装

### 从 NPM 安装

```bash
# 全局安装
npm install -g qkdpx

# 或使用 npx
npx qkdpx publish
```

### 开发安装

```bash
# 克隆仓库
git clone <repository-url>
cd dpx

# 安装依赖
npm install

# 构建项目
npm run build

# 本地链接开发
npm link
```

## 使用方法

### 发布命令

```bash
# 发布当前项目
qkdpx publish

# 指定版本升级类型
qkdpx publish --version patch
qkdpx publish --version minor
qkdpx publish --version major

# 跳过确认提示
qkdpx publish --skip-confirm

# 模拟运行（不实际发布）
qkdpx publish --dry-run
```

### 发版命令（GitHub Actions 集成）

```bash
# 交互式发版工作流
qkdpx release

# 指定版本升级类型
qkdpx release --version patch
qkdpx release --version minor  
qkdpx release --version major

# 跳过确认提示
qkdpx release --skip-confirm

# 自定义提交消息
qkdpx release -m "feat: 添加新功能"
```

### 配置管理

```bash
# 初始化配置
qkdpx init

# 显示当前配置
qkdpx init --show
```

## 命令概览

| 命令 | 用途 | GitHub Actions |
|------|------|----------------|
| `qkdpx publish` | 仅发布到 npm | ❌ |
| `qkdpx release` | 提交 → 标签 → 推送 → 触发 CI/CD | ✅ |
| `qkdpx init` | 配置身份验证 | - |

## 工作流程

### 发布工作流（直接 NPM 发布）

发布工作流遵循安全的**先发布后提交**方式：

1. **变更检测** - 检查 git 状态和 package.json
2. **提交处理** - 可选择提交未提交的更改
3. **版本选择** - 交互式或指定的版本升级
4. **构建验证** - 如果可用，运行构建脚本
5. **NPM 发布** - 使用临时 .npmrc 安全发布
6. **发布后 Git 操作** - 提交版本更改并创建标签
7. **可选远程推送** - 选择是否推送到远程

### 发版工作流（GitHub Actions 集成）

专为触发自动化 CI/CD 流水线设计：

1. **变更检测** - 检查 git 状态和 package.json
2. **提交处理** - 处理未提交的更改
3. **版本升级** - 用户确认的可选版本升级
4. **Git 操作** - 提交版本更改并创建版本标签
5. **远程推送** - 推送提交和标签以触发 GitHub Actions
6. **CI/CD 触发** - GitHub Actions 自动处理构建和发布

## GitHub Actions 集成

### 设置 GitHub Actions

创建 `.github/workflows/release.yml`：

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

### CI/CD 使用方法

```bash
# 本地开发和测试
qkdpx publish --dry-run

# 发版以触发 GitHub Actions
qkdpx release --version patch
```

这将：
1. 在本地提交任何更改
2. 升级版本并提交
3. 创建并推送版本标签（`v1.0.1`）
4. GitHub Actions 自动构建并发布到 npm
5. 创建带有构建产物的 GitHub 发布

## 配置

### 全局配置 (`~/.qkdpx/config.json`)

```json
{
  "registry": "https://registry.npmjs.org/",
  "authToken": "<加密令牌>"
}
```

### 安全功能

- **加密身份验证令牌** - 使用 AES-256-CBC 加密存储令牌
- **文件权限** - 仅用户可访问
- **显示掩码** - 令牌显示为 `abc***xyz` 格式
- **临时身份验证** - 自动清理临时 .npmrc 文件

## 开发

### 开发命令

```bash
npm install          # 安装依赖
npm run dev          # 使用 tsx 的开发模式
npm run build        # 将 TypeScript 构建为 JavaScript
npm run lint         # ESLint 检查
npm run typecheck    # TypeScript 类型检查
npm run clean        # 清理构建产物
```

### 项目结构

```
src/
├── commands/
│   ├── init.ts           # 配置命令
│   ├── publish.ts        # NPM 发布工作流
│   └── release.ts        # GitHub Actions 发版工作流
├── modules/              # 业务逻辑
├── utils/                # 工具类
└── types/                # TypeScript 定义
```

## 高级示例

### 版本管理

```bash
# 保持当前版本（仅标签和推送）
qkdpx release --version none

# 交互式选择和自定义消息
qkdpx release -m "chore: 准备发版"

# CI 环境中的自动化发版
qkdpx release --version patch --skip-confirm
```

### 错误恢复

两种工作流都包含自动错误恢复：
- **发布失败**：恢复 package.json 更改
- **标签冲突**：交互式覆盖提示
- **Git 错误**：清理回滚到之前状态

## 故障排除

### 常见问题

1. **身份验证**：`qkdpx init` 重新配置
2. **构建失败**：确保 `npm run build` 工作正常
3. **标签冲突**：选择覆盖或手动删除标签
4. **Git 问题**：检查 `git config --list`

### 调试模式

```bash
DEBUG=qkdpx* qkdpx publish
```

## 贡献

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/name`)
3. 提交更改 (`git commit -m 'Add feature'`)
4. 推送分支 (`git push origin feature/name`)
5. 打开 Pull Request

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。