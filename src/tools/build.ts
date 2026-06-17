import { z } from "zod";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { ToolDefinition } from "../types/tool.js";
import { BuildOutput } from "../types/harmonyos-types.js";
import { toolResult } from "../utils/response.js";

const execFileAsync = promisify(execFile);

// --- Build Project ---

const BuildProjectSchema = z.object({
  projectPath: z.string(),
  target: z.enum(["assembleHap", "assembleApp", "assembleHsp"]).default("assembleHap"),
  module: z.string().optional(),
});

export const buildProject: ToolDefinition<typeof BuildProjectSchema> = {
  definition: {
    name: "harmonyos_build",
    description:
      "Trigger a HarmonyOS build by running hvigorw in the project root. Returns stdout/stderr output. May take several minutes.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Absolute path to the HarmonyOS project root (where hvigorw / hvigorw.bat lives)",
        },
        target: {
          type: "string",
          enum: ["assembleHap", "assembleApp", "assembleHsp"],
          description: "Hvigor build target (default: assembleHap)",
        },
        module: {
          type: "string",
          description: "Limit build to a specific module name (e.g. entry). Omit to build all modules.",
        },
      },
      required: ["projectPath"],
    },
  },
  schema: BuildProjectSchema,
  handler: async ({ projectPath, target, module }) => {
    const isWin = process.platform === "win32";
    const script = isWin ? "hvigorw.bat" : "hvigorw";
    const scriptPath = join(projectPath, script);

    if (!existsSync(scriptPath)) {
      throw new Error(`hvigorw not found at ${scriptPath}. Make sure projectPath is the project root.`);
    }

    const args = [target, "--no-daemon"];
    if (module) args.push(`-p`, `module=${module}@default`);

    const { stdout, stderr } = await execFileAsync(scriptPath, args, {
      cwd: projectPath,
      encoding: "utf-8",
      timeout: 10 * 60_000,
      maxBuffer: 20 * 1024 * 1024,
    });

    return toolResult({
      target,
      module: module ?? "all",
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    });
  },
};

// --- Check Build Outputs ---

const CheckBuildOutputsSchema = z.object({
  projectPath: z.string(),
});

export const checkBuildOutputs: ToolDefinition<
  typeof CheckBuildOutputsSchema
> = {
  definition: {
    name: "harmonyos_check_build_outputs",
    description: "Check if build outputs exist and list them",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Absolute path to the HarmonyOS project root",
        },
      },
      required: ["projectPath"],
    },
  },
  schema: CheckBuildOutputsSchema,
  handler: async ({ projectPath }) => {
    const outputDir = join(projectPath, "outputs");

    const result: BuildOutput = {
      hasOutputs: false,
      outputDir: outputDir,
      files: [],
      haps: [],
      hsps: [],
    };

    if (!existsSync(outputDir)) {
      return toolResult(result);
    }

    const files = readdirSync(outputDir);
    result.files = files;
    result.haps = files.filter((f) => f.endsWith(".hap"));
    result.hsps = files.filter((f) => f.endsWith(".hsp"));
    result.hasOutputs = result.haps.length > 0 || result.hsps.length > 0;

    return toolResult(result);
  },
};
