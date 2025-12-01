import type { Address } from 'viem';
import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { ERRORS } from '../errors';

function getChain(network: string) {
  if (network === 'mainnet') return mainnet;
  if (network === 'sepolia') return sepolia;
  throw new Error(ERRORS.UNKNOWN_NETWORK(network));
}

export interface WithdrawalRequest {
  withdrawableBlockNumber: bigint;
  amount: bigint;
  processed: boolean;
}

const DEPOSIT_MANAGER_ABI = parseAbi([
  'function withdrawalRequestIndex(address layer2, address account) view returns (uint256)',
  'function numRequests(address layer2, address account) view returns (uint256)',
  'function withdrawalRequest(address layer2, address account, uint256 index) view returns (uint128 withdrawableBlockNumber, uint128 amount, bool processed)',
]);

export async function getPendingWithdrawalRequests({
  depositManager,
  layer2,
  account,
  network,
}: {
  depositManager: Address;
  layer2: Address;
  account: Address;
  network: string;
}): Promise<WithdrawalRequest[]> {
  const chain = getChain(network);
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  // Get withdrawal request index and total count
  const [withdrawalRequestIndex, numRequests] = await Promise.all([
    client.readContract({
      address: depositManager,
      abi: DEPOSIT_MANAGER_ABI,
      functionName: 'withdrawalRequestIndex',
      args: [layer2, account],
    }),
    client.readContract({
      address: depositManager,
      abi: DEPOSIT_MANAGER_ABI,
      functionName: 'numRequests',
      args: [layer2, account],
    }),
  ]);

  const requestCount = Number(numRequests - withdrawalRequestIndex);
  if (requestCount <= 0) return [];

  // Fetch all pending requests
  const pendingRequests: WithdrawalRequest[] = [];

  for (let i = 0; i < requestCount; i++) {
    const [withdrawableBlockNumber, amount, processed] = await client.readContract({
      address: depositManager,
      abi: DEPOSIT_MANAGER_ABI,
      functionName: 'withdrawalRequest',
      args: [layer2, account, withdrawalRequestIndex + BigInt(i)],
    });

    // Only include non-zero, unprocessed requests
    if (amount !== 0n && !processed) {
      pendingRequests.push({
        withdrawableBlockNumber,
        amount,
        processed,
      });
    }
  }

  return pendingRequests;
}

export async function getCurrentBlockNumber(network: string): Promise<bigint> {
  const chain = getChain(network);
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  return client.getBlockNumber();
}
