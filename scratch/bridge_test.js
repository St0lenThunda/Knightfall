import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const SSE_URL = "https://mcp.supabase.com/mcp?project_ref=qingaoyjdkiiexwmybps";

async function run() {
  const transport = new SSEClientTransport(new URL(SSE_URL));
  const client = new Client({
    name: "supabase-test-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  console.log("Connecting to Supabase...");
  await client.connect(transport);
  console.log("Connected.");

  const tools = await client.listTools();
  console.log("Available tools:", JSON.stringify(tools, null, 2));

  await transport.close();
}

run().catch(err => {
  console.error("Connection failed:", err);
  process.exit(1);
});
