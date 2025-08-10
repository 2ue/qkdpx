# QKDPX - NPM 快速发布工具

一个现代化的 CLI 工具，用于 npm 包的自动化发布流程，支持 git 管理、版本控制和安全的配置管理。

[English](README.md) | 简体中文

## 特性

- 🔍 **智能检测** - 自动检测未提交的变更和当前版本状态
- 📝 **交互式提交** - 可选择的提交处理和用户友好的提示
- 🏷️ **语义化版本** - 支持 patch/minor/major 版本升级，包含"无变更"选项
- 🔨 **自动构建** - 发布前自动运行构建脚本（如果存在）
- 📦 **安全发布** - 使用临时 .npmrc 文件管理的安全发布
- 🔐 **统一配置** - 全局配置管理，支持加密的 auth token 存储
- 🏷️ **发布后标记** - 只在发布成功后创建 git 提交和标签
- 📤 **可选远程推送** - 选择是否将提交和标签推送到远程仓库
- ⚡ **现代化工具链** - 基于 TypeScript + Node.js 构建，使用 ES 模块

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

### 基本用法

```bash
# 发布当前项目
qkdpx publish

# 指定版本升级类型
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

# 显示当前配置
qkdpx init --show
```

## 工作流程

发布工作流程遵循安全的**先发布再提交**方法：

### 1. 🔍 **变更检测**
- 检查 git 工作目录状态
- 读取当前 package.json 信息
- 检测未提交的变更

### 2. 📝 **提交处理**（可选）
- 如果存在未提交变更，提示用户提交或跳过
- **跳过选项**：不提交变更继续发布
- **提交选项**：交互式提交消息输入和自动提交

### 3. 🏷️ **版本准备**
- 交互式版本升级选择（patch/minor/major/none）
- **无变更选项**：保持当前版本不变
- 更新 package.json **但不**立即提交

### 4. ✅ **最终确认**
- 显示包名和目标版本
- 发布前的最后取消机会

### 5. 🔨 **构建验证**
- 如果存在构建脚本则自动运行 `npm run build`
- 确保代码在发布前成功构建

### 6. 📦 **包发布**
- 创建临时 `.npmrc` 文件，包含注册表和认证令牌
- 使用 `--access public` 标志发布到 npm
- 自动清理临时 `.npmrc` 文件
- **安全认证**：如果存在，保留现有 `.npmrc` 内容

### 7. 🏷️ **发布后 Git 操作**（仅在发布成功后）
- **版本提交**：使用约定式消息提交 package.json 变更
- **Git 标记**：创建版本标签（例如，`v1.0.0`）
- **标签冲突处理**：检测现有标签并提示覆盖
- **跳过逻辑**：如果版本未变更则不提交/标记

### 8. 📤 **远程推送**（可选）
- 提示是否将提交和标签推送到远程仓库
- **默认**：否（更安全的选项）
- 如果确认则推送提交和标签

## 错误处理和恢复

### 发布失败恢复
- **自动回滚**：发布失败时恢复 package.json 变更
- **无 Git 污染**：失败时不创建提交或标签
- **清洁状态**：工作目录返回到发布前状态

### 标签冲突解决
- **检测**：检查版本标签是否已存在
- **交互式解决**：提示用户覆盖现有标签
- **安全删除**：在创建新标签前删除旧标签

### 配置安全
- **临时 .npmrc**：使用不影响全局设置的临时认证
- **备份和恢复**：如果存在，保留现有 .npmrc 内容
- **清理保证**：即使出错也始终删除临时文件

## 配置

### 全局配置 (`~/.qkdpx/config.json`)

QKDPX 使用存储在用户主目录的单一全局配置系统：

```json
{
  "registry": "https://registry.npmjs.org/",
  "authToken": "<encrypted-token>"
}
```

### 安全特性

- **加密认证令牌**：使用 AES-256-CBC 加密存储令牌
- **文件权限**：全局配置文件仅用户可访问
- **显示遮罩**：认证令牌自动遮罩为 `abc***xyz` 格式
- **临时认证**：使用自动清理的临时 .npmrc 文件

## 开发

### 开发命令

