# Quick Start Guide

## 🚀 5-Minute Setup

### 1. Configure OpenCode

Add to `~/.config/opencode/opencode.json`:

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

### 2. Restart OpenCode

After saving the configuration, restart OpenCode.

### 3. Verify Connection

```bash
opencode mcp list
```

Expected output:
```
✓ harmonyos connected
```

### 4. Try It Out!

Ask OpenCode:
- "List all connected HarmonyOS devices"
- "What devices do I have connected?"

## 📦 Publishing to npm (Optional)

When you're ready to share with others:

### 1. Update package.json

Change the repository URL in `package.json`:
```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_USERNAME/mcp-harmonyos"
}
```

### 2. Create Git Repository

```bash
cd /Users/clz/projects/mcp-harmonyos
git init
git add .
git commit -m "Initial commit: HarmonyOS MCP Server"
git remote add origin https://github.com/YOUR_USERNAME/mcp-harmonyos.git
git push -u origin main
```

### 3. Publish to npm

```bash
npm login
npm publish
```

### 4. Update OpenCode Config

After publishing, update `~/.config/opencode/opencode.json` to use npm:

```json
{
  "mcp": {
    "harmonyos": {
      "type": "local",
      "command": ["npx", "-y", "mcp-harmonyos"],
      "enabled": true
    }
  }
}
```

## 🧪 Testing Without Publishing

You can test locally before publishing:

1. Build: `npm run build`
2. Configure OpenCode with local path (see step 1 above)
3. Test all 7 tools with a real HarmonyOS device

## 📚 Available Tools

1. **harmonyos_list_devices** - List connected devices
2. **harmonyos_get_device_info** - Get device details
3. **harmonyos_get_project_info** - Read project configuration
4. **harmonyos_list_modules** - List project modules
5. **harmonyos_check_build_outputs** - Check build results
6. **harmonyos_list_installed_apps** - List device apps
7. **harmonyos_get_app_info** - Get app details

## 💡 Usage Examples

### Example 1: Check Project Before Build

```
You: "Check my HarmonyOS project at /path/to/project"
OpenCode: Uses harmonyos_get_project_info and harmonyos_list_modules
         Shows bundleName, version, modules (HAP/HSP/HAR)
```

### Example 2: Full Build & Deploy Workflow

```
You: "Build and deploy my project to device"
OpenCode: 
1. harmonyos_get_project_info - Get bundleName
2. bash: hvigorw assembleApp - Build project
3. harmonyos_check_build_outputs - Verify build
4. harmonyos_list_devices - Get device UDID
5. bash: hdc file send + bm install - Deploy
6. bash: aa start - Launch app
```

### Example 3: Inspect Installed App

```
You: "Show me info about com.example.myapp on my device"
OpenCode:
1. harmonyos_list_devices - Get device UDID
2. harmonyos_get_app_info - Get app details
   Shows version, install time, system app status
```

## 🐛 Troubleshooting

### "hdc command not found"

```bash
export PATH="$PATH:/Applications/DevEco-Studio.app/Contents/tools"
```

### "No devices connected"

1. Enable Developer Options (tap Build Number 7x)
2. Enable USB Debugging
3. Connect via USB
4. Run `hdc list targets`

### MCP Server Not Connecting

1. Check build output exists: `ls build/server.js`
2. Check Node.js version: `node --version` (need 18+)
3. Manually test: `node build/server.js` (should not error)
4. Check OpenCode logs

## 📖 Full Documentation

- **README.md** - Complete API reference and features
- **CONFIGURATION.md** - Detailed configuration for OpenCode and Claude Desktop
- **LICENSE** - MIT License

## 🎯 Next Steps

1. ✅ Test with your HarmonyOS devices
2. ✅ Try all 7 tools with real projects
3. ✅ Integrate into your development workflow
4. 📤 (Optional) Publish to npm and MCP Registry
5. 🌟 (Optional) Star the repo and share!
