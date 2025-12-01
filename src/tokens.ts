import type { Address } from 'viem';
import type { KnownNetwork, KnownToken } from './constants';
import { TOKEN_ADDRESSES } from './constants';
import { ERRORS } from './errors';
import { getChainIdByName } from './utils';

export function getTokenAddress(token: KnownToken, network: KnownNetwork): Address;
export function getTokenAddress(token: 'ETH', network: KnownNetwork): null;
export function getTokenAddress(token: string, network: KnownNetwork): Address | null;
export function getTokenAddress(token: string, network: KnownNetwork): Address | null {
  if (token === 'ETH') {
    return null; // native token
  }

  const addresses = TOKEN_ADDRESSES[token];
  if (!addresses) throw new Error(ERRORS.UNKNOWN_TOKEN(token));

  const chainId = getChainIdByName(network);
  if (!addresses[chainId]) throw new Error(ERRORS.UNSUPPORTED_CHAIN(chainId));

  return addresses[chainId];
}
