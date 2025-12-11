import type { KnownToken } from './constants';
import { CONTRACT_ADDRESSES, KNOWN_TOKENS } from './constants';
import { ERRORS } from './errors';
import { mainnet, sepolia } from 'viem/chains';

export function isKnownToken(token: string): token is KnownToken {
  return KNOWN_TOKENS.includes(token as KnownToken);
}

export function getChainIdByName(name: string): 1 | 11155111 {
  if (name === 'mainnet') return 1;
  if (name === 'sepolia') return 11155111;
  throw new Error(ERRORS.UNKNOWN_NETWORK(name));
}

export function getNetworkAddresses(network: string) {
  return (
    CONTRACT_ADDRESSES[network as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES.mainnet
  );
}

export function getChainById(id: number) {
  if (id === 1) return mainnet;
  if (id === 11155111) return sepolia;
  throw new Error(ERRORS.UNSUPPORTED_CHAIN(id));
}

export function getChainByName(name: string) {
  return getChainById(getChainIdByName(name));
}
