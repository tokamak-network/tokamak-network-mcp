import type { Address } from 'viem';
import type { KnownNetwork } from '../constants';
import { ERRORS } from '../errors';
import { getConnectionState } from '../ws';

export type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

export type ConnectionState = {
  address: Address;
  network: KnownNetwork;
};

export async function withConnection<T>(
  handler: (state: ConnectionState) => Promise<T>,
): Promise<ToolResult> {
  try {
    const { connected, address, network } = getConnectionState();
    if (!connected) throw new Error(ERRORS.NO_WALLET_CONNECTED);

    const result = await handler({ address, network });
    return {
      content: [{ type: 'text' as const, text: String(result) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: 'text' as const, text: message }],
      isError: true,
    };
  }
}
