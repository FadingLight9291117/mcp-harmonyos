# AGENTS.md

Guide for AI coding agents working in the mcp-harmonyos repository.

## Project Overview

MCP (Model Context Protocol) server for HarmonyOS development. Enables AI assistants
to interact with HarmonyOS projects, devices, and applications via the `hdc` CLI tool.

- **Runtime**: Node.js (ESM, `"type": "module"`)
- **Language**: TypeScript (strict mode, `noImplicitAny: false`)
- **Dependencies**: `@modelcontextprotocol/sdk`, `zod`, `dotenv`

## Build / Run Commands

```bash
npm install           # Install dependencies
npm run build         # Compile src/ to build/ via tsc (adds shebang)
npm start             # Start the built server (stdio transport)
npm run dev           # Build + run in one step
```

## Testing

No test framework. Manual test script only:

```bash
npm run build && node test/test-tools.mjs
```

The test script spawns the server as a child process, sends JSON-RPC requests over
stdin, and parses responses from stdout. It tests against a hardcoded local project
path -- update the path in `test/test-tools.mjs` before running.

## Linting / Formatting

No linter or formatter is configured. No CI/CD pipeline. Follow conventions below.

## Project Structure

```
src/
  server.ts                  # Server class, handler registration, auto-dispatch
  tools/
    index.ts                 # Aggregates all tools, wraps with error handling
    devices.ts               # harmonyos_list_devices, harmonyos_get_device_info
    projects.ts              # harmonyos_get_project_info, harmonyos_list_modules
    apps.ts                  # harmonyos_list_installed_apps, harmonyos_get_app_info
    build.ts                 # harmonyos_check_build_outputs
  types/
    tool.ts                  # ToolEntry, ToolDefinition<T>, ToolResponse interfaces
    harmonyos-types.ts       # Domain interfaces (ProjectInfo, ModuleInfo, etc.)
  utils/
    hdc.ts                   # hdcExec() - wraps execSync for hdc commands
    json5.ts                 # parseJson5() - strips comments/trailing commas
    response.ts              # toolResult(), toolError(), wrapTool() helpers
test/
  test-tools.mjs             # Manual integration test script
build/                       # Compiled output (gitignored)
```

## Code Style Guidelines

### Formatting
- **Indentation**: 2 spaces, no tabs
- **Semicolons**: always required
- **Quotes**: double quotes in `.ts` files, single quotes in `.mjs` test files
- **Trailing commas**: used in multi-line objects/arrays

### Imports
- ESM `import` syntax only (no `require`)
- Local imports must use `.js` extension (NodeNext module resolution):
  `import { Foo } from "./types/harmonyos-types.js";`
- Order: side-effect imports, external packages, local modules, Node built-ins

### Naming Conventions
| Element            | Convention   | Example                           |
|--------------------|-------------|-----------------------------------|
| Classes            | PascalCase  | `HarmonyOSServer`                 |
| Interfaces         | PascalCase  | `ProjectInfo`, `ToolDefinition`   |
| Zod schemas        | PascalCase  | `GetProjectInfoSchema`            |
| Tool exports       | camelCase   | `listDevices`, `getAppInfo`       |
| Variables/params   | camelCase   | `deviceId`, `bundleName`          |
| MCP tool names     | snake_case  | `harmonyos_list_devices`          |
| Files/directories  | kebab-case  | `harmonyos-types.ts`              |

### Types and Interfaces
- Domain interfaces in `src/types/harmonyos-types.ts` with named exports
- Tool system types in `src/types/tool.ts`:
  - `ToolDefinition<T>` -- generic, used in individual tool files for type safety
  - `ToolEntry` -- non-generic base, used in arrays/maps for registration
  - `ToolResponse` -- return type with index signature for MCP SDK compatibility
- Use `export interface`, not `type` aliases (unless union types needed)
- No `I` prefix on interfaces
- Optional properties use `?`; string literal unions for constrained values
- `any` is acceptable in catch clauses and JSON parsing results

### Error Handling
- Tool handlers are wrapped by `wrapTool()` which catches all errors automatically
- Inside handlers, just `throw` -- the wrapper formats the MCP error response
- Use nested try/catch only for non-critical operations (log via `console.error`)
- Fatal errors at top level: `.catch(() => { console.error(...); process.exit(1); })`
- No custom error classes

### Logging
- ALL logging must use `console.error()` (stderr), never `console.log()` (stdout)
- stdout is reserved for MCP stdio transport protocol communication

### Tool Response Format
Use helpers from `src/utils/response.ts`:
```typescript
return toolResult(data);              // success: JSON.stringify(data, null, 2)
return toolError("something failed"); // error: { isError: true }
throw new Error("...");               // caught by wrapTool(), auto-formatted
```

### External Commands
- Use `hdcExec()` from `src/utils/hdc.ts` (wraps `execSync` with timeout/encoding)
- Default timeout 5000ms, pass `{ timeout: 10000 }` for slow commands

### Exports
- Named exports only, no default exports
- `server.ts` exports nothing (entry point that self-executes)
- Tool files export individual `ToolDefinition` constants

## Adding a New MCP Tool

1. Create or edit a file in `src/tools/` (group related tools per file)
2. Define a Zod schema and a `ToolDefinition<T>` constant:
   ```typescript
   import { z } from "zod";
   import { ToolDefinition } from "../types/tool.js";
   import { toolResult } from "../utils/response.js";

   const MySchema = z.object({ projectPath: z.string() });

   export const myNewTool: ToolDefinition<typeof MySchema> = {
     definition: {
       name: "harmonyos_verb_noun",
       description: "What this tool does",
       inputSchema: {
         type: "object",
         properties: { projectPath: { type: "string", description: "..." } },
         required: ["projectPath"],
       },
     },
     schema: MySchema,
     handler: async ({ projectPath }) => {
       // Business logic here; just throw on errors
       return toolResult({ key: "value" });
     },
   };
   ```
3. Add `wrapTool(myNewTool)` to the `allTools` array in `src/tools/index.ts`
4. If the tool has new domain types, add interfaces to `src/types/harmonyos-types.ts`
5. Build and test: `npm run build && node test/test-tools.mjs`
