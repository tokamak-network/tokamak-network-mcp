import type { Address } from 'viem';
import { createPublicClient, formatEther, formatUnits, http, isAddress, parseAbi } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { ERRORS } from '../errors';
import { getTokenAddress } from '../tokens';
import { isKnownToken } from '../utils';
import { getAccount, getNetwork } from '../ws';

function getChainIdByName(name: string): number {
  if (name === 'mainnet') return 1;
  if (name === 'sepolia') return 11155111;
  throw new Error(ERRORS.UNKNOWN_NETWORK(name));
}

function getChain(id: number) {
  if (id === 1) return mainnet;
  if (id === 11155111) return sepolia;
  throw new Error(ERRORS.UNSUPPORTED_CHAIN(id));
}

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
  const chain = getChain(getChainIdByName(network));
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
