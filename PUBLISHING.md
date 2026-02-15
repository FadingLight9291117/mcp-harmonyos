# HarmonyOS MCP Server - 发布指南

完整的发布流程：从本地开发到 npm 和 MCP Registry。

## 📋 发布前检查清单

### ✅ 已完成
- ✅ 代码编写完成
- ✅ 本地测试通过
- ✅ 文档编写完整
- ✅ TypeScript 编译成功
- ✅ MIT 许可证已添加

### 🔄 需要完成
- [ ] 创建 GitHub 仓库
- [ ] 更新 package.json 信息
- [ ] 发布到 npm
- [ ] 发布到 MCP Registry

---

## 第一步：创建 GitHub 仓库

### 1.1 在 GitHub 上创建新仓库

访问 https://github.com/new 创建新仓库：

- **Repository name**: `mcp-harmonyos`
- **Description**: `Model Context Protocol server for HarmonyOS development`
- **Visibility**: Public
- **不要** 勾选 "Initialize this repository with:"（我们已有代码）

### 1.2 初始化本地 Git 仓库

```bash
cd /Users/clz/projects/mcp-harmonyos

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 创建第一次提交
git commit -m "Initial commit: HarmonyOS MCP Server

- Implement 7 MCP tools for HarmonyOS development
- Device management (list_devices, get_device_info)
- Project information (get_project_info, list_modules, check_build_outputs)
- Application management (list_installed_apps, get_app_info)
- Complete documentation (README, QUICKSTART, CONFIGURATION)
- Tested with real HarmonyOS project (HarmonyOS-APM)"

# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/mcp-harmonyos.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 1.3 更新 package.json 的仓库地址

在推送后，更新 `package.json` 中的 repository URL（下一步会做）。

---

## 第二步：更新 package.json

需要更新以下字段：

```json
{
  "name": "mcp-harmonyos",
  "version": "1.0.0",
  "description": "Model Context Protocol server for HarmonyOS development - enables AI assistants to interact with HarmonyOS projects, devices, and applications",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/mcp-harmonyos.git"
  },
  "homepage": "https://github.com/YOUR_USERNAME/mcp-harmonyos#readme",
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/mcp-harmonyos/issues"
  },
  "author": "Your Name <your.email@example.com>",
  "keywords": [
    "mcp",
    "model-context-protocol",
    "harmonyos",
    "openharmony",
    "arkts",
    "hdc",
    "hvigor",
    "deveco-studio",
    "ai",
    "claude",
    "opencode"
  ],
  "license": "MIT"
}
```

---

## 第三步：发布到 npm

### 3.1 检查 npm 账号

```bash
# 检查是否已登录
npm whoami

# 如果未登录，运行
npm login
# 输入你的 npm 用户名、密码和邮箱
```

如果没有 npm 账号，先注册：https://www.npmjs.com/signup

### 3.2 检查包名是否可用

```bash
npm view mcp-harmonyos

# 如果返回 404，说明名称可用
# 如果返回包信息，说明名称已被占用，需要改名
```

### 3.3 最终检查

```bash
cd /Users/clz/projects/mcp-harmonyos

# 确保构建是最新的
npm run build

# 检查将要发布的文件
npm pack --dry-run

# 应该看到：
# - package.json
# - README.md
# - build/ (包含编译后的代码)
# - LICENSE
```

### 3.4 发布到 npm

```bash
# 首次发布
npm publish

# 如果需要发布为公开包（如果遇到权限问题）
npm publish --access public
```

### 3.5 验证发布

```bash
# 查看你的包
npm view mcp-harmonyos

# 测试安装
npx mcp-harmonyos
```

---

## 第四步：发布到 MCP Registry

MCP Registry 让用户更容易发现你的服务器。

### 4.1 安装 MCP Publisher

```bash
npm install -g @modelcontextprotocol/registry
```

### 4.2 准备 smithery.yaml

创建 `smithery.yaml`（如果还没有）：

```yaml
# smithery.yaml
name: mcp-harmonyos
version: 1.0.0
description: Model Context Protocol server for HarmonyOS development
author: Your Name
homepage: https://github.com/YOUR_USERNAME/mcp-harmonyos
license: MIT

categories:
  - Development Tools
  - Build & Deploy

platforms:
  - macos
  - linux
  - windows

runtime:
  type: node
  version: ">=18.0.0"

config:
  schema:
    type: object
    properties: {}
    required: []

tools:
  - name: harmonyos_list_devices
    description: List all connected HarmonyOS devices
  - name: harmonyos_get_device_info
    description: Get detailed information about a specific device
  - name: harmonyos_get_project_info
    description: Get HarmonyOS project information
  - name: harmonyos_list_modules
    description: List all modules in a project
  - name: harmonyos_check_build_outputs
    description: Check if build outputs exist
  - name: harmonyos_list_installed_apps
    description: List installed applications on a device
  - name: harmonyos_get_app_info
    description: Get detailed application information
```

### 4.3 发布到 MCP Registry

有三种发布方式：

#### 方式 1: GitHub 认证（推荐）

```bash
# 使用 GitHub OAuth 认证
npx @modelcontextprotocol/registry publish

