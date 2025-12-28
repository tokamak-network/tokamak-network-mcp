export interface PendingTransaction {
  to: string;
  value?: string;
  data?: string;
  chainId?: number;
}

export interface WithdrawalRequest {
  index: bigint;
  withdrawableBlockNumber: bigint;
  amount: bigint;
  processed: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string for JSON serialization
  type: 'tx_request' | 'info';
  txData?: PendingTransaction;
  isRead: boolean;
}
