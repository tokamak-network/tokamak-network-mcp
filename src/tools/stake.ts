import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  encodeAbiParameters,
  encodeFunctionData,
  formatUnits,
  parseAbi,
  parseEther,
  parseUnits,
} from 'viem';
import { z } from 'zod';
import { getLayer2Address, getStakedBalance, getTokenBalance } from '../actions';
import { KNOWN_LAYER2 } from '../constants';
import { ERRORS } from '../errors';
import { getTokenAddress } from '../tokens';
import { requestTransaction } from '../transaction';
import { getNetworkAddresses } from '../utils';
import { withConnection } from './helper';

export function registerStakeTools(server: McpServer) {
  const stakedTonSchema = {
    layer2: z.enum(KNOWN_LAYER2).describe(`Layer2 operator name (${KNOWN_LAYER2.join(', ')})`),
  };
  server.registerTool(
    'get-staked-ton-balance',
    {
      title: 'Get staked TON balance',
      description: 'Get the staked TON balance to Layer2 operator.',
      inputSchema: stakedTonSchema,
    },
    async (args: z.infer<z.ZodObject<typeof stakedTonSchema>>) => {
      return withConnection(async ({ address: account, network }) => {
        const targetAddress = getLayer2Address(args.layer2, network);
        const networkAddresses = getNetworkAddresses(network);
        const stakedAmount = formatUnits(
          await getStakedBalance({
            seigManager: networkAddresses.SEIG_MANAGER,
            account,
            network,
            operator: targetAddress,
          }),
          27,
        );

        return `Staked TON balance to ${args.layer2} on ${network}: ${stakedAmount}`;
      });
    },
  );

  const stakeTonSchema = {
    tokenAmount: z.string().describe('The amount of tokens to stake'),
    layer2: z.enum(KNOWN_LAYER2).describe(`Layer2 operator name (${KNOWN_LAYER2.join(', ')})`),
  };
  server.registerTool(
    'stake-ton',
    {
      title: 'Stake TON tokens',
      description: 'Stake a specified amount of TON tokens to a Layer2 operator.',
      inputSchema: stakeTonSchema,
    },
    async (args: z.infer<z.ZodObject<typeof stakeTonSchema>>) => {
      return withConnection(async ({ address: account, network }) => {
        const targetAddress = getLayer2Address(args.layer2, network);
        const networkAddresses = getNetworkAddresses(network);

        const { balance, formatted, decimals } = await getTokenBalance({
          token: 'TON',
          network,
          account,
        });
        if (balance < parseUnits(args.tokenAmount, decimals))
          throw new Error(ERRORS.INSUFFICIENT_BALANCE(formatted, 'TON'));

        const tonAddress = getTokenAddress('TON', network);
        if (!tonAddress) {
          throw new Error(ERRORS.TOKEN_NOT_CONFIGURED('TON', network));
        }
        const wtonAddress = getTokenAddress('WTON', network);
        if (!wtonAddress) {
          throw new Error(ERRORS.TOKEN_NOT_CONFIGURED('WTON', network));
        }

        requestTransaction({
          to: tonAddress,
          data: encodeFunctionData({
            abi: parseAbi(['function approveAndCall(address, uint256, bytes)']),
            functionName: 'approveAndCall',
            args: [
              wtonAddress,
              parseEther(args.tokenAmount),
              encodeAbiParameters(
                [{ type: 'address' }, { type: 'address' }],
                [networkAddresses.DEPOSIT_MANAGER, targetAddress],
              ),
            ],
          }),
        });

        return `Sent request to stake ${args.tokenAmount} TON tokens to ${args.layer2} on ${network}`;
      });
    },
  );
}
