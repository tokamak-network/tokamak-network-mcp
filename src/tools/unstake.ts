import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { encodeFunctionData, formatUnits, parseAbi, parseUnits } from 'viem';
import { z } from 'zod';
import { getLayer2Address, getStakedBalance } from '../actions';
import { KNOWN_LAYER2_MAINNET, KNOWN_LAYER2_SEPOLIA } from '../constants';
import { ERRORS } from '../errors';
import { requestTransaction } from '../transaction';
import { getNetworkAddresses } from '../utils';
import { getConnectionState } from '../ws';

const KNOWN_LAYER2 = [...KNOWN_LAYER2_MAINNET, ...KNOWN_LAYER2_SEPOLIA] as const;

export function registerUnstakeTools(server: McpServer) {
  const unstakeTonSchema = {
    tokenAmount: z.string().describe('The amount of tokens to unstake'),
    layer2: z.enum(KNOWN_LAYER2).describe(`Layer2 operator name (${KNOWN_LAYER2.join(', ')})`),
  };

  server.registerTool(
    'unstake-ton',
    {
      title: 'Unstake TON tokens from Layer2 operator',
      description: 'Request withdrawal of staked TON tokens from a Layer2 operator.',
      inputSchema: unstakeTonSchema,
    },
    async (args: z.infer<z.ZodObject<typeof unstakeTonSchema>>) => {
      try {
        const { connected, address: account, network } = getConnectionState();
        if (!connected) throw new Error(ERRORS.NO_WALLET_CONNECTED);

        const targetAddress = getLayer2Address(args.layer2, network);
        const networkAddresses = getNetworkAddresses(network);

        const stakedAmount = await getStakedBalance({
          seigManager: networkAddresses.SEIG_MANAGER,
          account,
          network,
          operator: targetAddress,
        });

        const requestedAmount = parseUnits(args.tokenAmount, 27);
        if (stakedAmount < requestedAmount) {
          throw new Error(
            `Insufficient staked amount. Staked: ${formatUnits(stakedAmount, 27)}, Requested: ${args.tokenAmount}`,
          );
        }

        requestTransaction({
          to: networkAddresses.DEPOSIT_MANAGER,
          data: encodeFunctionData({
            abi: parseAbi(['function requestWithdrawal(address layer2, uint256 amount)']),
            functionName: 'requestWithdrawal',
            args: [targetAddress, requestedAmount],
          }),
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Sent request to unstake ${args.tokenAmount} TON from ${args.layer2} on ${network}`,
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
