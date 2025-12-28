import { useState, useEffect } from 'react';
import { formatUnits, parseUnits, encodeFunctionData, encodeAbiParameters, parseAbi } from 'viem';
import { CONTRACTS, OPERATORS, SUPPORTED_ABI } from '../../constants';
import { useStakingData } from '../../hooks';
import { formatBalance } from '../../utils';
import type { AppProps } from '../../types/app';
import type { PendingTransaction } from '../../types';

export function StakingApp({ onRequestTransaction, onClose, isConnected, chainId }: AppProps) {
  const [stakingToken, setStakingToken] = useState<'TON' | 'WTON'>('TON');
  const [stakingAmount, setStakingAmount] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [stakingTab, setStakingTab] = useState<'stake' | 'unstake'>('stake');

  const {
    tonBalance,
    wtonBalance,
    stakedAmount,
    currentBlockNumber,
    pendingWithdrawals,
    loadingWithdrawals,
  } = useStakingData(selectedOperator);

  // Reset selected operator when network changes
  useEffect(() => {
    setSelectedOperator('');
  }, [chainId]);

  const handleStake = () => {
    if (!stakingAmount || parseFloat(stakingAmount) <= 0) return;
    if (!chainId) return;
    if (!selectedOperator) return;

    const network = chainId === 1 ? 'mainnet' : 'sepolia';
    const contracts = CONTRACTS[network];
    const operator = OPERATORS[network].find(op => op.name === selectedOperator);
    if (!operator) return;
    const layer2 = operator.address;

    let txData: PendingTransaction;

    if (stakingToken === 'TON') {
      const amountInWei = parseUnits(stakingAmount, 18);
      const innerData = encodeAbiParameters(
        [{ type: 'address' }, { type: 'address' }],
        [contracts.DepositManager as `0x${string}`, layer2 as `0x${string}`]
      );
      const calldata = encodeFunctionData({
        abi: SUPPORTED_ABI,
        functionName: 'approveAndCall',
        args: [contracts.WTON as `0x${string}`, amountInWei, innerData],
      });
      txData = {
        to: contracts.TON,
        data: calldata,
        chainId,
      };
    } else {
      const amountInRay = parseUnits(stakingAmount, 27);
      const calldata = encodeFunctionData({
        abi: parseAbi(['function deposit(address layer2, uint256 amount)']),
        functionName: 'deposit',
        args: [layer2 as `0x${string}`, amountInRay],
      });
      txData = {
        to: contracts.DepositManager,
        data: calldata,
        chainId,
      };
    }

    onRequestTransaction(txData);
    onClose();
    setStakingAmount('');
  };

  const handleUnstake = () => {
    if (!stakingAmount || parseFloat(stakingAmount) <= 0) return;
    if (!chainId) return;
    if (!selectedOperator) return;

    const network = chainId === 1 ? 'mainnet' : 'sepolia';
    const contracts = CONTRACTS[network];
    const operator = OPERATORS[network].find(op => op.name === selectedOperator);
    if (!operator) return;
    const layer2 = operator.address;

    const amountInRay = parseUnits(stakingAmount, 27);
    const calldata = encodeFunctionData({
      abi: SUPPORTED_ABI,
      functionName: 'requestWithdrawal',
      args: [layer2 as `0x${string}`, amountInRay],
    });

    const txData: PendingTransaction = {
      to: contracts.DepositManager,
      data: calldata,
      chainId,
    };

    onRequestTransaction(txData);
    onClose();
    setStakingAmount('');
  };

  const handleWithdraw = (receiveTON: boolean) => {
    if (!chainId) return;
    if (!selectedOperator) return;

    const network = chainId === 1 ? 'mainnet' : 'sepolia';
    const contracts = CONTRACTS[network];
    const operator = OPERATORS[network].find(op => op.name === selectedOperator);
    if (!operator) return;
    const layer2 = operator.address;

    const calldata = encodeFunctionData({
      abi: SUPPORTED_ABI,
      functionName: 'processRequest',
      args: [layer2 as `0x${string}`, receiveTON],
    });

    const txData: PendingTransaction = {
      to: contracts.DepositManager,
      data: calldata,
      chainId,
    };

    onRequestTransaction(txData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-white/10">
          {/* Window Title Bar */}
          <div className="bg-gray-900/60 px-4 py-3 flex items-center border-b border-white/10">
            <button
              onClick={onClose}
              className="group w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium text-white/60">Tokamak Staking</span>
            </div>
            <div className="w-3" />
          </div>

          {/* Window Content */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center border border-white/20">
                <img src="/tokamak.svg" alt="Tokamak" className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Tokamak Staking</h3>
                <p className="text-sm text-gray-400">Stake or unstake tokens</p>
              </div>
            </div>

            {!isConnected ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                <p className="text-yellow-400 text-sm">Please connect your wallet first</p>
              </div>
            ) : (
              <>
                {/* Tab Selection */}
                <div className="flex gap-1 bg-gray-900/50 rounded-lg p-1">
                  <button
                    onClick={() => { setStakingTab('stake'); setStakingAmount(''); }}
                    className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${stakingTab === 'stake'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    STAKE
                  </button>
                  <button
                    onClick={() => { setStakingTab('unstake'); setStakingAmount(''); }}
                    className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${stakingTab === 'unstake'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    UNSTAKE
                  </button>
                </div>

                {/* Operator Selection */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Operator</label>
                  <select
                    value={selectedOperator}
                    onChange={(e) => setSelectedOperator(e.target.value)}
                    className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-800">Select Operator</option>
                    {OPERATORS[chainId === 1 ? 'mainnet' : 'sepolia'].map(op => (
                      <option key={op.name} value={op.name} className="bg-gray-800">
                        {op.name}
                      </option>
                    ))}
                  </select>
                </div>

                {stakingTab === 'stake' ? (
                  <>
                    {/* Token Selection */}
                    <div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStakingToken('TON')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${stakingToken === 'TON'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                          TON
                        </button>
                        <button
                          onClick={() => setStakingToken('WTON')}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${stakingToken === 'WTON'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                          WTON
                        </button>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-gray-400 uppercase tracking-wide">Amount</label>
                        <span className="text-xs text-gray-400">
                          Balance: <span className="text-white">{
                            stakingToken === 'TON'
                              ? formatBalance(tonBalance as bigint, 18)
                              : formatBalance(wtonBalance as bigint, 27)
                          }</span> {stakingToken}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={stakingAmount}
                          onChange={(e) => setStakingAmount(e.target.value)}
                          placeholder="0.0"
                          className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-4 py-3 pr-28 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <button
                            onClick={() => {
                              const balance = stakingToken === 'TON' ? tonBalance : wtonBalance;
                              const decimals = stakingToken === 'TON' ? 18 : 27;
                              if (balance) {
                                setStakingAmount(formatUnits(balance as bigint, decimals));
                              }
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                          >
                            MAX
                          </button>
                          <span className="text-gray-500">|</span>
                          <span className="text-gray-400 text-sm">{stakingToken}</span>
                        </div>
                      </div>
                    </div>

                    {/* Network Info */}
                    <div className="bg-gray-900/30 rounded-lg p-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Network</span>
                        <span className="text-white capitalize">{chainId === 1 ? 'Ethereum' : 'Sepolia'}</span>
                      </div>
                    </div>

                    {/* Stake Button */}
                    <button
                      onClick={handleStake}
                      disabled={!stakingAmount || parseFloat(stakingAmount) <= 0 || !selectedOperator}
                      className="w-full py-3 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                    >
                      Stake {stakingToken}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Staked Amount Display */}
                    <div className="bg-gray-900/30 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Staked Amount</span>
                        <span className="text-lg font-semibold text-white">
                          {selectedOperator ? formatBalance(stakedAmount as bigint, 27) : '—'} TON
                        </span>
                      </div>
                    </div>

                    {/* Pending Withdrawals List */}
                    {selectedOperator && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs text-gray-400 uppercase tracking-wide">Pending Withdrawals</label>
                          {loadingWithdrawals && <span className="text-xs text-gray-500">Loading...</span>}
                        </div>
                        {pendingWithdrawals.length === 0 ? (
                          <div className="bg-gray-900/30 rounded-lg p-3 text-center">
                            <span className="text-sm text-gray-500">No pending withdrawals</span>
                          </div>
                        ) : (
                          <div className="bg-gray-900/30 rounded-lg divide-y divide-white/5 max-h-48 overflow-y-auto">
                            {pendingWithdrawals.map((req, idx) => {
                              const isReady = currentBlockNumber !== undefined && currentBlockNumber >= req.withdrawableBlockNumber;
                              const blocksRemaining = currentBlockNumber !== undefined
                                ? Number(req.withdrawableBlockNumber - currentBlockNumber)
                                : 0;
                              return (
                                <div key={idx} className="p-3 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="text-sm text-white font-medium">
                                        {formatBalance(req.amount, 27)} TON
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        Block #{req.withdrawableBlockNumber.toString()}
                                      </div>
                                    </div>
                                    <div className={`text-xs px-2 py-1 rounded ${isReady
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-yellow-500/20 text-yellow-400'
                                      }`}>
                                      {isReady ? 'Ready' : `${blocksRemaining} blocks`}
                                    </div>
                                  </div>
                                  {isReady && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleWithdraw(true)}
                                        className="flex-1 py-1.5 bg-green-500 hover:bg-green-400 rounded text-white text-xs font-medium transition-colors"
                                      >
                                        Withdraw TON
                                      </button>
                                      <button
                                        onClick={() => handleWithdraw(false)}
                                        className="flex-1 py-1.5 bg-purple-500 hover:bg-purple-400 rounded text-white text-xs font-medium transition-colors"
                                      >
                                        Withdraw WTON
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-white/10 pt-4">
                      <label className="text-xs text-gray-400 uppercase tracking-wide">New Unstake Request</label>
                    </div>

                    {/* Unstake Amount Input */}
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="number"
                          value={stakingAmount}
                          onChange={(e) => setStakingAmount(e.target.value)}
                          placeholder="0.0"
                          className="w-full bg-gray-900/50 border border-white/10 rounded-lg px-4 py-3 pr-24 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (stakedAmount) {
                                setStakingAmount(formatUnits(stakedAmount as bigint, 27));
                              }
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                          >
                            MAX
                          </button>
                          <span className="text-gray-500">|</span>
                          <span className="text-gray-400 text-sm">TON</span>
                        </div>
                      </div>
                    </div>

                    {/* Unstake Button */}
                    <button
                      onClick={handleUnstake}
                      disabled={!stakingAmount || parseFloat(stakingAmount) <= 0 || !selectedOperator}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                    >
                      Request Withdrawal
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
