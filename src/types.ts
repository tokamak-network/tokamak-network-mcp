import type { Address, Hash, Hex } from 'viem';

export interface TransactionData {
  to: Address;
  data?: Hex;
  value?: bigint;
}

export type WalletMessage =
  | { type: 'wallet_connected'; data: { address: Address; network: string } }
  | { type: 'tx_result'; data: { hash: Hash } }
  | { type: 'sign_tx'; data: TransactionData }
  | { type: 'network_changed'; data: { network: string } };
