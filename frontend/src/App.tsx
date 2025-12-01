import { useEffect, useRef, useState } from 'react';
import { useAccount, useSendTransaction, useChainId } from 'wagmi';
import { useWebSocket } from './hooks/useWebSocket';
import { formatEther, formatUnits, decodeFunctionData, parseAbi } from 'viem';

// 지원하는 함수들의 ABI
const SUPPORTED_ABI = parseAbi([
  'function swapFromTON(uint256 tonAmount)',
  'function approve(address spender, uint256 amount)',
]);

function decodeCalldata(data: string) {
  try {
    const decoded = decodeFunctionData({
      abi: SUPPORTED_ABI,
      data: data as `0x${string}`,
    });
    return decoded;
  } catch {
    return null;
  }
}

interface PendingTransaction {
  to: string;
  value?: string;
  data?: string;
  chainId?: number;
}

function App() {
  const { address, isConnected } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const chainId = useChainId();
  const prevChainIdRef = useRef<number | undefined>();
  const wsUrl = `ws://${window.location.host}/ws`;
  const { sendMessage, lastMessage, isConnected: wsConnected } = useWebSocket(wsUrl);
  const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const getNetworkName = (id: number): string => {
    if (id === 1) return 'mainnet';
    if (id === 11155111) return 'sepolia';
    return `chain-${id}`;
  };

  // Notify server when wallet connects
  useEffect(() => {
    console.log('Wallet effect:', { isConnected, address, wsConnected, chainId });
    if (isConnected && address && wsConnected) {
      console.log('Sending wallet_connected message');
      sendMessage({
        type: 'wallet_connected',
        data: { address, network: getNetworkName(chainId) },
      });
      prevChainIdRef.current = chainId;
    }
  }, [isConnected, address, wsConnected, chainId, sendMessage]);

  // Notify server when network changes
  useEffect(() => {
    if (isConnected && wsConnected && chainId && prevChainIdRef.current !== undefined && prevChainIdRef.current !== chainId) {
      console.log('Network changed:', getNetworkName(chainId));
      sendMessage({
        type: 'network_changed',
        data: { network: getNetworkName(chainId) },
      });
      prevChainIdRef.current = chainId;
    }
  }, [chainId, isConnected, wsConnected, sendMessage]);

  // Handle transaction requests from MCP server
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'sign_tx') {
      setPendingTx({
        to: lastMessage.data.to,
        value: lastMessage.data.value,
        data: lastMessage.data.data,
        chainId: chainId,
      });
    }
  }, [lastMessage]);
  console.log('[PENDING TX]')
  console.log(pendingTx)

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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Tokamak Network MCP Dashboard</h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Wallet Status</h3>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <p className="text-green-400 font-mono text-sm truncate">{address}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
              <p className="text-gray-400">Not connected</p>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">WebSocket Status</h3>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <p className={wsConnected ? 'text-green-400' : 'text-red-400'}>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>

        {pendingTx && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-yellow-500">
            <h3 className="text-lg font-semibold mb-4 text-yellow-400">Transaction Request</h3>
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-sm text-gray-400">To</p>
                <p className="font-mono text-sm break-all">{pendingTx.to}</p>
              </div>
              {pendingTx.value && (
                <div>
                  <p className="text-sm text-gray-400">Value</p>
                  <p className="font-mono text-sm">
                    {formatEther(BigInt(pendingTx.value))} ETH
                  </p>
                </div>
              )}
              {pendingTx.data && (() => {
                const decoded = decodeCalldata(pendingTx.data);
                if (decoded) {
                  return (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-400">Function</p>
                        <p className="font-mono text-sm text-blue-400">{decoded.functionName}</p>
                      </div>
                      {decoded.functionName === 'swapFromTON' && (
                        <div>
                          <p className="text-sm text-gray-400">Amount</p>
                          <p className="font-mono text-sm">{formatUnits(decoded.args[0] as bigint, 18)} TON</p>
                        </div>
                      )}
                      {decoded.functionName === 'approve' && (
                        <>
                          <div>
                            <p className="text-sm text-gray-400">Spender</p>
                            <p className="font-mono text-xs break-all">{decoded.args[0] as string}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Amount</p>
                            <p className="font-mono text-sm">{formatUnits(decoded.args[1] as bigint, 18)}</p>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }
                return (
                  <div>
                    <p className="text-sm text-gray-400">Data</p>
                    <p className="font-mono text-xs break-all text-gray-300">
                      {pendingTx.data.length > 66
                        ? `${pendingTx.data.slice(0, 66)}...`
                        : pendingTx.data}
                    </p>
                  </div>
                );
              })()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={isSigning}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium disabled:opacity-50"
              >
                거부
              </button>
              <button
                onClick={handleSign}
                disabled={isSigning}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-medium disabled:opacity-50"
              >
                {isSigning ? '서명 중...' : '서명하기'}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <appkit-button />
        </div>
      </div>
    </div>
  );
}

export default App;
