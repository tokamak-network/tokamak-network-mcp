import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { encodeFunctionData, formatUnits, parseAbi } from 'viem';
import { z } from 'zod';
import { getCurrentBlockNumber, getPendingWithdrawalRequests, resolveLayer2Address } from '../actions';
import { ERRORS } from '../errors';
import { requestTransaction } from '../transaction';
import { getNetworkAddresses } from '../utils';
import { getConnectionState } from '../ws';

export function registerWithdrawTools(server: McpServer) {
  const pendingWithdrawalSchema = {
    layer2Identifier: z
      .string()
      .toLowerCase()
      .describe("The Layer2 identifier (Operator's name or address)"),
  };

  server.registerTool(
    'get-pending-withdrawal',
    {
      title: 'Get pending withdrawal requests',
      description: 'Get pending withdrawal requests from a Layer2 operator.',
      inputSchema: pendingWithdrawalSchema,
    },
    async (args: z.infer<z.ZodObject<typeof pendingWithdrawalSchema>>) => {
      try {
        const { connected, address: account, network } = getConnectionState();
        if (!connected) throw new Error(ERRORS.NO_WALLET_CONNECTED);

        const targetAddress = resolveLayer2Address(args.layer2Identifier, network);
        if (!targetAddress)
          throw new Error(ERRORS.LAYER2_NOT_CONFIGURED(args.layer2Identifier, network));

        const networkAddresses = getNetworkAddresses(network);

        const pendingRequests = await getPendingWithdrawalRequests({
          depositManager: networkAddresses.DEPOSIT_MANAGER,
          layer2: targetAddress,
          account,
          network,
        });

        if (pendingRequests.length === 0) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No pending withdrawal requests from ${args.layer2Identifier} on ${network}`,
              },
            ],
          };
        }

        const formatted = pendingRequests.map((req) => ({
          withdrawableBlockNumber: req.withdrawableBlockNumber.toString(),
          amount: formatUnits(req.amount, 27),
        }));

        return {
          content: [
            {
              type: 'text' as const,
              text: `Pending withdrawal requests from ${args.layer2Identifier} on ${network}:\n${JSON.stringify(formatted, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: message }],
          isError: true,
        };
      }
    },
  );

  const withdrawTonSchema = {
    layer2Identifier: z
      .string()
      .toLowerCase()
      .describe("The Layer2 identifier (Operator's name or address)"),
  };

  server.registerTool(
    'withdraw-ton',
    {
      title: 'Withdraw TON tokens',
      description: 'Process pending withdrawal request and receive TON tokens.',
      inputSchema: withdrawTonSchema,
    },
    async (args: z.infer<z.ZodObject<typeof withdrawTonSchema>>) => {
      try {
        const { connected, address: account, network } = getConnectionState();
        if (!connected) throw new Error(ERRORS.NO_WALLET_CONNECTED);

        const targetAddress = resolveLayer2Address(args.layer2Identifier, network);
        if (!targetAddress)
          throw new Error(ERRORS.LAYER2_NOT_CONFIGURED(args.layer2Identifier, network));

        const networkAddresses = getNetworkAddresses(network);

        // Check if there are pending requests
        const [pendingRequests, currentBlock] = await Promise.all([
          getPendingWithdrawalRequests({
            depositManager: networkAddresses.DEPOSIT_MANAGER,
            layer2: targetAddress,
            account,
            network,
          }),
          getCurrentBlockNumber(network),
        ]);

        if (pendingRequests.length === 0) {
          throw new Error(`No pending withdrawal requests from ${args.layer2Identifier} on ${network}`);
        }

        // Check if any request is withdrawable (current block >= withdrawableBlockNumber)
        const withdrawableRequest = pendingRequests.find(
          (req) => currentBlock >= req.withdrawableBlockNumber,
        );

        if (!withdrawableRequest) {
          const earliestRequest = pendingRequests.reduce((min, req) =>
            req.withdrawableBlockNumber < min.withdrawableBlockNumber ? req : min,
          );
          const blocksRemaining = earliestRequest.withdrawableBlockNumber - currentBlock;
          throw new Error(
            `No withdrawable requests yet. Earliest request available at block ${earliestRequest.withdrawableBlockNumber} (${blocksRemaining} blocks remaining, current: ${currentBlock})`,
          );
        }

        requestTransaction({
          to: networkAddresses.DEPOSIT_MANAGER,
          data: encodeFunctionData({
            abi: parseAbi(['function processRequest(address layer2, bool receiveTON)']),
            functionName: 'processRequest',
            args: [targetAddress, true],
          }),
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Sent request to withdraw TON from ${args.layer2Identifier} on ${network}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: message }],
          isError: true,
        };
      }
    },
  );
}
