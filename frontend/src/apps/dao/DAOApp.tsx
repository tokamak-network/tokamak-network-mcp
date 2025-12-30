import { useState, useEffect, useRef } from 'react';
import { useReadContracts } from 'wagmi';
import type { ContractFunctionReturnType } from 'viem';
import { CONTRACTS, AGENDA_MANAGER_ABI } from '../../constants';
import { useLanguage } from '../../i18n';
import type { AppProps } from '../../types/app';

// Agenda status enum (from contract)
const AGENDA_STATUS = ['None', 'Notice', 'Voting', 'WaitingExecution', 'Executed', 'Ended'] as const;
const AGENDA_RESULT = ['Pending', 'Accept', 'Reject', 'Dismiss'] as const;

interface AgendaMetadata {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  discourseUrl: string;
  transaction: string;
}

// Type inferred from AGENDA_MANAGER_ABI agendas() return value
type AgendaOnChain = ContractFunctionReturnType<typeof AGENDA_MANAGER_ABI, 'view', 'agendas'>;

const GITHUB_AGENDAS_BASE_URL = 'https://api.github.com/repos/tokamak-network/dao-agenda-metadata-repository/contents/data/agendas';

export function DAOApp({ onClose, chainId }: AppProps) {
  const { t } = useLanguage();
  const [agendaMetadata, setAgendaMetadata] = useState<AgendaMetadata[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [selectedAgenda, setSelectedAgenda] = useState<number | null>(null);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const network = chainId === 1 ? 'mainnet' : 'sepolia';
  const agendaManagerAddress = CONTRACTS[network].agendaManager as `0x${string}`;

  // Fetch agenda metadata from GitHub (parallel fetch with Promise.all)
  useEffect(() => {
    const fetchAgendas = async () => {
      setIsLoadingMetadata(true);
      try {
        const githubUrl = `${GITHUB_AGENDAS_BASE_URL}/${network}`;
        const res = await fetch(githubUrl);
        const files = await res.json();

        // Filter JSON files and fetch all in parallel
        const jsonFiles = files.filter((file: { name: string }) => file.name.endsWith('.json'));
        const agendaPromises = jsonFiles.map(async (file: { download_url: string }) => {
          const contentRes = await fetch(file.download_url);
          return contentRes.json();
        });

        const contents = await Promise.all(agendaPromises);
        const agendas: AgendaMetadata[] = contents.map((content) => ({
          id: content.id,
          title: content.title,
          description: content.description,
          createdAt: content.createdAt,
          discourseUrl: content.discourseUrl,
          transaction: content.transaction,
        }));

        // Sort by id descending (newest first)
        agendas.sort((a, b) => b.id - a.id);
        setAgendaMetadata(agendas);
      } catch (err) {
        console.error('Failed to fetch agendas:', err);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    fetchAgendas();
  }, [network]);

  // Fetch on-chain data for all agendas
  const { data: onChainData, isLoading: isLoadingOnChain } = useReadContracts({
    contracts: agendaMetadata.map(agenda => ({
      address: agendaManagerAddress,
      abi: AGENDA_MANAGER_ABI,
      functionName: 'agendas',
      args: [BigInt(agenda.id)],
      chainId: chainId === 1 ? 1 : 11155111,
    })),
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

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-yellow-500/20 text-yellow-400'; // Notice
      case 2: return 'bg-blue-500/20 text-blue-400'; // Voting
      case 3: return 'bg-purple-500/20 text-purple-400'; // WaitingExecution
      case 4: return 'bg-green-500/20 text-green-400'; // Executed
      case 5: return 'bg-gray-500/20 text-gray-400'; // Ended
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getResultColor = (result: number) => {
    switch (result) {
      case 1: return 'text-green-400'; // Accept
      case 2: return 'text-red-400'; // Reject
      case 3: return 'text-gray-400'; // Dismiss
      default: return 'text-gray-500'; // Pending
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEtherscanUrl = (txHash: string) => {
    const baseUrl = chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  };

  const isLoading = isLoadingMetadata || isLoadingOnChain;

  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-700 rounded ${className}`} />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className="relative w-full max-w-lg animate-fade-in pointer-events-auto"
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
              <span className="text-sm font-medium text-white/60">{t('dao.title')}</span>
            </div>
            <div className="w-3" />
          </div>

          {/* Window Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center border border-white/20">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('dao.title')}</h3>
                <p className="text-sm text-gray-400">{t('dao.subtitle')}</p>
              </div>
            </div>

            {/* Agenda List */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : agendaMetadata.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{t('dao.noAgendas')}</div>
              ) : (
                agendaMetadata.map((agenda, idx) => {
                  const onChain = onChainData?.[idx]?.result as AgendaOnChain | undefined;
                  const status = onChain ? Number(onChain.status) : 0;
                  const result = onChain ? Number(onChain.result) : 0;
                  const isExpanded = selectedAgenda === agenda.id;

                  return (
                    <div
                      key={agenda.id}
                      className="bg-gray-900/50 rounded-lg border border-white/5 overflow-hidden"
                    >
                      <button
                        onClick={() => setSelectedAgenda(isExpanded ? null : agenda.id)}
                        className="w-full p-3 text-left hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">#{agenda.id}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(status)}`}>
                                {AGENDA_STATUS[status]}
                              </span>
                            </div>
                            <h4 className="text-sm font-medium text-white truncate mt-1">{agenda.title}</h4>
                          </div>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isExpanded && onChain && (
                        <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
                          {/* Created At */}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(agenda.createdAt)}
                          </div>

                          {/* Description */}
                          <p className="text-xs text-gray-400">{agenda.description}</p>

                          {/* Voting Results */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-green-500/10 rounded p-2">
                              <div className="text-xs text-gray-400">{t('dao.yes')}</div>
                              <div className="text-sm font-medium text-green-400">{Number(onChain.countingYes)}</div>
                            </div>
                            <div className="bg-red-500/10 rounded p-2">
                              <div className="text-xs text-gray-400">{t('dao.no')}</div>
                              <div className="text-sm font-medium text-red-400">{Number(onChain.countingNo)}</div>
                            </div>
                            <div className="bg-gray-500/10 rounded p-2">
                              <div className="text-xs text-gray-400">{t('dao.abstain')}</div>
                              <div className="text-sm font-medium text-gray-400">{Number(onChain.countingAbstain)}</div>
                            </div>
                          </div>

                          {/* Result */}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">{t('dao.result')}:</span>
                            <span className={`font-medium ${getResultColor(result)}`}>
                              {AGENDA_RESULT[result]}
                            </span>
                          </div>

                          {/* Links */}
                          <div className="flex items-center justify-center gap-3 pt-1">
                            {agenda.transaction && (
                              <a
                                href={getEtherscanUrl(agenda.transaction)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                {t('dao.viewTransaction')} &rarr;
                              </a>
                            )}
                            {agenda.discourseUrl && (
                              <a
                                href={agenda.discourseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                {t('dao.viewDiscussion')} &rarr;
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
