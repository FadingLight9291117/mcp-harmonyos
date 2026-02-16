import { z } from "zod";
import { ToolDefinition } from "../types/tool.js";

/**
 * Build a successful MCP tool response.
 */
export function toolResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Build an MCP tool error response.
 */
export function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

/**
 * Wrap a tool handler with automatic try/catch and error formatting.
 * Returns a new ToolDefinition whose handler never throws.
 */
export function wrapTool<T extends z.ZodType>(
  tool: ToolDefinition<T>
): ToolDefinition<T> {
  return {
    ...tool,
    handler: async (args) => {
      try {
        return await tool.handler(args);
      } catch (error: any) {
        const prefix = `Error in ${tool.definition.name}`;
        console.error(`${prefix}:`, error);
        return toolError(`${prefix}: ${error.message}`);
      }
    },
  };
}
