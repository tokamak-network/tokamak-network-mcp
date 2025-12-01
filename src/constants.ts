export const KNOWN_NETWORKS = ['mainnet', 'sepolia'] as const;
export type KnownNetwork = (typeof KNOWN_NETWORKS)[number];

export const DEFAULT_NETWORK = 'mainnet';
export const KNOWN_TOKENS = [DEFAULT_NETWORK, 'TON', 'WTON'] as const;
export type KnownToken = (typeof KNOWN_TOKENS)[number];

export const TOKEN_ADDRESSES: Record<string, Record<number, `0x${string}`>> = {
  TON: {
    1: '0x2be5e8c109e2197D077D13A82dAead6a9b3433C5',
    11155111: '0xa30fe40285b8f5c0457dbc3b7c8a280373c40044',
  },
  WTON: {
    1: '0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2',
    11155111: '0x79e0d92670106c85e9067b56b8f674340dca0bbd',
  },
};
