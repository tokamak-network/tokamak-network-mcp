import type { Address } from 'viem';
import { createPublicClient, formatUnits, http } from 'viem';
import { TOKEN_DECIMALS } from '../constants';
import { ERRORS } from '../errors';
import { getTokenAddress } from '../tokens';
import { getChainById, getChainIdByName, isKnownToken } from '../utils';
import { getAccount, getNetwork } from '../ws';

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export async function getAllowance({
  token,
  account,
  spender,
  network,
}: {
  token: string;
  account: Address;
  spender: Address;
  network?: string;
}) {
  const address = account || getAccount();
  if (!address) {
    throw new Error(ERRORS.NO_WALLET_CONNECTED);
  }

  if (!isKnownToken(token)) {
    throw new Error(ERRORS.UNKNOWN_TOKEN(token));
  }

  const networkChainId = getChainIdByName(network ?? getNetwork() ?? 'mainnet');
  const chain = getChainById(networkChainId);
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  const tokenAddress = getTokenAddress(token, getNetwork() ?? 'mainnet');
  if (!tokenAddress) throw new Error(ERRORS.TOKEN_NOT_CONFIGURED(token, network ?? 'mainnet'));

  const decimals = TOKEN_DECIMALS[token];

  const allowance = await client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [account, spender],
  });

  return {
    allowance,
    formatted: formatUnits(allowance, decimals),
    decimals,
  };
}

export async function getTokenBalance({
  token,
  account,
  network,
}: {
  token: string;
  account: Address;
  network: string;
}): Promise<{ balance: bigint; formatted: string; decimals: number; symbol: string }> {
  if (!isKnownToken(token)) {
    throw new Error(ERRORS.UNKNOWN_TOKEN(token));
  }

  const chain = getChainById(getChainIdByName(network));
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  const tokenAddress = getTokenAddress(token, getNetwork() ?? 'mainnet');
  if (!tokenAddress) {
    throw new Error(ERRORS.TOKEN_NOT_CONFIGURED(token, network ?? 'mainnet'));
  }

  const decimals = TOKEN_DECIMALS[token];

  const balance = await client.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account],
  });

  return {
    balance,
    formatted: formatUnits(balance, decimals),
    decimals,
    symbol: token,
  };
}
