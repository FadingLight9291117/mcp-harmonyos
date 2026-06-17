import { z } from "zod";
import * as path from "path";
import * as os from "os";
import { ToolDefinition } from "../types/tool.js";
import { hdcExec } from "../utils/hdc.js";
import { toolResult } from "../utils/response.js";

// --- Get Crash Logs ---

const GetCrashLogsSchema = z.object({
  deviceId: z.string(),
  bundleName: z.string().optional(),
  fetchLatest: z.boolean().default(false),
  localDir: z.string().optional(),
});

export const getCrashLogs: ToolDefinition<typeof GetCrashLogsSchema> = {
  definition: {
    name: "harmonyos_get_crash_logs",
    description:
      "List crash logs in /data/log/faultlog/ on the device, optionally filtered by bundle name. Set fetchLatest=true to also pull the most recent log file to the host.",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: { type: "string", description: "The device UDID" },
        bundleName: {
          type: "string",
          description: "Filter logs by bundle name substring (e.g. com.example.myapp)",
        },
        fetchLatest: {
          type: "boolean",
          description: "If true, pull the most recent matching log file to the host (default: false)",
        },
        localDir: {
          type: "string",
          description: "Local directory to save fetched log. Defaults to OS temp dir.",
        },
      },
      required: ["deviceId"],
    },
  },
  schema: GetCrashLogsSchema,
  handler: async ({ deviceId, bundleName, fetchLatest, localDir }) => {
    const lsOutput = await hdcExec(["shell", "ls", "-t", "/data/log/faultlog/"], {
      deviceId,
      timeout: 10_000,
    });

    let files = lsOutput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (bundleName) {
      files = files.filter((f) => f.includes(bundleName));
    }

    let fetchedPath: string | undefined;
    if (fetchLatest && files.length > 0) {
      const remotePath = `/data/log/faultlog/${files[0]}`;
      const localPath = path.join(localDir ?? os.tmpdir(), files[0]);
      await hdcExec(["file", "recv", remotePath, localPath], {
        deviceId,
        timeout: 30_000,
      });
      fetchedPath = localPath;
    }

    return toolResult({
      total: files.length,
      files,
      fetchedPath,
    });
  },
};

// --- Get App Memory ---

const GetAppMemorySchema = z.object({
  deviceId: z.string(),
  bundleName: z.string(),
});

export const getAppMemory: ToolDefinition<typeof GetAppMemorySchema> = {
  definition: {
    name: "harmonyos_get_app_memory",
    description:
      "Get memory usage of a running app by bundle name using hidumper. The app must be running on the device.",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: { type: "string", description: "The device UDID" },
        bundleName: {
          type: "string",
          description: "App bundle name (e.g. com.example.myapp). The app must be running.",
        },
      },
      required: ["deviceId", "bundleName"],
    },
  },
  schema: GetAppMemorySchema,
  handler: async ({ deviceId, bundleName }) => {
    // 找到进程 PID
    const psOutput = await hdcExec(["shell", "ps", "-ef"], {
      deviceId,
      timeout: 10_000,
    });

    const matchLine = psOutput
      .split("\n")
      .find((l) => l.includes(bundleName));

    if (!matchLine) {
      throw new Error(`No running process found for bundle: ${bundleName}. Is the app launched?`);
    }

    // ps -ef 格式: UID PID PPID ...
    const parts = matchLine.trim().split(/\s+/);
    const pid = parts[1];

    if (!pid || isNaN(Number(pid))) {
      throw new Error(`Could not parse PID from ps output: ${matchLine}`);
    }

    const memOutput = await hdcExec(["shell", "hidumper", "--mem", pid], {
      deviceId,
      timeout: 15_000,
    });

    return toolResult({
      bundleName,
      pid,
      report: memOutput.trim(),
    });
  },
};
