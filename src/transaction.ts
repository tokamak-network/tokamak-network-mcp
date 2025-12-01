import type { Address, Hex } from 'viem';
import { ERRORS } from './errors';
import { getAccount, getWsClient } from './ws';

type TransactionData = {
  to: Address;
  value?: bigint;
  data?: Hex;
};

interface WalletMessage {
  type: 'sign_tx' | 'tx_result' | 'wallet_connected' | 'network_changed';
  data?: TransactionData;
}

export function requestTransaction({ to, value, data }: TransactionData) {
  const wsClient = getWsClient();
  const walletAddress = getAccount();

  if (!wsClient) throw new Error(ERRORS.NO_WEBSOCKET_CLIENT);
  if (!walletAddress) throw new Error(ERRORS.NO_WALLET_CONNECTED);

  const message: WalletMessage = {
    type: 'sign_tx',
    data: { to, value, data },
  };

  wsClient.send(JSON.stringify(message));
}
