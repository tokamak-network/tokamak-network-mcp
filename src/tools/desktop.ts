import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ensureServerStarted } from '../ws';

export function registerDesktopTools(server: McpServer) {
  server.registerTool(
    'open-desktop',
    {
      title: 'Open Tokamak Network Desktop',
      description: 'Opens the Tokamak Network Desktop application in your browser',
      inputSchema: {},
    },
    async () => {
      ensureServerStarted();
      return {
        content: [{ type: 'text', text: 'Tokamak Network Desktop opened successfully' }],
      };
    },
  );
}
