import { formatUnits } from 'viem';

export function formatBalance(balance: bigint | undefined, decimals: number): string {
  if (!balance) return '0';
  const formatted = formatUnits(balance, decimals);
  const num = parseFloat(formatted);
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function getNetworkName(id: number): string {
  if (id === 1) return 'mainnet';
  if (id === 11155111) return 'sepolia';
  return `chain-${id}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
