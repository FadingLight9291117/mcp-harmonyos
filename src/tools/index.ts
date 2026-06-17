import { ToolEntry } from "../types/tool.js";
import { wrapTool } from "../utils/response.js";

// Device tools
import { listDevices, getDeviceInfo } from "./devices.js";

// Project tools
import { getProjectInfo, listModules, listDependencies } from "./projects.js";

// Application tools
import { listInstalledApps, getAppInfo } from "./apps.js";

// Build tools
import { checkBuildOutputs, buildProject } from "./build.js";

// Runtime tools (install / uninstall / launch / clear / reboot / log / screenshot)
import { installApp, uninstallApp, clearAppData, launchApp, tailHilog, takeScreenshot, rebootDevice } from "./runtime.js";

// File transfer tools
import { pushFile, pullFile } from "./files.js";

// Diagnostics tools
import { getCrashLogs, getAppMemory } from "./diagnostics.js";

/**
 * All registered MCP tools, wrapped with automatic error handling.
 */
export const allTools: ToolEntry[] = [
  // Device Management
  wrapTool(listDevices),
  wrapTool(getDeviceInfo),
  wrapTool(rebootDevice),
  // Project Information
  wrapTool(getProjectInfo),
  wrapTool(listModules),
  wrapTool(listDependencies),
  // Build
  wrapTool(checkBuildOutputs),
  wrapTool(buildProject),
  // Application Management
  wrapTool(listInstalledApps),
  wrapTool(getAppInfo),
  // Runtime: install / uninstall / launch / clear
  wrapTool(installApp),
  wrapTool(uninstallApp),
  wrapTool(launchApp),
  wrapTool(clearAppData),
  // File Transfer
  wrapTool(pushFile),
  wrapTool(pullFile),
  // Log & Diagnostics
  wrapTool(tailHilog),
  wrapTool(takeScreenshot),
  wrapTool(getCrashLogs),
  wrapTool(getAppMemory),
];
