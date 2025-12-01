import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  registerErc20Tools,
  registerStakeTools,
  registerTonTools,
  registerUnstakeTools,
  registerWalletTools,
} from './tools';
import { startServer } from './ws';

const PORT = 3000;

// Start dashboard
startServer(PORT);

// Create MCP server
const server = new McpServer({
  name: 'tnm',
  version: '1.0.0',
});

// Register tools

registerTonTools(server);
registerWalletTools(server);
registerErc20Tools(server);
registerStakeTools(server);
registerUnstakeTools(server);

// Handle shutdown
process.on('SIGINT', () => {
  console.error('Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Shutting down...');
  process.exit(0);
});

// Exit when stdin closes (MCP client disconnected)
process.stdin.on('close', () => {
  console.error('MCP client disconnected, shutting down...');
  process.exit(0);
});

// Start MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server started');
}

main().catch(console.error);
