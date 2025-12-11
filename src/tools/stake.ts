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
import { getStakedBalance, getTokenBalance, resolveLayer2Address } from '../actions';
import { ERRORS } from '../errors';
import { getTokenAddress } from '../tokens';
import { requestTransaction } from '../transaction';
import { getNetworkAddresses } from '../utils';
import { getConnectionState } from '../ws';

export function registerStakeTools(server: McpServer) {
  const stakedTonSchema = {
    layer2Identifier: z
      .string()
      .toLowerCase()
      .describe("The Layer2 identifier(Operator's name or address)"),
  };
  server.registerTool(
    'get-staked-ton-balance',
    {
      title: 'Get staked TON balance',
      description: 'Get the staked TON balance to Layer2 operator.',
      inputSchema: stakedTonSchema,
    },
    async (args: z.infer<z.ZodObject<typeof stakedTonSchema>>) => {
      try {
        const { connected, address: account, network } = getConnectionState();
        if (!connected) throw new Error(ERRORS.NO_WALLET_CONNECTED);

        const targetAddress = resolveLayer2Address(args.layer2Identifier.toLowerCase(), network);
        if (!targetAddress)
          throw new Error(
            ERRORS.LAYER2_NOT_CONFIGURED(args.layer2Identifier.toLowerCase(), network),
          );

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

        return {
          content: [
            {
              type: 'text' as const,
              text: `Staked TON balance to ${args.layer2Identifier} on ${network}: ${stakedAmount}`,
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

  const stakeTonSchema = {
    tokenAmount: z.string().describe('The amount of tokens to stake'),
    layer2Identifier: z.string().describe("The Layer2 identifier(Operator's name or address)"),
  };
  server.registerTool(
    'stake-ton',
    {
      title: 'Stake TON tokens',
      description: 'Stake a specified amount of TON tokens to a Layer2 operator.',
      inputSchema: stakeTonSchema,
    },
    async (args: z.infer<z.ZodObject<typeof stakeTonSchema>>) => {
      try {
        const { connected, address: account, network } = getConnectionState();
        if (!connected) throw new Error(ERRORS.NO_WALLET_CONNECTED);

        const targetAddress = resolveLayer2Address(args.layer2Identifier, network);
        if (!targetAddress)
          throw new Error(ERRORS.LAYER2_NOT_CONFIGURED(args.layer2Identifier, network));

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

        return {
          content: [
            {
              type: 'text' as const,
              text: `Sent request to stake ${args.tokenAmount} TON tokens to ${args.layer2Identifier} on ${network}`,
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
