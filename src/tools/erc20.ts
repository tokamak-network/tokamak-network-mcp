import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Address } from 'viem';
import { encodeFunctionData, isAddress, parseAbi, parseUnits } from 'viem';
import { z } from 'zod';
import { getTokenBalance } from '../actions';
import { KNOWN_NETWORKS, KNOWN_TOKENS } from '../constants';
import { ERRORS } from '../errors';
import { getTokenAddress } from '../tokens';
import { requestTransaction } from '../transaction';
import { withConnection } from './helper';

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
      return withConnection(async ({ address, network }) => {
        const { formatted, symbol } = await getTokenBalance({
          token: args.token,
          account: address,
          network,
        });

        return `Balance: ${formatted} ${symbol}`;
      });
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
      return withConnection(async ({ address: account, network: connectedNetwork }) => {
        const network = args.network ?? connectedNetwork;

        const tokenAddress = getTokenAddress(args.token, network);
        if (!tokenAddress) {
          throw new Error(ERRORS.TOKEN_NOT_CONFIGURED(args.token, network));
        }

        const { decimals } = await getTokenBalance({
          token: args.token,
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

        return `Sent approve ${args.amount} ${args.token} to ${args.spender} on ${network}`;
      });
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
      return withConnection(async ({ address: account, network }) => {
        const tokenAddress = getTokenAddress(args.token, network);
        if (!tokenAddress) {
          throw new Error(ERRORS.TOKEN_NOT_CONFIGURED(args.token, network));
        }

        const { balance, formatted, decimals } = await getTokenBalance({
          token: args.token,
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

        return `Sent transfer ${args.amount} ${args.token} to ${args.to} on ${network}`;
      });
    },
  );
}
