import { z } from "zod";
import { ToolDefinition } from "../types/tool.js";
import { HarmonyOSDevice } from "../types/harmonyos-types.js";
import { hdcExec } from "../utils/hdc.js";
import { toolResult } from "../utils/response.js";

// --- List Devices ---

const ListDevicesSchema = z.object({});

export const listDevices: ToolDefinition<typeof ListDevicesSchema> = {
  definition: {
    name: "harmonyos_list_devices",
    description: "List all connected HarmonyOS devices",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  schema: ListDevicesSchema,
  handler: async () => {
    const output = hdcExec("list targets");
    const lines = output.trim().split("\n");
    const devices: HarmonyOSDevice[] = lines
      .filter((line) => line && !line.includes("list targets"))
      .map((line) => ({
        udid: line.trim(),
        status: "connected",
      }));

    return toolResult(devices);
  },
};

// --- Get Device Info ---

const GetDeviceInfoSchema = z.object({
  deviceId: z.string(),
});

export const getDeviceInfo: ToolDefinition<typeof GetDeviceInfoSchema> = {
  definition: {
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
  schema: GetDeviceInfoSchema,
  handler: async ({ deviceId }) => {
    const shellOutput = hdcExec(`shell "getprop"`, {
      deviceId,
      timeout: 10000,
    });

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

    return toolResult(deviceInfo);
  },
};
