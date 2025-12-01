import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { encodeFunctionData, parseAbi, parseUnits } from 'viem';
import { z } from 'zod';
import { getAllowance, getTokenBalance } from '../actions';
import { ERRORS } from '../errors';
import { getTokenAddress } from '../tokens';
import { requestTransaction } from '../transaction';
import { getConnectionState } from '../ws';

export function registerTonTools(server: McpServer) {
  const wrapTonSchema = {
    tokenAmount: z.string().describe('The amount of tokens to wrap'),
  };
  server.registerTool(
    'wrap-ton',
    {
      title: 'Wrap TON tokens to WTON',
      description: 'Wrap(also known as Swap, Convert) a specified amount of TON tokens to WTON.',
      inputSchema: wrapTonSchema,
    },
    async (args: z.infer<z.ZodObject<typeof wrapTonSchema>>) => {
      try {
        const { connected, address: account, network } = getConnectionState();
        if (!connected) throw new Error(ERRORS.NO_WALLET_CONNECTED);

        const { balance, formatted, decimals } = await getTokenBalance({
          tokenNameOrAddress: 'TON',
          network,
          account,
        });
        if (balance < parseUnits(args.tokenAmount, decimals))
          throw new Error(ERRORS.INSUFFICIENT_BALANCE(formatted, 'TON'));

        const tonAddress = getTokenAddress('TON', network);
        const wtonAddress = getTokenAddress('WTON', network);
        if (!tonAddress || !wtonAddress) {
          throw new Error(ERRORS.TOKEN_NOT_CONFIGURED('TON/WTON', network));
        }

        const { allowance, formatted: formattedAllowance } = await getAllowance({
          token: tonAddress,
          account,
          spender: wtonAddress,
          network,
        });

        if (allowance < parseUnits(args.tokenAmount, decimals))
          throw new Error(
            ERRORS.INSUFFICIENT_ALLOWANCE(args.tokenAmount, wtonAddress, formattedAllowance, 'TON'),
          );

        requestTransaction({
          to: wtonAddress,
          data: encodeFunctionData({
            abi: parseAbi(['function swapFromTON(uint256 tonAmount)']),
            functionName: 'swapFromTON',
            args: [parseUnits(args.tokenAmount, decimals)],
          }),
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Sent wrap ${args.tokenAmount} TON tokens to WTON on ${network}`,
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
