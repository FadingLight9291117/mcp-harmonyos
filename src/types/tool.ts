import { z } from "zod";

export interface ToolResponse {
  [key: string]: unknown;
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

/**
 * Non-generic base interface for tool registration and dispatch.
 * Used in arrays, Maps, and the server's auto-registration loop.
 */
export interface ToolEntry {
  definition: {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  };
  schema: z.ZodType;
  handler: (args: any) => Promise<ToolResponse>;
}

/**
 * Generic interface for type-safe tool authoring.
 * Individual tool files use this to get compile-time argument checking.
 */
export interface ToolDefinition<T extends z.ZodType> extends ToolEntry {
  schema: T;
  handler: (args: z.infer<T>) => Promise<ToolResponse>;
}
