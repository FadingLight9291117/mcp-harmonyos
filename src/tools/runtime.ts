import { z } from "zod";
import * as path from "path";
import * as os from "os";
import { ToolDefinition } from "../types/tool.js";
import { hdcExec } from "../utils/hdc.js";
import { toolResult } from "../utils/response.js";

// --- Uninstall App ---

const UninstallAppSchema = z.object({
  deviceId: z.string(),
  bundleName: z.string(),
});

export const uninstallApp: ToolDefinition<typeof UninstallAppSchema> = {
  definition: {
    name: "harmonyos_uninstall_app",
    description: "Uninstall an app from a connected HarmonyOS device by bundle name.",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: { type: "string", description: "The device UDID" },
        bundleName: { type: "string", description: "App bundle name (e.g. com.example.myapp)" },
      },
      required: ["deviceId", "bundleName"],
    },
  },
  schema: UninstallAppSchema,
  handler: async ({ deviceId, bundleName }) => {
    const output = await hdcExec(["shell", "bm", "uninstall", "-n", bundleName], {
      deviceId,
      timeout: 30_000,
    });
    return toolResult({ bundleName, output: output.trim() });
  },
};

// --- Clear App Data ---

const ClearAppDataSchema = z.object({
  deviceId: z.string(),
  bundleName: z.string(),
  type: z.enum(["data", "cache", "all"]).default("data"),
});

export const clearAppData: ToolDefinition<typeof ClearAppDataSchema> = {
  definition: {
    name: "harmonyos_clear_app_data",
    description:
      "Clear an app's data, cache, or both on a HarmonyOS device. Useful for resetting app state during debugging.",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: { type: "string", description: "The device UDID" },
        bundleName: { type: "string", description: "App bundle name" },
        type: {
          type: "string",
          enum: ["data", "cache", "all"],
          description: "What to clear: 'data' (default), 'cache', or 'all' (both)",
        },
      },
      required: ["deviceId", "bundleName"],
    },
  },
  schema: ClearAppDataSchema,
  handler: async ({ deviceId, bundleName, type }) => {
    const results: Record<string, string> = {};
    if (type === "data" || type === "all") {
      results.data = (
        await hdcExec(["shell", "bm", "clean", "-n", bundleName, "-d"], { deviceId, timeout: 15_000 })
      ).trim();
    }
    if (type === "cache" || type === "all") {
      results.cache = (
        await hdcExec(["shell", "bm", "clean", "-n", bundleName, "-c"], { deviceId, timeout: 15_000 })
      ).trim();
    }
    return toolResult({ bundleName, type, results });
  },
};

// --- Reboot Device ---

const RebootDeviceSchema = z.object({
  deviceId: z.string(),
});

export const rebootDevice: ToolDefinition<typeof RebootDeviceSchema> = {
  definition: {
    name: "harmonyos_reboot_device",
    description: "Reboot a connected HarmonyOS device. The device will be temporarily unavailable after this call.",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: { type: "string", description: "The device UDID" },
      },
      required: ["deviceId"],
    },
  },
  schema: RebootDeviceSchema,
  handler: async ({ deviceId }) => {
    await hdcExec(["target", "boot"], { deviceId, timeout: 10_000 });
    return toolResult({ deviceId, status: "reboot command sent" });
  },
};

// --- Install App ---

const InstallAppSchema = z.object({
  deviceId: z.string(),
  hapPath: z.string(),
});

export const installApp: ToolDefinition<typeof InstallAppSchema> = {
  definition: {
    name: "harmonyos_install_app",
    description:
      "Install a HAP package onto a connected HarmonyOS device. Returns hdc's raw output (success message or failure reason).",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: { type: "string", description: "The device UDID" },
        hapPath: {
          type: "string",
          description: "Absolute path to the .hap file on the host machine",
        },
      },
      required: ["deviceId", "hapPath"],
    },
  },
  schema: InstallAppSchema,
  handler: async ({ deviceId, hapPath }) => {
    const output = await hdcExec(["install", hapPath], {
      deviceId,
      timeout: 120_000,
    });
    return toolResult({
      command: `install ${hapPath}`,
      output: output.trim(),
    });
  },
};

// --- Launch App ---

const LaunchAppSchema = z.object({
  deviceId: z.string(),
  bundleName: z.string(),
  abilityName: z.string().default("EntryAbility"),
  moduleName: z.string().optional(),
});