# 按照提示：
# 1. 选择 "GitHub OAuth"
# 2. 在浏览器中授权
# 3. 确认发布信息
```

命名格式会是：`io.github.YOUR_USERNAME/mcp-harmonyos`

#### 方式 2: DNS 验证（自定义域名）

如果你有自己的域名，可以使用：

```bash
npx @modelcontextprotocol/registry publish --domain yourdomain.com

# 按照提示添加 DNS TXT 记录
# 记录格式：mcp-verify=<verification-code>
```

命名格式：`com.yourdomain/mcp-harmonyos`

#### 方式 3: HTTP 验证（自定义域名）

```bash
npx @modelcontextprotocol/registry publish --domain yourdomain.com --method http

# 在你的网站根目录创建文件：
# /.well-known/mcp-verify.txt
# 内容：<verification-code>
```

### 4.4 验证 Registry 发布

访问 MCP Registry 网站查看你的服务器：
https://registry.modelcontextprotocol.io/

搜索 "mcp-harmonyos" 或 "harmonyos"

---

## 第五步：更新 OpenCode 配置使用 npm 包

发布成功后，更新本地配置使用 npm 包而不是本地路径。

编辑 `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "harmonyos": {
      "type": "local",
      "command": ["npx", "-y", "mcp-harmonyos"],
      "enabled": true
    }
  }
}
```

重启 OpenCode 测试。

---

## 发布后的更新流程

### 更新版本

当你修改代码后：

```bash
# 1. 修改代码
# 2. 更新版本号
npm version patch   # 1.0.0 -> 1.0.1 (bug 修复)
npm version minor   # 1.0.0 -> 1.1.0 (新功能)
npm version major   # 1.0.0 -> 2.0.0 (破坏性更新)

# 3. 重新构建
npm run build

# 4. 提交到 Git
git add .
git commit -m "Release v1.0.1: Fix bug xyz"
git push

# 5. 重新发布到 npm
npm publish

# 6. 更新 MCP Registry
npx @modelcontextprotocol/registry publish
```

---

## 📊 发布检查清单

### npm 发布
- [ ] npm 账号已登录
- [ ] package.json 信息完整
- [ ] repository URL 正确
- [ ] 构建成功无错误
- [ ] `npm publish` 成功
- [ ] `npm view mcp-harmonyos` 可查看
- [ ] `npx mcp-harmonyos` 可运行

### MCP Registry 发布
- [ ] smithery.yaml 已创建
- [ ] 工具列表完整
- [ ] 发布认证成功
- [ ] Registry 网站可搜索到

### GitHub
- [ ] 代码已推送
- [ ] README 显示正常
- [ ] LICENSE 文件存在
- [ ] 标签/Release 已创建

---

## 🎉 发布成功后

### 分享你的项目

1. **创建 GitHub Release**
   - 访问 https://github.com/YOUR_USERNAME/mcp-harmonyos/releases/new
   - Tag: v1.0.0
   - Title: v1.0.0 - Initial Release
   - 描述功能和使用方法

2. **社交媒体分享**
   - Twitter/X
   - Reddit (r/harmonyos, r/programming)
   - Hacker News
   - 开发者社区

3. **添加徽章到 README**
   ```markdown
   [![NPM Version](https://img.shields.io/npm/v/mcp-harmonyos)](https://www.npmjs.com/package/mcp-harmonyos)
   [![Downloads](https://img.shields.io/npm/dm/mcp-harmonyos)](https://www.npmjs.com/package/mcp-harmonyos)
   [![GitHub Stars](https://img.shields.io/github/stars/YOUR_USERNAME/mcp-harmonyos)](https://github.com/YOUR_USERNAME/mcp-harmonyos)
   [![License](https://img.shields.io/npm/l/mcp-harmonyos)](https://github.com/YOUR_USERNAME/mcp-harmonyos/blob/main/LICENSE)
   ```

### 监控和维护

- 监控 GitHub Issues
- 回复用户问题
- 定期更新依赖
- 添加新功能

---

## 常见问题

### Q: npm 包名被占用怎么办？

A: 修改包名：
- `mcp-harmonyos-dev`
- `@yourname/mcp-harmonyos`（需要 npm 组织）
- `harmonyos-mcp-server`

### Q: 发布失败，提示权限错误？

A: 确保：
1. 已登录 npm：`npm whoami`
2. 使用 `--access public` 参数
3. 包名没有冲突

### Q: MCP Registry 发布后搜索不到？

A: 等待几分钟让索引更新，然后刷新页面。

### Q: 如何撤销已发布的版本？

A: npm 不允许删除已发布的版本，但可以弃用：
```bash
npm deprecate mcp-harmonyos@1.0.0 "版本有问题，请使用 1.0.1"
```

---

## 需要帮助吗？

如果在发布过程中遇到问题，请检查：
- npm 文档: https://docs.npmjs.com/
- MCP Registry 文档: https://github.com/modelcontextprotocol/registry
- GitHub 帮助: https://docs.github.com/
