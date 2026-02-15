import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  HarmonyOSDevice,
  ProjectInfo,
  ModuleInfo,
  BuildOutput,
  InstalledApp,
  AppInfo,
} from "./types/harmonyos-types.js";
import { z } from "zod";
import { execSync } from "child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";

console.error("Starting MCP HarmonyOS Server...");

// Validation schemas
const GetProjectInfoSchema = z.object({
  projectPath: z.string(),
});

const ListModulesSchema = z.object({
  projectPath: z.string(),
});

const CheckBuildOutputsSchema = z.object({
  projectPath: z.string(),
});

const GetDeviceInfoSchema = z.object({
  deviceId: z.string(),
});

const ListInstalledAppsSchema = z.object({
  deviceId: z.string(),
});

const GetAppInfoSchema = z.object({
  deviceId: z.string(),
  bundleName: z.string(),
});

class HarmonyOSServer {
  private server: Server;

  constructor() {
    console.error("Initializing HarmonyOSServer...");
    this.server = new Server(
      { name: "harmonyos", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );
    console.error("MCP Server initialized");
  }

  private async setupHandlers() {
    console.error("Setting up handlers...");

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error("🛠️ LIST TOOLS: Starting request handler");
      return {
        tools: [
          {
            name: "harmonyos_list_devices",
            description: "List all connected HarmonyOS devices",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "harmonyos_get_device_info",
            description: "Get detailed information about a specific device",
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
          {
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
          {
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
          {
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
          {
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
          {
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
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.error(`🔧 CALL TOOL: ${request.params.name}`);
      try {
        switch (request.params.name) {
          case "harmonyos_list_devices":
            return await this.listDevices();
          case "harmonyos_get_device_info":
            return await this.getDeviceInfo(
              GetDeviceInfoSchema.parse(request.params.arguments)
            );
          case "harmonyos_get_project_info":
            return await this.getProjectInfo(
              GetProjectInfoSchema.parse(request.params.arguments)
            );
          case "harmonyos_list_modules":
            return await this.listModules(
              ListModulesSchema.parse(request.params.arguments)
            );
          case "harmonyos_check_build_outputs":
            return await this.checkBuildOutputs(
              CheckBuildOutputsSchema.parse(request.params.arguments)
            );
          case "harmonyos_list_installed_apps":
            return await this.listInstalledApps(
              ListInstalledAppsSchema.parse(request.params.arguments)
            );
          case "harmonyos_get_app_info":
            return await this.getAppInfo(
              GetAppInfoSchema.parse(request.params.arguments)
            );
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error: any) {
        console.error(`Error in tool ${request.params.name}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });

    console.error("Handlers setup complete");
  }

  // Device Management Tools
  private async listDevices() {
    try {
      const output = execSync("hdc list targets", {
        encoding: "utf-8",
        timeout: 5000,
      });
      const lines = output.trim().split("\n");
      const devices: HarmonyOSDevice[] = lines
        .filter((line) => line && !line.includes("list targets"))
        .map((line) => ({
          udid: line.trim(),
          status: "connected",
        }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(devices, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing devices: ${error.message}. Make sure hdc is installed and devices are connected.`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getDeviceInfo(args: { deviceId: string }) {
    try {
      const { deviceId } = args;

      // Get device shell info
      const shellOutput = execSync(`hdc -t ${deviceId} shell "getprop"`, {
        encoding: "utf-8",
        timeout: 10000,
      });

      // Parse basic device properties
      const parseProperty = (prop: string): string => {
        const match = shellOutput.match(
          new RegExp(`\\[${prop}\\]:\\s*\\[([^\\]]+)\\]`)
        );
        return match ? match[1] : "Unknown";
      };

      const deviceInfo = {
        udid: deviceId,
        model: parseProperty("ro.product.model"),
        brand: parseProperty("ro.product.brand"),
        manufacturer: parseProperty("ro.product.manufacturer"),
        osVersion: parseProperty("ro.build.version.release"),
        sdkVersion: parseProperty("ro.build.version.sdk"),
        buildId: parseProperty("ro.build.display.id"),
        abi: parseProperty("ro.product.cpu.abi"),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(deviceInfo, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting device info: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Project Information Tools
  private async getProjectInfo(args: { projectPath: string }) {
    try {
      const { projectPath } = args;
      const appJsonPath = join(projectPath, "AppScope", "app.json5");

      if (!existsSync(appJsonPath)) {
        throw new Error(
          `app.json5 not found at ${appJsonPath}. Make sure projectPath points to the HarmonyOS project root.`
        );
      }

      // Read and parse app.json5
      const content = readFileSync(appJsonPath, "utf-8");
      const jsonContent = this.parseJson5(content);

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
          const buildJson = this.parseJson5(buildContent);
          projectInfo.modules = buildJson.modules?.map((m: any) => m.name) || [];
        }
      } catch (e) {
        console.error("Could not read build-profile.json5:", e);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(projectInfo, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting project info: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listModules(args: { projectPath: string }) {
    try {
      const { projectPath } = args;
      const buildProfilePath = join(projectPath, "build-profile.json5");

      if (!existsSync(buildProfilePath)) {
        throw new Error(
          `build-profile.json5 not found at ${buildProfilePath}`
        );
      }

      const content = readFileSync(buildProfilePath, "utf-8");
      const buildProfile = this.parseJson5(content);

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
            const moduleJson = this.parseJson5(moduleContent);
            const type = moduleJson.module?.type;

            if (type === "entry" || type === "feature") {
              moduleType = "HAP";
            } else if (type === "shared") {
              moduleType = "HSP";
            } else if (type === "har") {
              moduleType = "HAR";
            }
          } catch (e) {
            console.error(`Could not read module.json5 for ${moduleName}:`, e);
          }
        }

        modules.push({
          name: moduleName,
          type: moduleType,
          path: join(projectPath, moduleSrcPath),
          srcPath: moduleSrcPath,
        });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(modules, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing modules: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async checkBuildOutputs(args: { projectPath: string }) {
    try {
      const { projectPath } = args;
      const outputDir = join(projectPath, "outputs");

      const result: BuildOutput = {
        hasOutputs: false,
        outputDir: outputDir,
        files: [],
        haps: [],
        hsps: [],
      };

      if (!existsSync(outputDir)) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      const files = readdirSync(outputDir);
      result.files = files;
      result.haps = files.filter((f) => f.endsWith(".hap"));
      result.hsps = files.filter((f) => f.endsWith(".hsp"));
      result.hasOutputs = result.haps.length > 0 || result.hsps.length > 0;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error checking build outputs: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Application Management Tools
  private async listInstalledApps(args: { deviceId: string }) {
    try {
      const { deviceId } = args;
      const output = execSync(`hdc -t ${deviceId} shell "bm dump -a"`, {
        encoding: "utf-8",
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

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(apps, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error listing installed apps: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getAppInfo(args: { deviceId: string; bundleName: string }) {
    try {
      const { deviceId, bundleName } = args;
      const output = execSync(
        `hdc -t ${deviceId} shell "bm dump -n ${bundleName}"`,
        {
          encoding: "utf-8",
          timeout: 10000,
        }
      );

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

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(appInfo, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting app info: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  // Utility function to parse JSON5 (simplified)
  private parseJson5(content: string): any {
    // Remove comments
    let cleaned = content
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove /* */ comments
      .replace(/\/\/.*/g, "") // Remove // comments
      .replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas

    return JSON.parse(cleaned);
  }

  async run() {
    await this.setupHandlers();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("HarmonyOS MCP Server running on stdio");
  }
}

const server = new HarmonyOSServer();
server.run().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
