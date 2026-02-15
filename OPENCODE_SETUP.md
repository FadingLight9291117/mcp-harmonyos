# HarmonyOS MCP Server - OpenCode 配置成功！

## ✅ 配置完成

HarmonyOS MCP 服务器已成功添加到 OpenCode 配置文件：
`~/.config/opencode/opencode.json`

```json
{
  "mcp": {
    "harmonyos": {
      "type": "local",
      "command": ["node", "/Users/clz/projects/mcp-harmonyos/build/server.js"],
      "enabled": true
    }
  }
}
```

## 🔄 下一步：重启 OpenCode

**重要**: 配置修改后需要重启 OpenCode 才能生效。

1. 退出 OpenCode
2. 重新启动 OpenCode
3. 验证连接（见下方）

## ✅ 验证连接

重启后，运行以下命令验证 MCP 服务器已连接：

```bash
opencode mcp list
```

**预期输出**:
```
✓ zotero connected
✓ harmonyos connected
```

## 🎯 测试 HarmonyOS MCP 功能

重启 OpenCode 后，你可以直接问以下问题来测试 MCP 工具：

### 基础测试

1. **查询项目信息**
   ```
   "What's the bundleName of the HarmonyOS-APM project?"
   "Show me the project info for /Users/clz/projects/HarmonyOS-APM"
   ```
   
   预期: OpenCode 会使用 `harmonyos_get_project_info` 工具返回：
   - bundleName: com.example.apm_demo_thrid_phase
   - versionCode: 1000000
   - versionName: 1.0.0
   - modules: [entry, apm, native_error_demo]

2. **列出项目模块**
   ```
   "List all modules in the HarmonyOS-APM project"
   "What modules does HarmonyOS-APM have?"
   ```
   
   预期: 返回 3 个模块
   - entry (HAP)
   - apm (HSP)
   - native_error_demo (HSP)

3. **检查构建输出**
   ```
   "Check if there are build outputs in HarmonyOS-APM"
   "Does the HarmonyOS-APM project have any compiled HAP files?"
   ```
   
   预期: 返回 hasOutputs: false（项目未构建）

### 设备相关测试

4. **列出设备** (需要连接 HarmonyOS 设备)
   ```
   "List all connected HarmonyOS devices"
   "What devices do I have connected?"
   ```
   
   注意: 如果 hdc 未安装或没有设备连接，会返回友好的错误提示

5. **获取设备信息** (需要设备)
   ```
   "Show me information about device 7001005458323933328a01bcf4251a00"
   ```

### 高级工作流测试

6. **完整的构建和部署流程**
   ```
   "Build the HarmonyOS-APM project and deploy to my device"
   ```
   
   OpenCode 会智能组合使用：
   - MCP: harmonyos_get_project_info (获取 bundleName)
   - Bash: hvigorw assembleApp (构建)
   - MCP: harmonyos_check_build_outputs (验证)
   - MCP: harmonyos_list_devices (获取设备 UDID)
   - Bash: hdc + bm install (部署)
   - Bash: aa start (启动应用)

## 🛠️ 可用的 7 个 MCP 工具

OpenCode 现在可以使用这些 HarmonyOS 工具：

1. **harmonyos_list_devices** - 列出连接的设备
2. **harmonyos_get_device_info** - 获取设备详情
3. **harmonyos_get_project_info** - 读取项目配置
4. **harmonyos_list_modules** - 列出项目模块
5. **harmonyos_check_build_outputs** - 检查构建产物
6. **harmonyos_list_installed_apps** - 列出设备上的应用
7. **harmonyos_get_app_info** - 获取应用详情

## 💡 使用建议

### 最佳实践

1. **查询前先用 MCP 获取信息**
   - 不确定 bundleName？先问 OpenCode
   - 不确定有哪些模块？先问 OpenCode
   - 不确定设备 UDID？先问 OpenCode

2. **让 AI 组合使用工具**
   - OpenCode 会智能地将 MCP 查询和 bash 命令组合
   - 不需要手动记住复杂的命令
   - AI 会处理错误和重试

3. **自然语言提问**
   - 不需要记住工具名称
   - 用自然语言描述你想做什么
   - OpenCode 会选择合适的工具

### 示例对话

```
You: "我想部署 HarmonyOS-APM 到设备"

OpenCode: 
1. 使用 harmonyos_get_project_info 获取项目信息
   → bundleName: com.example.apm_demo_thrid_phase
2. 使用 harmonyos_check_build_outputs 检查是否有构建产物
   → hasOutputs: false，需要先构建
3. 运行 bash: hvigorw assembleApp --mode project --no-daemon
   → 构建中...
4. 构建完成后使用 harmonyos_list_devices 获取设备
   → 找到设备: 7001005...
5. 运行 bash: hdc file send + bm install
   → 部署中...
6. 完成！应用已安装并启动
```

## 🐛 故障排除

### MCP 服务器未连接

1. **检查服务器文件**
   ```bash
   ls -l /Users/clz/projects/mcp-harmonyos/build/server.js
   ```

2. **手动测试服务器**
   ```bash
   node /Users/clz/projects/mcp-harmonyos/build/server.js
   ```
   应该输出: "HarmonyOS MCP Server running on stdio"

3. **检查 Node.js 版本**
   ```bash
   node --version
   ```
   需要 Node.js 18+

### hdc 命令未找到

```bash
# macOS/Linux
export PATH="$PATH:/Applications/DevEco-Studio.app/Contents/tools"

# Windows
set PATH=%PATH%;C:\Program Files\DevEco Studio\tools
```

### OpenCode 日志

查看 OpenCode 输出面板获取详细的错误信息。

## 📚 更多文档

- **完整 API 文档**: `/Users/clz/projects/mcp-harmonyos/README.md`
- **配置指南**: `/Users/clz/projects/mcp-harmonyos/CONFIGURATION.md`
- **快速开始**: `/Users/clz/projects/mcp-harmonyos/QUICKSTART.md`

## 🎉 开始使用

现在就重启 OpenCode 并开始使用 HarmonyOS MCP 服务器吧！

试试问 OpenCode:
- "What's the bundleName of HarmonyOS-APM?"
- "List all modules in my HarmonyOS project"
- "Check build outputs for HarmonyOS-APM"

祝开发顺利！🚀
