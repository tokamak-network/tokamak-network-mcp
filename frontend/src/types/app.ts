import type { PendingTransaction } from './index';

export interface AppProps {
  onRequestTransaction: (tx: PendingTransaction) => void;
  onClose: () => void;
  isConnected: boolean;
  chainId?: number;
  address?: `0x${string}`;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<AppProps>;
}
