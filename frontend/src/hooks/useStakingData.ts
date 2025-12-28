import { useMemo, useEffect } from 'react';
import { useAccount, useReadContracts, useBlockNumber } from 'wagmi';
import { CONTRACTS, OPERATORS, ERC20_ABI, SEIG_MANAGER_ABI, DEPOSIT_MANAGER_ABI } from '../constants';
import type { WithdrawalRequest } from '../types';

const MAX_WITHDRAWAL_REQUESTS = 10;

export function useStakingData(selectedOperator: string) {
  const { address, chain } = useAccount();
  const chainId = chain?.id;
  const network = chainId === 1 ? 'mainnet' : 'sepolia';

  const selectedOperatorAddress = selectedOperator
    ? OPERATORS[network]?.find((op) => op.name === selectedOperator)?.address
    : undefined;

  // Watch block number - refetch every new block
  const { data: currentBlockNumber } = useBlockNumber({
    watch: true,
    query: { refetchInterval: 12000 },
  });

  // Build contract calls for multicall
  const contracts = useMemo(() => {
    if (!address || !chainId) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calls: any[] = [
      // TON balance
      {
        address: CONTRACTS[network]?.TON as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      },
      // WTON balance
      {
        address: CONTRACTS[network]?.WTON as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      },
    ];

    // Add staking-related calls if operator is selected
    if (selectedOperatorAddress) {
      const depositManagerAddress = CONTRACTS[network]?.DepositManager as `0x${string}`;
      const layer2Address = selectedOperatorAddress as `0x${string}`;

      calls.push(
        // Staked amount
        {
          address: CONTRACTS[network]?.SeigManager as `0x${string}`,
          abi: SEIG_MANAGER_ABI,
          functionName: 'stakeOf',
          args: [layer2Address, address],
        },
        // Withdrawal request index
        {
          address: depositManagerAddress,
          abi: DEPOSIT_MANAGER_ABI,
          functionName: 'withdrawalRequestIndex',
          args: [layer2Address, address],
        },
        // Number of requests
        {
          address: depositManagerAddress,
          abi: DEPOSIT_MANAGER_ABI,
          functionName: 'numRequests',
          args: [layer2Address, address],
        },
      );
    }

    return calls;
  }, [address, chainId, network, selectedOperatorAddress]);

  // First multicall: balances + staking info + withdrawal indices
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: baseData, isLoading: isLoadingBase, refetch: refetchBase } = useReadContracts({
    contracts: contracts as any,
    query: {
      enabled: contracts.length > 0,
    },
  });

  // Parse base data
  const parsedBaseData = useMemo(() => {
    if (!baseData) {
      return {
        tonBalance: undefined,
        wtonBalance: undefined,
        stakedAmount: undefined,
        withdrawalRequestIndex: undefined,
        numRequests: undefined,
      };
    }

    return {
      tonBalance: baseData[0]?.result as bigint | undefined,
      wtonBalance: baseData[1]?.result as bigint | undefined,
      stakedAmount: baseData[2]?.result as bigint | undefined,
      withdrawalRequestIndex: baseData[3]?.result as bigint | undefined,
      numRequests: baseData[4]?.result as bigint | undefined,
    };
  }, [baseData]);

  // Build withdrawal request calls based on indices
  const withdrawalContracts = useMemo(() => {
    const { withdrawalRequestIndex, numRequests } = parsedBaseData;
    if (
      !address ||
      !chainId ||
      !selectedOperatorAddress ||
      withdrawalRequestIndex === undefined ||
      numRequests === undefined
    ) {
      return [];
    }

    const requestCount = Number(numRequests - withdrawalRequestIndex);
    if (requestCount <= 0) return [];

    const depositManagerAddress = CONTRACTS[network]?.DepositManager as `0x${string}`;
    const layer2Address = selectedOperatorAddress as `0x${string}`;

    // Limit to prevent too many calls
    const count = Math.min(requestCount, MAX_WITHDRAWAL_REQUESTS);

    return Array.from({ length: count }, (_, i) => ({
      address: depositManagerAddress,
      abi: DEPOSIT_MANAGER_ABI,
      functionName: 'withdrawalRequest',
      args: [layer2Address, address, withdrawalRequestIndex + BigInt(i)],
    }));
  }, [address, chainId, network, selectedOperatorAddress, parsedBaseData]);

  // Second multicall: withdrawal requests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: withdrawalData, isLoading: isLoadingWithdrawals, refetch: refetchWithdrawals } = useReadContracts({
    contracts: withdrawalContracts as any,
    query: {
      enabled: withdrawalContracts.length > 0,
    },
  });

  // Parse withdrawal requests
  const pendingWithdrawals = useMemo((): WithdrawalRequest[] => {
    if (!withdrawalData || !parsedBaseData.withdrawalRequestIndex) return [];

    const requests: WithdrawalRequest[] = [];
    (withdrawalData as { status: string; result?: [bigint, bigint, boolean] }[]).forEach((result, i) => {
      if (result.status === 'success' && result.result) {
        const [withdrawableBlockNumber, amount, processed] = result.result;
        if (amount !== 0n && !processed) {
          requests.push({
            index: parsedBaseData.withdrawalRequestIndex! + BigInt(i),
            withdrawableBlockNumber,
            amount,
            processed,
          });
        }
      }
    });
    return requests;
  }, [withdrawalData, parsedBaseData.withdrawalRequestIndex]);

  // Refetch data when block number changes
  useEffect(() => {
    if (currentBlockNumber && contracts.length > 0) {
      refetchBase();
    }
  }, [currentBlockNumber, contracts.length, refetchBase]);

  useEffect(() => {
    if (currentBlockNumber && withdrawalContracts.length > 0) {
      refetchWithdrawals();
    }
  }, [currentBlockNumber, withdrawalContracts.length, refetchWithdrawals]);

  return {
    tonBalance: parsedBaseData.tonBalance,
    wtonBalance: parsedBaseData.wtonBalance,
    stakedAmount: parsedBaseData.stakedAmount,
    currentBlockNumber,
    pendingWithdrawals,
    loadingWithdrawals: isLoadingBase || isLoadingWithdrawals,
    selectedOperatorAddress,
    network,
  };
}
