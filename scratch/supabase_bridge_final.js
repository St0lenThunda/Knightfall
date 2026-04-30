import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const PROJECT_REF = "qingaoyjdkiiexwmybps";
const ACCESS_TOKEN = "sbp_e6bd82ca2b9cfaa8333c21ef4e0fb47860c28ba0";
const SSE_URL = `https://mcp.supabase.com/mcp?project_ref=${PROJECT_REF}`;

async function run() {
  // 1. Connect to the remote Supabase MCP server via SSE
  const transport = new SSEClientTransport(new URL(SSE_URL), {
    eventSourceInitDict: {
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`
      }
    }
  });

  const remoteClient = new Client({
    name: "supabase-proxy-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  await remoteClient.connect(transport);

  // 2. Create a local stdio server to proxy the requests
  const server = new Server({
    name: "chrome-supabase",
    version: "1.0.0"
  }, {
    capabilities: {
      tools: {}
    }
  });

  // 3. Proxy tools
  server.setRequestHandler(
    ListToolsRequestSchema,
    async () => {
      return await remoteClient.listTools();
    }
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      return await remoteClient.callTool(request.params.name, request.params.arguments);
    }
  );

  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
}

// Imports for schemas
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

run().catch(err => {
  console.error("Bridge failure:", err);
  process.exit(1);
});
