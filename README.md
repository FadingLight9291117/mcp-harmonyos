# MCP HarmonyOS

[![NPM Version](https://img.shields.io/npm/v/mcp-harmonyos)](https://www.npmjs.com/package/mcp-harmonyos)
[![GitHub Stars](https://img.shields.io/github/stars/FadingLight9291117/mcp-harmonyos)](https://github.com/FadingLight9291117/mcp-harmonyos)
[![License](https://img.shields.io/npm/l/mcp-harmonyos)](https://github.com/FadingLight9291117/mcp-harmonyos/blob/main/LICENSE)

A Model Context Protocol (MCP) server for HarmonyOS development. This server enables AI assistants like Claude to interact with HarmonyOS projects, devices, and applications.

## Features

- **Device Management**: List and query connected HarmonyOS devices
- **Project Information**: Read project configuration, modules, and build outputs
- **Application Management**: List and inspect installed applications on devices
- **Build Verification**: Check build outputs and project structure

## Prerequisites

- Node.js 18+ 
- HarmonyOS DevEco Studio (for hdc command-line tools)
- `hdc` must be available in your PATH

## Installation

### Global Installation (Recommended)

```bash
npm install -g mcp-harmonyos
```

### Or use with npx

```bash
npx mcp-harmonyos
```

## Configuration

### For OpenCode

Add to your `~/.config/opencode/opencode.json`:

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

### For Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "harmonyos": {
      "command": "mcp-harmonyos"
    }
  }
}
```

## Available Tools

### Device Management

#### `harmonyos_list_devices`
List all connected HarmonyOS devices.

**Returns**: Array of devices with UDID and status

```json
[
  {
    "udid": "7001005458323933328a01bcf4251a00",
    "status": "connected"
  }
]
```

#### `harmonyos_get_device_info`
Get detailed information about a specific device.

**Parameters**:
- `deviceId` (string): The device UDID

**Returns**: Device information including model, manufacturer, OS version, etc.

```json
{
  "udid": "7001005458323933328a01bcf4251a00",
  "model": "HUAWEI Mate 60 Pro",
  "brand": "HUAWEI",
  "manufacturer": "HUAWEI",
  "osVersion": "4.0.0",
  "sdkVersion": "11",
  "buildId": "Mate60Pro 4.0.0.96"
}
```

### Project Information

#### `harmonyos_get_project_info`
Get HarmonyOS project information from app.json5.

**Parameters**:
- `projectPath` (string): Absolute path to the HarmonyOS project root

**Returns**: Project metadata including bundleName, version, and modules

```json
{
  "bundleName": "com.example.myapp",
  "versionCode": 1000000,
  "versionName": "1.0.0",
  "minCompatibleVersionCode": 1000000,
  "targetAPIVersion": 11,
  "modules": ["entry", "library"]
}
```

#### `harmonyos_list_modules`
List all modules in a project with their types (HAP/HSP/HAR).

**Parameters**:
- `projectPath` (string): Absolute path to the HarmonyOS project root

**Returns**: Array of modules with name, type, and path

```json
[
  {
    "name": "entry",
    "type": "HAP",
    "path": "/path/to/project/entry",
    "srcPath": "entry"
  },
  {
    "name": "library",
    "type": "HSP",
    "path": "/path/to/project/library",
    "srcPath": "library"
  }
]
```

#### `harmonyos_check_build_outputs`
Check if build outputs exist and list them.

**Parameters**:
- `projectPath` (string): Absolute path to the HarmonyOS project root

**Returns**: Build output information

```json
{
  "hasOutputs": true,
  "outputDir": "/path/to/project/outputs",
  "files": ["entry-default-signed.hap", "library-default-signed.hsp"],
  "haps": ["entry-default-signed.hap"],
  "hsps": ["library-default-signed.hsp"]
}
```

### Application Management

#### `harmonyos_list_installed_apps`
List all installed applications on a device.

**Parameters**:
- `deviceId` (string): The device UDID

**Returns**: Array of installed applications

```json
[
  {
    "bundleName": "com.example.myapp",
    "versionCode": "1000000",
    "versionName": "1.0.0"
  }
]
```

#### `harmonyos_get_app_info`
Get detailed information about an installed application.

**Parameters**:
- `deviceId` (string): The device UDID
- `bundleName` (string): The application bundle name

**Returns**: Detailed application information

```json
{
  "bundleName": "com.example.myapp",
  "versionCode": "1000000",
  "versionName": "1.0.0",
  "uid": "20010044",
  "installTime": "2026-02-15 10:30:00",
  "updateTime": "2026-02-15 10:30:00",
  "isSystemApp": false,
  "isRemovable": true
}
```

## Usage Examples

### With OpenCode

After configuring the MCP server, you can ask OpenCode questions like:

```
"List all connected HarmonyOS devices"
"What's the bundleName of the project in /path/to/my/project?"
"Check if there are build outputs in my project"
"List all installed apps on device 7001005458323933328a01bcf4251a00"
"Show me information about com.example.myapp on my device"
```

OpenCode will use the MCP tools to query information and can combine them with bash commands for building and deploying:

```
"Build the project and deploy to device"
# OpenCode will:
# 1. Use harmonyos_get_project_info to get bundleName
# 2. Use bash: hvigorw assembleApp --no-daemon
# 3. Use harmonyos_check_build_outputs to verify
# 4. Use bash: hdc file send and bm install to deploy
# 5. Use bash: aa start to launch the app
```

## Design Philosophy

This MCP server follows the "lightweight query + external operations" pattern:

- **MCP tools** provide fast, structured queries (device info, project metadata, app status)
- **Bash commands** handle long-running operations (building, deploying)
- **AI assistants** intelligently combine both for complete workflows

This design ensures:
- ✅ Fast response times (all queries < 1 second)
- ✅ No timeout issues with long builds
- ✅ Clear error messages and logs
- ✅ Easy to maintain and extend

## Development

### Build from Source

```bash
git clone <your-repo>
cd mcp-harmonyos
npm install
npm run build
npm start
```

### Project Structure

```
mcp-harmonyos/
├── src/
│   ├── server.ts              # Main MCP server implementation
│   └── types/
│       └── harmonyos-types.ts # TypeScript type definitions
├── build/                      # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### "hdc command not found"

Make sure DevEco Studio is installed and `hdc` is in your PATH:

```bash
# macOS/Linux
export PATH="$PATH:/path/to/deveco-studio/tools"

# Windows
set PATH=%PATH%;C:\path\to\deveco-studio\tools
```

### "No devices connected"

1. Enable Developer Options on your device (tap Build Number 7 times)
2. Enable USB Debugging
3. Connect device via USB
4. Run `hdc list targets` to verify connection

### "app.json5 not found"

Make sure you provide the absolute path to the project root directory (where `AppScope/app.json5` is located).

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related Resources

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [HarmonyOS Documentation](https://developer.harmonyos.com/)
- [OpenCode](https://opencode.ai/)
