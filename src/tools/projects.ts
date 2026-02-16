import { z } from "zod";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { ToolDefinition } from "../types/tool.js";
import { ProjectInfo, ModuleInfo } from "../types/harmonyos-types.js";
import { parseJson5 } from "../utils/json5.js";
import { toolResult } from "../utils/response.js";

// --- Get Project Info ---

const GetProjectInfoSchema = z.object({
  projectPath: z.string(),
});

export const getProjectInfo: ToolDefinition<typeof GetProjectInfoSchema> = {
  definition: {
    name: "harmonyos_get_project_info",
    description:
      "Get HarmonyOS project information (bundleName, version, modules)",
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
  schema: GetProjectInfoSchema,
  handler: async ({ projectPath }) => {
    const appJsonPath = join(projectPath, "AppScope", "app.json5");

    if (!existsSync(appJsonPath)) {
      throw new Error(
        `app.json5 not found at ${appJsonPath}. Make sure projectPath points to the HarmonyOS project root.`
      );
    }

    const content = readFileSync(appJsonPath, "utf-8");
    const jsonContent = parseJson5(content);

    const projectInfo: ProjectInfo = {
      bundleName: jsonContent.app?.bundleName || "Unknown",
      versionCode: jsonContent.app?.versionCode || 0,
      versionName: jsonContent.app?.versionName || "Unknown",
      minCompatibleVersionCode: jsonContent.app?.minCompatibleVersionCode,
      targetAPIVersion: jsonContent.app?.targetAPIVersion,
      apiReleaseType: jsonContent.app?.apiReleaseType,
    };

    // Try to get modules list from build-profile.json5
    try {
      const buildProfilePath = join(projectPath, "build-profile.json5");
      if (existsSync(buildProfilePath)) {
        const buildContent = readFileSync(buildProfilePath, "utf-8");
        const buildJson = parseJson5(buildContent);
        projectInfo.modules =
          buildJson.modules?.map((m: any) => m.name) || [];
      }
    } catch (e) {
      console.error("Could not read build-profile.json5:", e);
    }

    return toolResult(projectInfo);
  },
};

// --- List Modules ---

const ListModulesSchema = z.object({
  projectPath: z.string(),
});

export const listModules: ToolDefinition<typeof ListModulesSchema> = {
  definition: {
    name: "harmonyos_list_modules",
    description: "List all modules in a HarmonyOS project with their types",
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
  schema: ListModulesSchema,
  handler: async ({ projectPath }) => {
    const buildProfilePath = join(projectPath, "build-profile.json5");

    if (!existsSync(buildProfilePath)) {
      throw new Error(
        `build-profile.json5 not found at ${buildProfilePath}`
      );
    }

    const content = readFileSync(buildProfilePath, "utf-8");
    const buildProfile = parseJson5(content);

    if (!buildProfile.modules || !Array.isArray(buildProfile.modules)) {
      throw new Error("No modules found in build-profile.json5");
    }

    const modules: ModuleInfo[] = [];

    for (const module of buildProfile.modules) {
      const moduleName = module.name;
      const moduleSrcPath = module.srcPath || moduleName;
      const moduleJsonPath = join(
        projectPath,
        moduleSrcPath,
        "src",
        "main",
        "module.json5"
      );

      let moduleType: "HAP" | "HSP" | "HAR" | "unknown" = "unknown";

      if (existsSync(moduleJsonPath)) {
        try {
          const moduleContent = readFileSync(moduleJsonPath, "utf-8");
          const moduleJson = parseJson5(moduleContent);
          const type = moduleJson.module?.type;

          if (type === "entry" || type === "feature") {
            moduleType = "HAP";
          } else if (type === "shared") {
            moduleType = "HSP";
          } else if (type === "har") {
            moduleType = "HAR";
          }
        } catch (e) {
          console.error(
            `Could not read module.json5 for ${moduleName}:`,
            e
          );
        }
      }

      modules.push({
        name: moduleName,
        type: moduleType,
        path: join(projectPath, moduleSrcPath),
        srcPath: moduleSrcPath,
      });
    }

    return toolResult(modules);
  },
};