```bash
# 安装依赖
npm install

# 使用 tsx 的开发模式
npm run dev

# 构建 TypeScript 到 JavaScript
npm run build

# 开发的监视模式
npm run build:watch

# 代码质量检查
npm run lint              # ESLint 检查
npm run lint:fix          # 自动修复 ESLint 问题
npm run format            # Prettier 格式化
npm run typecheck         # TypeScript 类型检查

# 清理构建产物
npm run clean
```

### 测试

```bash
# 运行构建的 CLI
npm start

# 使用开发版本测试
npm run dev -- publish --dry-run
```

## 架构

### 核心依赖

- **commander.js** - CLI 框架和命令解析
- **inquirer** - 交互式命令行界面
- **listr2** - 带进度指示器的任务列表运行器
- **semver** - 语义化版本工具
- **fs-extra** - 增强的文件系统操作
- **chalk** - 终端样式和颜色
- **ora** - 优雅的终端转圈器

### 设计原则

- **原生 Git 命令** - 使用 `child_process.spawn` 进行 git 操作，无外部依赖
- **ES 模块** - 完全支持现代 JavaScript 模块系统
- **TypeScript** - 类型安全和增强的开发体验
- **模块化架构** - 清晰的关注点分离和代码组织
- **加密存储** - 使用 Node.js 原生 crypto 模块处理敏感信息
- **发布优先哲学** - 只在 npm 发布成功后创建 git 提交/标签

### 项目结构

```
src/
├── commands/              # CLI 命令实现
│   ├── init.ts           # 配置初始化命令
│   └── publish.ts        # 主发布命令与工作流编排
├── modules/              # 核心业务逻辑模块
│   ├── ChangeDetector.ts # Git 状态和 package.json 检测
│   ├── CommitManager.ts  # Git 提交和标签管理（发布后）
│   ├── VersionManager.ts # 版本选择和 package.json 更新
│   └── PublishManager.ts # NPM 发布与临时 .npmrc 处理
├── utils/                # 工具类
│   ├── ConfigManager.ts  # 全局配置管理与加密
│   └── GitHelper.ts      # Git 命令包装工具
├── types/                # TypeScript 类型定义
│   └── index.ts          # 共享接口和类型
└── index.ts              # CLI 入口点与 commander 设置
```

## 高级用法

### 版本选择选项

```bash
# 交互式版本选择（默认）
qkdpx publish

# 保持当前版本不变
qkdpx publish --version none

# 特定版本升级
qkdpx publish --version patch    # 1.0.0 → 1.0.1
qkdpx publish --version minor    # 1.0.0 → 1.1.0
qkdpx publish --version major    # 1.0.0 → 2.0.0
```

### 提交处理选项

当检测到未提交变更时：
- **提交**：输入提交消息并在发布前提交
- **跳过**：不提交变更继续发布
- **取消**：中止发布流程

### 配置管理

```bash
# 交互式配置设置
qkdpx init

# 查看当前配置（令牌已遮罩）
qkdpx init --show

# 重新配置现有设置
qkdpx init  # 将显示当前值并允许更新
```

## 故障排除

### 常见问题

1. **认证错误**
   ```bash
   # 重新配置认证
   qkdpx init
   ```

2. **构建失败**
   ```bash
   # 确保构建脚本存在且工作
   npm run build
   ```

3. **Git 权限问题**
   ```bash
   # 检查 git 配置
   git config --list
   ```

4. **标签冲突**
   - 提示时选择"覆盖"
   - 或手动删除冲突标签：`git tag -d v1.0.0`

### 调试信息

通过设置环境变量启用详细日志：
```bash
DEBUG=qkdpx* qkdpx publish
```

## 路线图

### v0.2.0
- [ ] 支持自定义构建命令配置
- [ ] 发布前测试执行选项
- [ ] Monorepo 项目结构支持
- [ ] 发布历史跟踪

### v0.3.0
- [ ] 自动 changelog 生成
- [ ] 约定式提交集成
- [ ] 多注册表发布支持
- [ ] 回滚功能

### v1.0.0
- [ ] 完整插件系统
- [ ] 配置的 Web UI
- [ ] CI/CD 集成模板
- [ ] 全面的文档和示例

## 贡献

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交变更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。