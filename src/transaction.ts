import { ERRORS } from './errors';
import type { TransactionData, WalletMessage } from './types';
import { getAccount, getWsClient } from './ws';

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
