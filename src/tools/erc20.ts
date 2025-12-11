import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Address } from 'viem';
import { encodeFunctionData, isAddress, parseAbi, parseUnits } from 'viem';
import { z } from 'zod';
import { getTokenBalance } from '../actions';
import { KNOWN_NETWORKS, KNOWN_TOKENS } from '../constants';
import { ERRORS } from '../errors';
import { getTokenAddress } from '../tokens';
import { requestTransaction } from '../transaction';
import { getConnectionState } from '../ws';

export function registerErc20Tools(server: McpServer) {
  const getTokenBalanceSchema = {
    token: z
      .enum(KNOWN_TOKENS)
      .optional()
      .default('TON')
      .describe(`Token symbol (${KNOWN_TOKENS.join(', ')})`),
  };

  server.registerTool(
    'get_token_balance',
    {
      description: `Get token balance. Supports ${KNOWN_TOKENS.join(', ')}.`,
      inputSchema: getTokenBalanceSchema,
    },
    async (args: z.infer<z.ZodObject<typeof getTokenBalanceSchema>>) => {
      try {
        const { connected, address, network } = getConnectionState();
        if (!connected) {
          throw new Error(ERRORS.NO_WALLET_CONNECTED);
        }

        const { formatted, symbol } = await getTokenBalance({
          tokenNameOrAddress: args.token,
          account: address,
          network,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Balance: ${formatted} ${symbol}`,
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

  const approveTokenSchema = {
    token: z.enum(KNOWN_TOKENS).describe(`Token symbol (${KNOWN_TOKENS.join(', ')})`),
    spender: z
      .custom<Address>((v) => typeof v === 'string' && isAddress(v))
      .describe('Address to approve'),
    amount: z.string().describe('Amount to approve (in token units)'),
    network: z
      .enum(KNOWN_NETWORKS)
      .optional()
      .describe(`Network name (${KNOWN_NETWORKS.join(', ')}). Default: ${KNOWN_NETWORKS[0]}`),
  };

  server.registerTool(
    'approve_token',
    {
      title: 'Approve token spending',
      description: 'Approve a spender address to spend tokens on your behalf',
      inputSchema: approveTokenSchema,
    },
    async (args: z.infer<z.ZodObject<typeof approveTokenSchema>>) => {
      try {
        const { connected, address: account, network: connectedNetwork } = getConnectionState();
        if (!connected) throw new Error(ERRORS.NO_WALLET_CONNECTED);
        const network = args.network ?? connectedNetwork;

        const tokenAddress = getTokenAddress(args.token, network);
        if (!tokenAddress) {
          throw new Error(ERRORS.TOKEN_NOT_CONFIGURED(args.token, network));
        }

        // Get decimals for the token
        const { decimals } = await getTokenBalance({
          tokenNameOrAddress: args.token,
          account,
          network,
        });

        const data = encodeFunctionData({
          abi: parseAbi(['function approve(address spender, uint256 amount) returns (bool)']),
          functionName: 'approve',
          args: [args.spender, parseUnits(args.amount, decimals)],
        });

        requestTransaction({
          to: tokenAddress,
          data,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Sent approve ${args.amount} ${args.token} to ${args.spender} on ${network}`,
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

  const transferTokenSchema = {
    token: z.enum(KNOWN_TOKENS).describe(`Token symbol (${KNOWN_TOKENS.join(', ')})`),
    to: z
      .custom<Address>((v) => typeof v === 'string' && isAddress(v))
      .describe('Recipient address'),
    amount: z.string().describe('Amount to transfer (in token units)'),
  };

  server.registerTool(
    'transfer_token',
    {
      title: 'Transfer tokens',
      description: 'Transfer tokens to a specified address',
      inputSchema: transferTokenSchema,
    },
    async (args: z.infer<z.ZodObject<typeof transferTokenSchema>>) => {
      try {
        const { connected, address: account, network } = getConnectionState();
        if (!connected) throw new Error(ERRORS.NO_WALLET_CONNECTED);

        const tokenAddress = getTokenAddress(args.token, network);
        if (!tokenAddress) {
          throw new Error(ERRORS.TOKEN_NOT_CONFIGURED(args.token, network));
        }

        const { balance, formatted, decimals } = await getTokenBalance({
          tokenNameOrAddress: args.token,
          account,
          network,
        });

        const transferAmount = parseUnits(args.amount, decimals);
        if (balance < transferAmount) {
          throw new Error(ERRORS.INSUFFICIENT_BALANCE(formatted, args.token));
        }

        const data = encodeFunctionData({
          abi: parseAbi(['function transfer(address to, uint256 amount) returns (bool)']),
          functionName: 'transfer',
          args: [args.to, transferAmount],
        });

        requestTransaction({
          to: tokenAddress,
          data,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Sent transfer ${args.amount} ${args.token} to ${args.to} on ${network}`,
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
