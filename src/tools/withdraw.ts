import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { encodeFunctionData, formatUnits, parseAbi } from 'viem';
import { z } from 'zod';
import { getCurrentBlockNumber, getLayer2Address, getPendingWithdrawalRequests } from '../actions';
import { KNOWN_LAYER2 } from '../constants';
import { requestTransaction } from '../transaction';
import { getNetworkAddresses } from '../utils';
import { withConnection } from './helper';

export function registerWithdrawTools(server: McpServer) {
  const pendingWithdrawalSchema = {
    layer2: z.enum(KNOWN_LAYER2).describe(`Layer2 operator name (${KNOWN_LAYER2.join(', ')})`),
  };

  server.registerTool(
    'get-pending-withdrawal',
    {
      title: 'Get pending withdrawal requests',
      description: 'Get pending withdrawal requests from a Layer2 operator.',
      inputSchema: pendingWithdrawalSchema,
    },
    async (args: z.infer<z.ZodObject<typeof pendingWithdrawalSchema>>) => {
      return withConnection(async ({ address: account, network }) => {
        const targetAddress = getLayer2Address(args.layer2, network);
        const networkAddresses = getNetworkAddresses(network);

        const pendingRequests = await getPendingWithdrawalRequests({
          depositManager: networkAddresses.DEPOSIT_MANAGER,
          layer2: targetAddress,
          account,
          network,
        });

        if (pendingRequests.length === 0) {
          return `No pending withdrawal requests from ${args.layer2} on ${network}`;
        }

        const formatted = pendingRequests.map((req) => ({
          withdrawableBlockNumber: req.withdrawableBlockNumber.toString(),
          amount: formatUnits(req.amount, 27),
        }));

        return `Pending withdrawal requests from ${args.layer2} on ${network}:\n${JSON.stringify(formatted, null, 2)}`;
      });
    },
  );

  const withdrawTonSchema = {
    layer2: z.enum(KNOWN_LAYER2).describe(`Layer2 operator name (${KNOWN_LAYER2.join(', ')})`),
  };

  server.registerTool(
    'withdraw-ton',
    {
      title: 'Withdraw TON tokens',
      description: 'Process pending withdrawal request and receive TON tokens.',
      inputSchema: withdrawTonSchema,
    },
    async (args: z.infer<z.ZodObject<typeof withdrawTonSchema>>) => {
      return withConnection(async ({ address: account, network }) => {
        const targetAddress = getLayer2Address(args.layer2, network);
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
          throw new Error(`No pending withdrawal requests from ${args.layer2} on ${network}`);
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

        return `Sent request to withdraw TON from ${args.layer2} on ${network}`;
      });
    },
  );
}
