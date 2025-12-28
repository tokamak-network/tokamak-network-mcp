import { decodeFunctionData } from 'viem';
import { SUPPORTED_ABI } from '../constants';

export function decodeCalldata(data: string) {
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
