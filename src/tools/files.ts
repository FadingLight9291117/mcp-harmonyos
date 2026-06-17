import { z } from "zod";
import * as path from "path";
import * as os from "os";
import { ToolDefinition } from "../types/tool.js";
import { hdcExec } from "../utils/hdc.js";
import { toolResult } from "../utils/response.js";

// --- Push File ---

const PushFileSchema = z.object({
  deviceId: z.string(),
  localPath: z.string(),
  remotePath: z.string(),
});

export const pushFile: ToolDefinition<typeof PushFileSchema> = {
  definition: {
    name: "harmonyos_push_file",
    description:
      "Push a local file to a path on a connected HarmonyOS device. Wraps `hdc file send`.",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: { type: "string", description: "The device UDID" },
        localPath: { type: "string", description: "Absolute path to the file on the host machine" },
        remotePath: {
          type: "string",
          description: "Absolute path on the device (e.g. /data/local/tmp/myfile.txt)",
        },
      },
      required: ["deviceId", "localPath", "remotePath"],
    },
  },
  schema: PushFileSchema,
  handler: async ({ deviceId, localPath, remotePath }) => {
    const output = await hdcExec(["file", "send", localPath, remotePath], {
      deviceId,
      timeout: 60_000,
    });
    return toolResult({ localPath, remotePath, output: output.trim() });
  },
};

// --- Pull File ---

const PullFileSchema = z.object({
  deviceId: z.string(),
  remotePath: z.string(),
  localPath: z.string().optional(),
});

export const pullFile: ToolDefinition<typeof PullFileSchema> = {
  definition: {
    name: "harmonyos_pull_file",
    description:
      "Pull a file from a connected HarmonyOS device to the host machine. Wraps `hdc file recv`. Defaults localPath to OS temp dir.",
    inputSchema: {
      type: "object",
      properties: {
        deviceId: { type: "string", description: "The device UDID" },
        remotePath: {
          type: "string",
          description: "Absolute path to the file on the device",
        },
        localPath: {
          type: "string",
          description: "Absolute local destination path. Defaults to OS temp dir.",
        },
      },
      required: ["deviceId", "remotePath"],
    },
  },
  schema: PullFileSchema,
  handler: async ({ deviceId, remotePath, localPath }) => {
    const resolved =
      localPath ?? path.join(os.tmpdir(), path.basename(remotePath));
    const output = await hdcExec(["file", "recv", remotePath, resolved], {
      deviceId,
      timeout: 60_000,
    });
    return toolResult({ remotePath, localPath: resolved, output: output.trim() });
  },
};
