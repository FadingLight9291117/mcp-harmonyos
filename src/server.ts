import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { allTools } from "./tools/index.js";

console.error("Starting MCP HarmonyOS Server...");

class HarmonyOSServer {
  private server: Server;
  private toolMap: Map<string, (typeof allTools)[number]>;

  constructor() {
    console.error("Initializing HarmonyOSServer...");
    this.server = new Server(
      { name: "harmonyos", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );

    // Build a lookup map from tool name -> tool definition
    this.toolMap = new Map(allTools.map((t) => [t.definition.name, t]));
    console.error("MCP Server initialized");
  }

  private async setupHandlers() {
    console.error("Setting up handlers...");

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error("🛠️ LIST TOOLS: Starting request handler");
      return {
        tools: allTools.map((t) => t.definition),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      console.error(`🔧 CALL TOOL: ${toolName}`);

      const tool = this.toolMap.get(toolName);
      if (!tool) {
        return {
          content: [{ type: "text", text: `Error: Unknown tool: ${toolName}` }],
          isError: true,
        };
      }

      const args = tool.schema.parse(request.params.arguments);
      return await tool.handler(args);
    });

    console.error("Handlers setup complete");
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
