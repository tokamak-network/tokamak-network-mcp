import { useEffect, useRef, useState } from 'react';
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi';
import { formatEther, formatUnits, decodeAbiParameters } from 'viem';
import type { PendingTransaction, Notification } from './types';
import { getNetworkName, formatTime, decodeCalldata } from './utils';
import { useWebSocket } from './hooks';
import { APPS } from './apps';

const STORAGE_KEY = 'tokamak_notifications';

const loadNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

function App() {
  const { address, isConnected, chain } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const chainId = chain?.id;
  const { switchChain } = useSwitchChain();
  const prevChainIdRef = useRef<number | undefined>();
  const wsUrl = `ws://${window.location.host}/ws`;
  const { sendMessage, lastMessage, isConnected: wsConnected } = useWebSocket(wsUrl);
  const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => loadNotifications());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [openApps, setOpenApps] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const txRequestRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const networkMenuRef = useRef<HTMLDivElement>(null);
  const walletMenuRef = useRef<HTMLDivElement>(null);

  const openApp = (appId: string) => {
    if (!openApps.includes(appId)) {
      setOpenApps([...openApps, appId]);
    }
  };

  const closeApp = (appId: string) => {
    setOpenApps(openApps.filter(id => id !== appId));
  };

  const handleAppTransaction = (tx: PendingTransaction) => {
    setPendingTx(tx);
  };

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  // Notify server when wallet connects
  useEffect(() => {
    if (isConnected && address && wsConnected && chainId) {
      sendMessage({
        type: 'wallet_connected',
        data: { address, network: getNetworkName(chainId) },
      });
      prevChainIdRef.current = chainId;
    }
  }, [isConnected, address, wsConnected, chainId, sendMessage]);

  // Handle transaction requests from MCP server
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'sign_tx') {
      const txData: PendingTransaction = {
        to: lastMessage.data.to,
        value: lastMessage.data.value,
        data: lastMessage.data.data,
        chainId: chainId,
      };
      setPendingTx(txData);

      const newNotification: Notification = {
        id: Date.now().toString(),
        title: 'Transaction Request',
        message: `New transaction to ${lastMessage.data.to.slice(0, 8)}...`,
        timestamp: new Date().toISOString(),
        type: 'tx_request',
        txData: txData,
        isRead: false,
      };
      setNotifications(prev => [newNotification, ...prev]);
      setShowNotifications(true);
    }
  }, [lastMessage, chainId]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'tx_request' && notification.txData) {
      setPendingTx(notification.txData);
    }
    // Mark as read instead of deleting
    setNotifications(prev => prev.map(n =>
      n.id === notification.id ? { ...n, isRead: true } : n
    ));
    setShowNotifications(false);
  };

  const removeNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering click on parent
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleClickOutside = (e: React.MouseEvent) => {
    const target = e.target as Node;
    // Don't close if click was inside any panel
    if (notificationPanelRef.current?.contains(target)) return;
    if (networkMenuRef.current?.contains(target)) return;
    if (walletMenuRef.current?.contains(target)) return;

    setShowWalletMenu(false);
    setShowNotifications(false);
    setShowNetworkMenu(false);
  };

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
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-macos-desktop">
      {/* macOS Menu Bar */}
      <div className="h-7 bg-black/20 backdrop-blur-2xl flex items-center justify-between px-4 text-white/90 text-[13px] font-medium shrink-0 relative z-50">
        {/* Left side - App name */}
        <div className="flex items-center gap-5">
          {/* Tokamak Logo */}
          <button
            onClick={() => setShowAboutModal(true)}
            className="hover:bg-white/10 px-2 py-0.5 rounded"
          >
            <img src="/tokamak.svg" alt="Tokamak" className="w-4 h-4" />
          </button>
          <span className="font-semibold">Tokamak Network MCP</span>
        </div>

        {/* Right side - System icons */}
        <div className="flex items-center gap-1">
          {/* Network Selector */}
          {isConnected && (
            <div className="relative">
              <button
                onClick={() => setShowNetworkMenu(!showNetworkMenu)}
                className="flex items-center gap-1 text-xs text-white/70 px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded capitalize transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-400" />
                {chainId ? getNetworkName(chainId) : 'Unknown'}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Network Dropdown */}
              {showNetworkMenu && (
                <div
                  ref={networkMenuRef}
                  className="absolute top-7 right-0 w-48 bg-gray-800/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 overflow-hidden z-50"
                >
                  <div className="p-2 border-b border-white/10">
                    <p className="text-xs text-gray-400 px-2">Select Network</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        if (chainId !== 1) {
                          switchChain({ chainId: 1 });
                        }
                        setShowNetworkMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm hover:bg-white/10 transition-colors ${chainId === 1 ? 'bg-white/5' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${chainId === 1 ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span>Ethereum</span>
                      {chainId === 1 && <svg className="w-4 h-4 ml-auto text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                    </button>
                    <button
                      onClick={() => {
                        if (chainId !== 11155111) {
                          switchChain({ chainId: 11155111 });
                        }
                        setShowNetworkMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm hover:bg-white/10 transition-colors ${chainId === 11155111 ? 'bg-white/5' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${chainId === 11155111 ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span>Sepolia</span>
                      {chainId === 11155111 && <svg className="w-4 h-4 ml-auto text-green-400" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Wallet Button */}
          <div className="relative">
            <button
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="flex items-center gap-1.5 hover:bg-white/10 px-2 py-0.5 rounded"
            >
              {isConnected ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="font-mono text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Connect</span>
                </>
              )}
            </button>

            {/* Wallet Dropdown */}
            {showWalletMenu && (
              <div
                ref={walletMenuRef}
                className="absolute top-7 right-0 w-64 bg-gray-800/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Wallet</p>
                  {isConnected ? (
                    <p className="font-mono text-xs text-green-400 truncate">{address}</p>
                  ) : (
                    <p className="text-sm text-gray-400">Not connected</p>
                  )}
                </div>
                <div className="p-2">
                  <appkit-button />
                </div>
              </div>
            )}
          </div>

          {/* WiFi / WebSocket Status */}
          <button className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded">
            {wsConnected ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4.9-2.3l1.4 1.4C9.4 18 10.6 18.5 12 18.5s2.6-.5 3.5-1.4l1.4-1.4c-1.3-1.3-3.1-2.1-4.9-2.1s-3.6.8-4.9 2.1zM12 10c-3 0-5.8 1.2-7.8 3.2l1.4 1.4C7.2 13 9.5 12 12 12s4.8 1 6.4 2.6l1.4-1.4C17.8 11.2 15 10 12 10zm0-4c-4.1 0-7.9 1.6-10.8 4.5l1.4 1.4C5.1 9.4 8.4 8 12 8s6.9 1.4 9.4 3.9l1.4-1.4C19.9 7.6 16.1 6 12 6z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.41 8.64l-1.41 1.41c-2.73-2.73-7.16-2.73-9.89 0l-1.41-1.41c3.52-3.51 9.21-3.51 12.71 0zM12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm6.36-2.64l-1.41 1.41c-1.62-1.62-4.26-1.62-5.88 0l-1.41-1.41c2.42-2.42 6.28-2.42 8.7 0zM2.81 2.81L1.39 4.22l3.32 3.32C3.23 8.94 2.14 10.5 1.29 12.1l1.41 1.41c.94-1.57 2.11-2.97 3.49-4.18l2.38 2.38c-1.61 1.18-2.91 2.71-3.87 4.45l1.41 1.41c1.08-1.74 2.52-3.23 4.21-4.36l2.72 2.72c-1.56.9-2.87 2.14-3.87 3.61l1.41 1.41c1.22-1.49 2.8-2.69 4.59-3.48l6.02 6.02 1.41-1.41L2.81 2.81z" />
              </svg>
            )}
          </button>

          {/* Clock */}
          <span className="px-2">{formatTime(currentTime)}</span>

          {/* Notification Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center hover:bg-white/10 px-2 py-0.5 rounded relative"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel */}
            {showNotifications && (
              <div
                ref={notificationPanelRef}
                className="absolute top-7 right-0 w-80 bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <span className="text-sm font-medium">Notifications</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-500/10' : ''
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Unread indicator */}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0" />
                          )}
                          <div className={`w-8 h-8 ${notification.isRead ? 'bg-gray-500/20' : 'bg-yellow-500/20'} rounded-lg flex items-center justify-center shrink-0`}>
                            <svg className={`w-4 h-4 ${notification.isRead ? 'text-gray-400' : 'text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-400' : 'text-white'}`}>{notification.title}</p>
                            <p className="text-xs text-gray-400 truncate">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          {/* Delete button */}
                          <button
                            onClick={(e) => removeNotification(notification.id, e)}
                            className="shrink-0 w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-3 h-3 text-gray-500 hover:text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Area */}
      <div className="flex-1 relative p-8 overflow-auto">
        {/* Desktop Icons */}
        <div className="absolute top-8 left-8 flex flex-col gap-4">
          {APPS.map(app => (
            <button
              key={app.id}
              onDoubleClick={() => openApp(app.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 group-hover:scale-105 transition-transform">
                <img src={app.icon} alt={app.name} className="w-10 h-10" />
              </div>
              <span className="text-white text-xs font-medium text-center drop-shadow-lg">{app.name}</span>
            </button>
          ))}
        </div>

        {/* Transaction Window - centered */}
        <div className="flex items-center justify-center h-full">
          {pendingTx ? (
            <div ref={txRequestRef} className="w-full max-w-md animate-fade-in">
              <div className="bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-white/10">
                {/* Window Title Bar */}
                <div className="bg-gray-900/60 px-4 py-3 flex items-center border-b border-white/10">
                  <button onClick={handleReject} className="group w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center">
                    <svg className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-sm font-medium text-white/60">Transaction Request</span>
                  </div>
                  <div className="w-3" />
                </div>

                {/* Window Content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Sign Transaction</h3>
                      <p className="text-sm text-gray-400">Review and confirm this transaction</p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-black/20 rounded-lg p-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">To</p>
                      <p className="font-mono text-xs break-all text-gray-300">{pendingTx.to}</p>
                    </div>
                    {pendingTx.value && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Value</p>
                        <p className="font-mono text-sm text-white">{formatEther(BigInt(pendingTx.value))} ETH</p>
                      </div>
                    )}
                    {pendingTx.data && (() => {
                      const decoded = decodeCalldata(pendingTx.data);
                      if (decoded) {
                        return (
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Function</p>
                              <p className="font-mono text-sm text-blue-400">{decoded.functionName}</p>
                            </div>
                            {decoded.functionName === 'swapFromTON' && (
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                                <p className="font-mono text-sm text-white">{formatUnits(decoded.args[0] as bigint, 18)} TON</p>
                              </div>
                            )}
                            {decoded.functionName === 'approve' && (
                              <>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Spender</p>
                                  <p className="font-mono text-xs break-all text-gray-300">{decoded.args[0] as string}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                                  <p className="font-mono text-sm text-white">{formatUnits(decoded.args[1] as bigint, 18)}</p>
                                </div>
                              </>
                            )}
                            {decoded.functionName === 'approveAndCall' && (() => {
                              const [spender, amount, innerData] = decoded.args as [string, bigint, string];
                              let depositManager = '';
                              let layer2 = '';
                              try {
                                const innerDecoded = decodeAbiParameters(
                                  [{ type: 'address' }, { type: 'address' }],
                                  innerData as `0x${string}`,
                                );
                                depositManager = innerDecoded[0] as string;
                                layer2 = innerDecoded[1] as string;
                              } catch { }
                              return (
                                <>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                                    <p className="font-mono text-sm text-white">{formatUnits(amount, 18)} TON</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">WTON Contract</p>
                                    <p className="font-mono text-xs break-all text-gray-300">{spender}</p>
                                  </div>
                                  {depositManager && (
                                    <div>
                                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deposit Manager</p>
                                      <p className="font-mono text-xs break-all text-gray-300">{depositManager}</p>
                                    </div>
                                  )}
                                  {layer2 && (
                                    <div>
                                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Layer2</p>
                                      <p className="font-mono text-xs break-all text-gray-300">{layer2}</p>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                            {decoded.functionName === 'requestWithdrawal' && (
                              <>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Layer2</p>
                                  <p className="font-mono text-xs break-all text-gray-300">{decoded.args[0] as string}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Amount</p>
                                  <p className="font-mono text-sm text-white">{formatUnits(decoded.args[1] as bigint, 27)} TON</p>
                                </div>
                              </>
                            )}
                            {decoded.functionName === 'processRequest' && (
                              <>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Layer2</p>
                                  <p className="font-mono text-xs break-all text-gray-300">{decoded.args[0] as string}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Receive as</p>
                                  <p className="font-mono text-sm text-white">{decoded.args[1] ? 'TON' : 'WTON'}</p>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Data</p>
                          <p className="font-mono text-xs break-all text-gray-400">
                            {pendingTx.data.length > 66 ? `${pendingTx.data.slice(0, 66)}...` : pendingTx.data}
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleReject}
                      disabled={isSigning}
                      className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSign}
                      disabled={isSigning}
                      className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {isSigning ? 'Signing...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* App Windows */}
      {openApps.map(appId => {
        const app = APPS.find(a => a.id === appId);
        if (!app) return null;
        return (
          <app.component
            key={app.id}
            onRequestTransaction={handleAppTransaction}
            onClose={() => closeApp(app.id)}
            isConnected={isConnected}
            chainId={chainId}
            address={address}
          />
        );
      })}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAboutModal(false)}
          />
          <div className="relative bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8 max-w-xs text-center animate-fade-in">
            <button
              onClick={() => setShowAboutModal(false)}
              className="group absolute top-3 left-3 w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src="/tokamak.svg" alt="Tokamak Network" className="w-20 h-20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">L2 ON-DEMAND</h3>
            <h4 className="text-md font-medium text-blue-400 mb-3">TAILORED ETHEREUM</h4>
            <p className="text-sm text-gray-400 mb-6">
              Tokamak Network offers customized L2 networks & simple way to deploy your own L2 based on your needs
            </p>
            <button
              onClick={() => window.open('https://www.tokamak.network/', '_blank')}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-sm font-medium transition-colors"
            >
              Go to Website
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showWalletMenu || showNotifications || showNetworkMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleClickOutside}
        />
      )}
    </div>
  );
}

export default App;
