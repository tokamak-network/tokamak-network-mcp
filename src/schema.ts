import { z } from 'zod';
import { DEFAULT_NETWORK, KNOWN_NETWORKS, KNOWN_TOKENS } from './constants';

export const NETWORK_SCHEMA = z
  .enum(KNOWN_NETWORKS)
  .optional()
  .describe(`Network name (${KNOWN_NETWORKS.join(', ')}). Default: ${DEFAULT_NETWORK}`);

export const TOKEN_SCHEMA = z
  .string()
  .describe(`Token symbol (${KNOWN_TOKENS.join(', ')}) or contract address (0x...)`);
