# QKDPX - NPM 快速发布工具

一个现代化的 CLI 工具，用于 npm 包的自动化发布流程，支持 git 提交、版本管理和安全的配置管理。

## 特性

- 🔍 **智能检测** - 自动检测未提交的变更和当前版本状态
- 📝 **交互式提交** - 引导用户输入提交信息并自动提交
- 🏷️ **语义化版本** - 支持 patch/minor/major 版本升级
- 🔨 **自动构建** - 发布前自动运行构建脚本（如果存在 build 脚本）
- 📦 **安全发布** - 支持多种 npm registry 和加密的 auth token 存储
- 🔐 **统一配置** - 全局配置管理，避免配置冲突和认证问题
- 🔐 **安全认证** - auth token 采用 AES-256-CBC 加密存储
- ⚡ **现代化工具** - 基于 TypeScript + Node.js 构建，使用 ES 模块

## 安装

### 本地开发安装

```bash
# 克隆项目
git clone <repository-url>
cd dpx

# 安装依赖
npm install

# 构建项目
npm run build

# 本地链接（开发调试）
npm link
```

### 从 NPM 安装（计划中）

```bash
# 全局安装
npm install -g qkdpx

# 或在项目中使用
npx qkdpx publish
```

## 使用

### 基本用法

```bash
# 发布当前项目
qkdpx publish

# 指定版本类型
qkdpx publish --version patch
qkdpx publish --version minor
qkdpx publish --version major

# 跳过确认提示
qkdpx publish --skip-confirm

# 试运行（不实际发布）
qkdpx publish --dry-run
```

### 配置管理

```bash
# 初始化配置
qkdpx init

# 查看当前配置
qkdpx init --show
```

### 工作流程

1. **🔍 变更检测** - 检查 git 工作区状态和 package.json 信息
2. **📝 交互式提交** - 如有未提交文件，引导用户输入提交信息
3. **🏷️ 版本升级** - 交互式选择 patch/minor/major 并更新 package.json
4. **🔨 构建验证** - 自动运行 `npm run build`（如果存在）
5. **📦 发布执行** - 使用配置的 registry 和 auth token 发布到 npm

每个步骤都有清晰的进度显示和错误处理。

## 配置文件

### 全局配置 (`~/.qkdpx/config.json`)

qkdpx 使用单一的全局配置系统，所有配置都存储在用户主目录：

```json
{
  "registry": "https://registry.npmjs.org/",
  "authToken": "<encrypted-token>"
}
```

### 安全说明

- **Auth token 加密存储**: 使用 AES-256-CBC 加密算法保护认证信息
- **配置文件权限**: 全局配置文件只有当前用户可访问
- **显示时掩码**: Auth token 在显示时自动掩码为 `abc***xyz` 格式

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 代码检查
npm run lint
npm run typecheck

# 格式化代码
npm run format
```

## 技术架构

### 核心依赖

- **commander.js** - CLI 框架和命令解析
- **inquirer** - 交互式命令行界面
- **listr2** - 任务列表管理和进度显示
- **semver** - 语义化版本管理
- **fs-extra** - 增强的文件系统操作
- **chalk** - 终端颜色和样式
- **ora** - 优雅的终端 spinner

### 设计特点

- **原生 git 命令** - 使用 `child_process.spawn` 直接调用，无额外依赖
- **ES 模块** - 完全支持现代 JavaScript 模块系统
- **TypeScript** - 类型安全和更好的开发体验
- **模块化架构** - 清晰的职责分离和代码组织
- **加密存储** - 使用 Node.js 原生 crypto 模块加密敏感信息

### 项目结构

```
src/
├── commands/           # CLI 命令实现
│   ├── init.ts        # init 命令
│   └── publish.ts     # publish 命令
├── modules/           # 核心功能模块
│   ├── ChangeDetector.ts   # 变更检测
│   ├── CommitManager.ts    # Git 提交管理
│   ├── VersionManager.ts   # 版本管理
│   └── PublishManager.ts   # 发布管理
├── utils/             # 工具类
│   ├── ConfigManager.ts    # 配置管理
│   └── GitHelper.ts       # Git 操作封装
├── types/             # TypeScript 类型定义
└── index.ts           # 入口文件
```

## 未来规划

### v0.2.0
- [ ] 支持自定义构建命令配置
- [ ] 添加发布前测试运行选项
- [ ] 支持 monorepo 项目结构
- [ ] 添加发布历史记录

### v0.3.0
- [ ] 支持 changelog 自动生成
- [ ] 集成 conventional commits
- [ ] 支持发布到多个 registry
- [ ] 添加回滚功能

### v1.0.0
- [ ] 完整的插件系统
- [ ] Web UI 配置界面
- [ ] CI/CD 集成模板
- [ ] 完善的文档和示例

## 许可证

MIT