# Configuration Examples

## OpenCode Configuration

Add this to `~/.config/opencode/opencode.json`:

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

### For Local Development (before publishing to npm)

If you're testing locally before publishing, use the absolute path:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "harmonyos": {
      "type": "local",
      "command": ["node", "/Users/clz/projects/mcp-harmonyos/build/server.js"],
      "enabled": true
    }
  }
}
```

## Claude Desktop Configuration

### macOS

File: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "harmonyos": {
      "command": "npx",
      "args": ["-y", "mcp-harmonyos"]
    }
  }
}
```

### Windows

File: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "harmonyos": {
      "command": "npx",
      "args": ["-y", "mcp-harmonyos"]
    }
  }
}
```

## Verification

After configuration, verify the server is working:

### For OpenCode

```bash
opencode mcp list
```

You should see:
```
✓ harmonyos connected
```

### For Claude Desktop

Restart Claude Desktop and look for the 🔌 icon indicating MCP servers are connected.

## Troubleshooting

### Server not connecting

1. Check Node.js version (must be 18+):
```bash
node --version
```

2. Verify hdc is installed:
```bash
hdc version
```

3. Check server logs in OpenCode output panel or Claude Desktop logs

### "hdc command not found"

Add DevEco Studio tools to your PATH:

**macOS/Linux** (~/.bashrc or ~/.zshrc):
```bash
export PATH="$PATH:/Applications/DevEco-Studio.app/Contents/tools"
```

**Windows** (System Environment Variables):
```
C:\Program Files\DevEco Studio\tools
```
