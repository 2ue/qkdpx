# QKDPX - NPM 快速发布工具

一个现代化的 CLI 工具，用于 npm 包的自动化发布流程，支持 git 提交、版本管理和发布配置。

## 特性

- 🔍 **智能检测** - 自动检测未提交的变更和当前版本状态
- 📝 **交互式提交** - 引导用户输入提交信息并自动提交
- 🏷️ **语义化版本** - 支持 patch/minor/major 版本升级
- 🔨 **自动构建** - 发布前自动运行构建脚本
- 📦 **安全发布** - 支持多种 npm registry 和认证方式
- ⚡ **现代化工具** - 基于 TypeScript + Node.js 构建

## 安装

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

### 工作流程

1. **变更检测** - 检查 git 工作区状态
2. **交互式提交** - 处理未提交的文件
3. **版本升级** - 选择并更新版本号
4. **构建验证** - 运行构建脚本（如果存在）
5. **版本提交** - 自动提交版本变更并打标签
6. **发布配置** - 配置 npm registry 和认证
7. **执行发布** - 发布到 npm

## 配置

创建 `.qkdpxrc` 文件自定义默认行为：

```json
{
  "defaultVersionBump": "patch",
  "autoCommit": true,
  "skipTests": false,
  "skipBuild": false,
  "registry": "https://registry.npmjs.org/",
  "generateChangelog": false
}
```

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

- **commander.js** - CLI 框架
- **inquirer** - 交互式命令行界面
- **listr2** - 任务列表管理
- **原生 git 命令** - 使用 child_process.spawn 直接调用
- **semver** - 语义化版本管理
- **现代 ES 模块** - 支持最新 JavaScript 特性

## 许可证

MIT