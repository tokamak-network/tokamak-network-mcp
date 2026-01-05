import { useState, useEffect, useRef } from 'react';
import { formatUnits, encodeFunctionData } from 'viem';
import { useReadContracts } from 'wagmi';
import { OPERATORS } from '../../constants';
import { LAYER2_ABI } from '../../constants/abis';
import { useLanguage } from '../../i18n';
import type { AppProps } from '../../types/app';

export function Layer2App({ onRequestTransaction, onClose, isConnected, chainId }: AppProps) {
  const { t } = useLanguage();

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const network = chainId === 1 ? 'mainnet' : 'sepolia';
  const operators = OPERATORS[network];

  // Build contract calls for all operators
  const contracts = operators.flatMap(op => [
    {
      address: op.address as `0x${string}`,
      abi: LAYER2_ABI,
      functionName: 'totalStaked',
    },
    {
      address: op.address as `0x${string}`,
      abi: LAYER2_ABI,
      functionName: 'operator',
    },
  ]);

  const { data, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: isConnected && !!chainId,
      refetchInterval: 30000,
    },
  });

  // Parse data into layer2 info and sort by totalStaked (descending)
  const layer2Data = operators
    .map((op, index) => {
      const totalStakedResult = data?.[index * 2];
      const operatorResult = data?.[index * 2 + 1];

      return {
        name: op.name,
        address: op.address,
        totalStaked: totalStakedResult?.status === 'success' ? (totalStakedResult.result as bigint) : undefined,
        operator: operatorResult?.status === 'success' ? (operatorResult.result as `0x${string}`) : undefined,
      };
    })
    .sort((a, b) => {
      if (a.totalStaked === undefined && b.totalStaked === undefined) return 0;
      if (a.totalStaked === undefined) return 1;
      if (b.totalStaked === undefined) return -1;
      return b.totalStaked > a.totalStaked ? 1 : b.totalStaked < a.totalStaked ? -1 : 0;
    });

  // Drag handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleUpdateSeigniorage = (layer2Address: string) => {
    if (!chainId) return;

    const calldata = encodeFunctionData({
      abi: LAYER2_ABI,
      functionName: 'updateSeigniorage',
    });

    onRequestTransaction({
      to: layer2Address,
      data: calldata,
      chainId,
    });
  };

  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-700 rounded ${className}`} />
  );

  const formatTotalStaked = (amount: bigint | undefined) => {
    if (amount === undefined) return '—';
    const formatted = formatUnits(amount, 27);
    const num = parseFloat(formatted);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getEtherscanUrl = (address: string) => {
    const baseUrl = chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io';
    return `${baseUrl}/address/${address}`;
  };

  const openEtherscan = (address: string) => {
    window.open(getEtherscanUrl(address), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className="relative w-full max-w-md animate-fade-in pointer-events-auto"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <div className="bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-white/10">
          {/* Window Title Bar */}
          <div
            className="bg-gray-900/60 px-4 py-3 flex items-center border-b border-white/10 cursor-move select-none"
            onMouseDown={handleDragStart}
          >
            <button
              onClick={onClose}
              onMouseDown={(e) => e.stopPropagation()}
              className="group w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium text-white/60">{t('layer2.title')}</span>
            </div>
            <div className="w-3" />
          </div>

          {/* Window Content */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center border border-white/20">
                <img src="/layer2.svg" alt="Layer2" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('layer2.title')}</h3>
                <p className="text-sm text-gray-400">{t('layer2.subtitle')}</p>
              </div>
            </div>

            {!isConnected ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                <p className="text-yellow-400 text-sm">{t('layer2.connectWallet')}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {layer2Data.map((layer2) => (
                  <div
                    key={layer2.name}
                    className="bg-gray-900/50 rounded-lg p-3 space-y-2"
                  >
                    {/* Header: Name + Update Button */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => openEtherscan(layer2.address)}
                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition-colors group"
                      >
                        <span>{layer2.name}</span>
                        <svg className="w-3 h-3 text-gray-500 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleUpdateSeigniorage(layer2.address)}
                        className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium rounded transition-colors"
                      >
                        {t('layer2.updateSeigniorage')}
                      </button>
                    </div>

                    {/* Total Staked */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{t('layer2.totalStaked')}</span>
                      {isLoading ? (
                        <Skeleton className="w-20 h-4" />
                      ) : (
                        <span className="text-white font-medium">{formatTotalStaked(layer2.totalStaked)} TON</span>
                      )}
                    </div>

                    {/* Operator */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{t('layer2.operator')}</span>
                      {isLoading ? (
                        <Skeleton className="w-24 h-4" />
                      ) : layer2.operator ? (
                        <button
                          onClick={() => openEtherscan(layer2.operator!)}
                          className="flex items-center gap-1 text-gray-300 hover:text-blue-400 font-mono text-xs transition-colors group"
                        >
                          <span>{shortenAddress(layer2.operator)}</span>
                          <svg className="w-3 h-3 text-gray-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
