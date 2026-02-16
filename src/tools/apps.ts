import { z } from "zod";
import { ToolDefinition } from "../types/tool.js";
import { InstalledApp, AppInfo } from "../types/harmonyos-types.js";
import { hdcExec } from "../utils/hdc.js";
import { toolResult } from "../utils/response.js";

// --- List Installed Apps ---

const ListInstalledAppsSchema = z.object({
  deviceId: z.string(),
});

export const listInstalledApps: ToolDefinition<
  typeof ListInstalledAppsSchema
> = {
  definition: {
    name: "harmonyos_list_installed_apps",
    description: "List all installed applications on a device",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: {
          type: "string",
          description: "The device UDID",
        },
      },
      required: ["deviceId"],
    },
  },
  schema: ListInstalledAppsSchema,
  handler: async ({ deviceId }) => {
    const output = hdcExec(`shell "bm dump -a"`, {
      deviceId,
      timeout: 15000,
    });

    const apps: InstalledApp[] = [];
    const lines = output.split("\n");

    let currentApp: Partial<InstalledApp> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("bundle name:")) {
        if (currentApp.bundleName) {
          apps.push(currentApp as InstalledApp);
        }
        currentApp = {
          bundleName: trimmed.replace("bundle name:", "").trim(),
        };
      } else if (trimmed.startsWith("version code:")) {
        currentApp.versionCode = trimmed.replace("version code:", "").trim();
      } else if (trimmed.startsWith("version name:")) {
        currentApp.versionName = trimmed.replace("version name:", "").trim();
      }
    }

    if (currentApp.bundleName) {
      apps.push(currentApp as InstalledApp);
    }

    return toolResult(apps);
  },
};

// --- Get App Info ---

const GetAppInfoSchema = z.object({
  deviceId: z.string(),
  bundleName: z.string(),
});

export const getAppInfo: ToolDefinition<typeof GetAppInfoSchema> = {
  definition: {
    name: "harmonyos_get_app_info",
    description: "Get detailed information about an installed application",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: {
          type: "string",
          description: "The device UDID",
        },
        bundleName: {
          type: "string",
          description: "The application bundle name",
        },
      },
      required: ["deviceId", "bundleName"],
    },
  },
  schema: GetAppInfoSchema,
  handler: async ({ deviceId, bundleName }) => {
    const output = hdcExec(`shell "bm dump -n ${bundleName}"`, {
      deviceId,
      timeout: 10000,
    });

    const appInfo: AppInfo = {
      bundleName: bundleName,
    };

    const lines = output.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("version code:")) {
        appInfo.versionCode = trimmed.replace("version code:", "").trim();
      } else if (trimmed.startsWith("version name:")) {
        appInfo.versionName = trimmed.replace("version name:", "").trim();
      } else if (trimmed.startsWith("uid:")) {
        appInfo.uid = trimmed.replace("uid:", "").trim();
      } else if (trimmed.startsWith("install time:")) {
        appInfo.installTime = trimmed.replace("install time:", "").trim();
      } else if (trimmed.startsWith("update time:")) {
        appInfo.updateTime = trimmed.replace("update time:", "").trim();
      } else if (trimmed.startsWith("isSystemApp:")) {
        appInfo.isSystemApp =
          trimmed.replace("isSystemApp:", "").trim() === "true";
      } else if (trimmed.startsWith("isRemovable:")) {
        appInfo.isRemovable =
          trimmed.replace("isRemovable:", "").trim() === "true";
      }
    }

    return toolResult(appInfo);
  },
};
