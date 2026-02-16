import { z } from "zod";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { ToolDefinition } from "../types/tool.js";
import { BuildOutput } from "../types/harmonyos-types.js";
import { toolResult } from "../utils/response.js";

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
