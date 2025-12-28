import type { Address } from 'viem';
import { createPublicClient, http, parseAbi } from 'viem';
import { getChainByName } from '../utils';

export async function getStakedBalance({
  seigManager,
  account,
  network,
  operator,
}: {
  seigManager: Address;
  account: Address;
  network: string;
  operator: Address;
}) {
  const chain = getChainByName(network);
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  return client.readContract({
    address: seigManager,
    abi: parseAbi(['function stakeOf(address,address) view returns (uint256)']),
    functionName: 'stakeOf',
    args: [operator, account],
  });
}
