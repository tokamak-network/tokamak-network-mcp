import type { KnownToken } from './constants.js';
import { KNOWN_TOKENS } from './constants.js';
import { ERRORS } from './errors.js';

export function isKnownToken(token: string): token is KnownToken {
  return KNOWN_TOKENS.includes(token as KnownToken);
}

export function getChainIdByName(name: string): 1 | 11155111 {
  if (name === 'mainnet') return 1;
  if (name === 'sepolia') return 11155111;
  throw new Error(ERRORS.UNKNOWN_NETWORK(name));
}
