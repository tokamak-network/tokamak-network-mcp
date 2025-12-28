import { useState } from 'react';
import { useSendTransaction } from 'wagmi';
import type { PendingTransaction } from '../types';

interface UseTransactionRequestOptions {
  sendMessage: (message: { type: string; data: unknown }) => void;
}

export function useTransactionRequest({ sendMessage }: UseTransactionRequestOptions) {
  const { sendTransactionAsync } = useSendTransaction();
  const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const handleSign = async () => {
    if (!pendingTx) return;

    setIsSigning(true);
    try {
      const hash = await sendTransactionAsync({
        to: pendingTx.to as `0x${string}`,
        value: pendingTx.value ? BigInt(pendingTx.value) : undefined,
        data: pendingTx.data as `0x${string}` | undefined,
        chainId: pendingTx.chainId,
      });

      sendMessage({
        type: 'tx_result',
        data: { hash },
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      sendMessage({
        type: 'tx_result',
        data: { error: (error as Error).message },
      });
    } finally {
      setPendingTx(null);
      setIsSigning(false);
    }
  };

  const handleReject = () => {
    sendMessage({
      type: 'tx_result',
      data: { error: 'User rejected the transaction' },
    });
    setPendingTx(null);
  };

  return {
    pendingTx,
    setPendingTx,
    isSigning,
    handleSign,
    handleReject,
  };
}
