import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useBlockNumber, usePublicClient } from 'wagmi';
import { CONTRACTS, OPERATORS, ERC20_ABI, SEIG_MANAGER_ABI, DEPOSIT_MANAGER_ABI } from '../constants';
import type { WithdrawalRequest } from '../types';

export function useStakingData(selectedOperator: string) {
  const { address, chain } = useAccount();
  const chainId = chain?.id;
  const network = chainId === 1 ? 'mainnet' : 'sepolia';
  const publicClient = usePublicClient();

  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  const { data: tonBalance } = useReadContract({
    address: CONTRACTS[network]?.TON as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!chainId },
  });

  const { data: wtonBalance } = useReadContract({
    address: CONTRACTS[network]?.WTON as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!chainId },
  });

  const selectedOperatorAddress = selectedOperator
    ? OPERATORS[network]?.find((op) => op.name === selectedOperator)?.address
    : undefined;

  const { data: stakedAmount } = useReadContract({
    address: CONTRACTS[network]?.SeigManager as `0x${string}`,
    abi: SEIG_MANAGER_ABI,
    functionName: 'stakeOf',
    args:
      selectedOperatorAddress && address
        ? [selectedOperatorAddress as `0x${string}`, address]
        : undefined,
    query: { enabled: !!address && !!chainId && !!selectedOperatorAddress },
  });

  const { data: currentBlockNumber } = useBlockNumber({
    watch: true,
    query: { refetchInterval: 12000 },
  });

  useEffect(() => {
    async function fetchPendingWithdrawals() {
      if (!publicClient || !address || !selectedOperatorAddress || !chainId) {
        setPendingWithdrawals([]);
        return;
      }

      setLoadingWithdrawals(true);
      try {
        const depositManagerAddress = CONTRACTS[network]?.DepositManager as `0x${string}`;
        const layer2Address = selectedOperatorAddress as `0x${string}`;

        const [withdrawalRequestIndex, numRequests] = await Promise.all([
          publicClient.readContract({
            address: depositManagerAddress,
            abi: DEPOSIT_MANAGER_ABI,
            functionName: 'withdrawalRequestIndex',
            args: [layer2Address, address],
          }),
          publicClient.readContract({
            address: depositManagerAddress,
            abi: DEPOSIT_MANAGER_ABI,
            functionName: 'numRequests',
            args: [layer2Address, address],
          }),
        ]);

        const requestCount = Number(numRequests - withdrawalRequestIndex);
        if (requestCount <= 0) {
          setPendingWithdrawals([]);
          return;
        }

        const requests: WithdrawalRequest[] = [];
        for (let i = 0; i < requestCount; i++) {
          const [withdrawableBlockNumber, amount, processed] = await publicClient.readContract({
            address: depositManagerAddress,
            abi: DEPOSIT_MANAGER_ABI,
            functionName: 'withdrawalRequest',
            args: [layer2Address, address, withdrawalRequestIndex + BigInt(i)],
          });

          if (amount !== 0n && !processed) {
            requests.push({
              index: withdrawalRequestIndex + BigInt(i),
              withdrawableBlockNumber,
              amount,
              processed,
            });
          }
        }
        setPendingWithdrawals(requests);
      } catch (error) {
        console.error('Failed to fetch pending withdrawals:', error);
        setPendingWithdrawals([]);
      } finally {
        setLoadingWithdrawals(false);
      }
    }

    fetchPendingWithdrawals();
  }, [publicClient, address, selectedOperatorAddress, chainId, network, currentBlockNumber]);

  return {
    tonBalance: tonBalance as bigint | undefined,
    wtonBalance: wtonBalance as bigint | undefined,
    stakedAmount: stakedAmount as bigint | undefined,
    currentBlockNumber,
    pendingWithdrawals,
    loadingWithdrawals,
    selectedOperatorAddress,
    network,
  };
}