export const launchApp: ToolDefinition<typeof LaunchAppSchema> = {
  definition: {
    name: "harmonyos_launch_app",
    description:
      "Launch an installed app via AbilityManager (aa start). Defaults abilityName to 'EntryAbility'. Provide moduleName when the app has multiple HAP modules.",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: { type: "string", description: "The device UDID" },
        bundleName: {
          type: "string",
          description: "App bundle name (e.g. com.example.myapp)",
        },
        abilityName: {
          type: "string",
          description: "Ability to launch",
          default: "EntryAbility",
        },
        moduleName: {
          type: "string",
          description: "Module name; required if the app ships multiple HAP modules",
        },
      },
      required: ["deviceId", "bundleName"],
    },
  },
  schema: LaunchAppSchema,
  handler: async ({ deviceId, bundleName, abilityName, moduleName }) => {
    const args = ["shell", "aa", "start", "-b", bundleName, "-a", abilityName];
    if (moduleName) args.push("-m", moduleName);
    const output = await hdcExec(args, { deviceId, timeout: 15_000 });
    return toolResult({
      command: args.slice(1).join(" "),
      output: output.trim(),
    });
  },
};

// --- Tail Hilog ---

const TailHilogSchema = z.object({
  deviceId: z.string(),
  lines: z.number().int().positive().max(2000).default(200),
  tag: z.string().optional(),
  level: z.enum(["D", "I", "W", "E", "F"]).optional(),
});

export const tailHilog: ToolDefinition<typeof TailHilogSchema> = {
  definition: {
    name: "harmonyos_tail_hilog",
    description:
      "Snapshot the device's hilog buffer and return the last N lines, optionally filtered by tag substring and minimum level. NOT a live stream — returns whatever is currently in the buffer at call time.",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: { type: "string", description: "The device UDID" },
        lines: {
          type: "number",
          description: "Max lines to return (1-2000, default 200)",
        },
        tag: {
          type: "string",
          description:
            "Only return log lines containing this substring (case-sensitive)",
        },
        level: {
          type: "string",
          enum: ["D", "I", "W", "E", "F"],
          description: "Minimum log level: D(ebug)/I(nfo)/W(arn)/E(rror)/F(atal)",
        },
      },
      required: ["deviceId"],
    },
  },
  schema: TailHilogSchema,
  handler: async ({ deviceId, lines, tag, level }) => {
    const args = ["shell", "hilog", "-x"];
    if (level) args.push("-L", level);
    const output = await hdcExec(args, { deviceId, timeout: 15_000 });

    let allLines = output.split("\n").filter((l) => l.trim().length > 0);
    if (tag) allLines = allLines.filter((l) => l.includes(tag));
    const tail = allLines.slice(-lines);

    return toolResult({
      lineCount: tail.length,
      truncated: allLines.length > tail.length,
      lines: tail,
    });
  },
};

// --- Screenshot ---

const ScreenshotSchema = z.object({
  deviceId: z.string(),
  outputPath: z.string().optional(),
});

export const takeScreenshot: ToolDefinition<typeof ScreenshotSchema> = {
  definition: {
    name: "harmonyos_screenshot",
    description:
      "Capture the device's current screen and pull it to the host as a JPEG. Returns the local file path. Defaults outputPath to a timestamped file in the OS temp directory.",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: { type: "string", description: "The device UDID" },
        outputPath: {
          type: "string",
          description:
            "Absolute local path to save the screenshot. Defaults to OS temp dir.",
        },
      },
      required: ["deviceId"],
    },
  },
  schema: ScreenshotSchema,
  handler: async ({ deviceId, outputPath }) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const remotePath = `/data/local/tmp/screenshot-${timestamp}.jpeg`;
    const localPath =
      outputPath ??
      path.join(os.tmpdir(), `harmonyos-screenshot-${timestamp}.jpeg`);

    await hdcExec(["shell", "snapshot_display", "-f", remotePath], {
      deviceId,
      timeout: 10_000,
    });
    await hdcExec(["file", "recv", remotePath, localPath], {
      deviceId,
      timeout: 15_000,
    });
    // Best-effort cleanup of the on-device file
    try {
      await hdcExec(["shell", "rm", remotePath], { deviceId, timeout: 5_000 });
    } catch {
      /* device may have disconnected — local file already saved */
    }

    return toolResult({ localPath, remotePath });
  },
};
