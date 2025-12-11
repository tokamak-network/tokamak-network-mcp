import type { Address } from 'viem';
import type { KnownNetwork } from '../constants';
import { LAYER2_ADDRESSES } from '../constants';
import { ERRORS } from '../errors';

export function getLayer2Address(layer2: string, network: KnownNetwork): Address {
  const address = LAYER2_ADDRESSES[network][layer2];
  if (!address) {
    throw new Error(ERRORS.LAYER2_NOT_CONFIGURED(layer2, network));
  }
  return address;
}
