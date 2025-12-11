import type { Address } from 'viem';
import { createPublicClient, formatEther, formatUnits, http, isAddress } from 'viem';
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
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
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

  const networkChainId = getChainIdByName(network ?? getNetwork() ?? 'mainnet');
  const chain = getChainById(networkChainId);
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  let tokenAddress: Address;
  if (isKnownToken(token)) {
    const addr = getTokenAddress(token, getNetwork() ?? 'mainnet');
    if (!addr) throw new Error(ERRORS.TOKEN_NOT_CONFIGURED(token, network ?? 'mainnet'));

    tokenAddress = addr;
  } else if (token.startsWith('0x')) {
    tokenAddress = token as Address;
  } else {
    throw new Error(ERRORS.UNKNOWN_TOKEN(token));
  }

  const [allowance, decimals] = await Promise.all([
    client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account, spender],
    }),
    client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
    }),
  ]);

  return {
    allowance,
    formatted: formatUnits(allowance, decimals),
    decimals,
  };
}

export async function getTokenBalance({
  tokenNameOrAddress,
  account,
  network,
}: {
  tokenNameOrAddress: Address | string;
  account: Address;
  network: string;
}): Promise<{ balance: bigint; formatted: string; decimals: number; symbol: string }> {
  const chain = getChainById(getChainIdByName(network));
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  if (tokenNameOrAddress === 'ETH') {
    const balance = await client.getBalance({
      address: account,
    });
    return {
      balance,
      formatted: formatEther(balance),
      decimals: 18,
      symbol: 'ETH',
    };
  }

  let tokenAddress: Address;
  if (isKnownToken(tokenNameOrAddress)) {
    const addr = getTokenAddress(tokenNameOrAddress, getNetwork() ?? 'mainnet');
    if (!addr) {
      throw new Error(ERRORS.TOKEN_NOT_CONFIGURED(tokenNameOrAddress, network ?? 'mainnet'));
    }
    tokenAddress = addr;
  } else if (isAddress(tokenNameOrAddress)) {
    tokenAddress = tokenNameOrAddress;
  } else {
    throw new Error(ERRORS.UNKNOWN_TOKEN(tokenNameOrAddress));
  }

  const [balance, decimals] = await client.multicall({
    contracts: [
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [account],
      },
      {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'decimals',
      },
    ],
    allowFailure: false,
  });

  return {
    balance: balance,
    formatted: formatUnits(balance, decimals),
    decimals,
    symbol: isKnownToken(tokenNameOrAddress)
      ? tokenNameOrAddress
      : `${tokenAddress.slice(0, 10)}...`,
  };
}
