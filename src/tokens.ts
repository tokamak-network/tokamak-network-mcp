import type { Address } from 'viem';
import type { KnownNetwork, KnownToken } from './constants.js';
import { TOKEN_ADDRESSES } from './constants.js';
import { ERRORS } from './errors.js';
import { getChainIdByName } from './utils.js';

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
