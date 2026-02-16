# mcp-harmonyos v2.0 Development Plan

## Background

v1.0.3 provides 7 MCP tools for basic device, project, and app queries.
After comparing with OpenCode skills (`harmonyos-build-deploy`, `arkts-development`),
the following new tools are identified to provide unique value that skills cannot offer.

**Design Principle**: MCP tools should provide fast structured queries (<1s).
Long-running operations (build, deploy) are better handled by bash + skills.

## Current Tools (v1.0.3)

| # | Tool | Category |
|---|------|----------|
| 1 | `harmonyos_list_devices` | Device |
| 2 | `harmonyos_get_device_info` | Device |
| 3 | `harmonyos_get_project_info` | Project |
| 4 | `harmonyos_list_modules` | Project |
| 5 | `harmonyos_check_build_outputs` | Project |
| 6 | `harmonyos_list_installed_apps` | App |
| 7 | `harmonyos_get_app_info` | App |

## New Tools Plan

### High Priority (MCP does significantly better than skills)

#### 8. `harmonyos_analyze_permissions`
- **Input**: `projectPath`
- **Output**: Aggregated permission list across all modules
- **Details**: Parse `requestPermissions` from every module's `module.json5`.
  Return per-module permissions and a deduplicated global list.
  Include permission reason strings if present.
- **Why MCP**: Skills require reading each file manually. MCP aggregates across all modules in one call.

#### 9. `harmonyos_analyze_dependencies`
- **Input**: `projectPath`
- **Output**: Dependency graph with version conflict detection
- **Details**: Parse all `oh-package.json5` files (root + each module).
  Build dependency map, detect version conflicts (same package, different versions across modules).
  Separate dependencies vs devDependencies.
- **Why MCP**: Cross-module dependency analysis is tedious manually. MCP returns structured conflict report.

#### 10. `harmonyos_check_signing_config`
- **Input**: `projectPath`
- **Output**: Signing configuration status and completeness check
- **Details**: Parse `build-profile.json5` signingConfigs section.
  Check if certificate/profile paths exist on disk.
  Report missing or incomplete configs per product.
- **Why MCP**: Pre-build validation. Skills can only tell you what to check, not actually check it.

#### 11. `harmonyos_analyze_abilities`
- **Input**: `projectPath`
- **Output**: All abilities/pages across all modules
- **Details**: Parse `abilities` array from each module's `module.json5`.
  Extract name, label, launchType, exported status, skills (URI patterns).
  Identify the main entry ability. List all registered pages from each module.
- **Why MCP**: Complete app navigation map in one call. Essential for understanding app structure.

### Medium Priority (Useful but requires device connection)

#### 12. `harmonyos_get_device_log`
- **Input**: `deviceId`, optional `tag`, `level` (DEBUG/INFO/WARN/ERROR/FATAL), `keyword`, `lines` (default 50)
- **Output**: Filtered device log entries
- **Details**: Run `hdc -t <UDID> shell "hilog -x"` with filters.
  Parse and structure log entries. Limit output to prevent overwhelming responses.
- **Why MCP**: Structured log output vs raw hilog text. AI can analyze errors directly.

#### 13. `harmonyos_check_app_running`
- **Input**: `deviceId`, `bundleName`
- **Output**: Whether the app is running, with process info
- **Details**: Run `hdc -t <UDID> shell "ps -ef"` and search for the bundle.
  Return running status, PID, memory usage if available.
- **Why MCP**: Quick status check, much faster than manual shell + grep.

#### 14. `harmonyos_get_build_profile`
- **Input**: `projectPath`
- **Output**: Complete parsed build-profile.json5
- **Details**: Full parse of build-profile.json5 including products, targets,
  compileSdkVersion, compatibleSdkVersion, signing configs.
  Structured and organized by section.
- **Why MCP**: Complete build configuration in one structured call.

### Low Priority (Advanced MCP features)

#### 15. MCP Resources
- Expose project configuration files as MCP resources
- `harmonyos://project/{path}/app.json5` - App configuration
- `harmonyos://project/{path}/build-profile.json5` - Build profile
- `harmonyos://project/{path}/modules` - Module list with configs
- **Why**: AI can subscribe to project config changes proactively

#### 16. MCP Prompts
- Pre-defined prompt templates:
  - `analyze-project` - Full project structure analysis
  - `pre-deploy-check` - Verify everything is ready for deployment
  - `diagnose-build-error` - Analyze build failure with context
- **Why**: One-click complex analysis workflows

## Implementation Order

```
Phase 1: High Priority Tools (8-11)
  1. Add new types to harmonyos-types.ts
  2. Implement each tool in server.ts
  3. Test with HarmonyOS-APM project
  4. Build and verify

Phase 2: Medium Priority Tools (12-14)
  5. Implement device-dependent tools
  6. Test with connected device

Phase 3: Low Priority Features (15-16)
  7. Add MCP Resources support
  8. Add MCP Prompts support

Phase 4: Release
  9. Update version to 2.0.0
  10. Update README and docs
  11. Publish to npm and MCP Registry
```

## Test Project

- Path: `/Users/clz/projects/HarmonyOS-APM/`
- bundleName: `com.example.apm_demo_thrid_phase`
- Modules: entry, apm, native_error_demo
