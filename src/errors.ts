export const ERRORS = {
  // Wallet
  NO_WALLET_CONNECTED: 'No wallet connected. Please run connect_wallet first.',
  NO_WEBSOCKET_CLIENT: 'No WebSocket client connected',

  // Layer2
  LAYER2_NOT_CONFIGURED: (layer2: string, network: string) =>
    `Layer2 ${layer2} not configured for network ${network}`,

  // Network
  UNKNOWN_NETWORK: (name: string) => `Unknown network: ${name}. Use 'mainnet' or 'sepolia'.`,
  UNSUPPORTED_CHAIN: (id: number) => `Unsupported chain: ${id}`,

  // Token
  TOKEN_NOT_CONFIGURED: (token: string, network: string) =>
    `Token ${token} not configured for network ${network}`,
  UNKNOWN_TOKEN: (token: string) =>
    `Unknown token: ${token}. Use a contract address instead of token name.`,
  INSUFFICIENT_BALANCE: (balance: string, symbol: string) =>
    `Not enough ${symbol} tokens. Balance: ${balance} ${symbol}`,
  INSUFFICIENT_ALLOWANCE: (amount: string, spender: string, allowance: string, symbol: string) =>
    `Not enough ${symbol} tokens. Allowance: ${allowance} ${symbol}. Please approve ${amount} ${symbol} to ${spender}(current allowance: ${allowance})`,
  // Transaction
  TX_TIMEOUT: 'Transaction request timed out',
  TX_FAILED: (message: string) => `Transaction failed: ${message}`,
} as const;
