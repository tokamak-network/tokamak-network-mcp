import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAccount } from '../ws';

export function registerWalletTools(server: McpServer) {
  server.registerTool(
    'get_wallet_address',
    {
      description:
        'Get the connected wallet address. Returns the cached address if wallet is already connected.',
    },
    async () => {
      const address = getAccount();
      return {
        content: [
          {
            type: 'text' as const,
            text: address
              ? `Connected wallet: ${address}`
              : 'No wallet connected. Please run connect_wallet tool first.',
          },
        ],
      };
    },
  );
}
