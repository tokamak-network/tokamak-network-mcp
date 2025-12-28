import type { Address } from 'viem';

export const KNOWN_NETWORKS = ['mainnet', 'sepolia'] as const;
export type KnownNetwork = (typeof KNOWN_NETWORKS)[number];

export const DEFAULT_NETWORK = 'mainnet';
export const KNOWN_TOKENS = ['TON', 'WTON'] as const;
export type KnownToken = (typeof KNOWN_TOKENS)[number];

export const TOKEN_ADDRESSES: Record<string, Record<number, `0x${string}`>> = {
  TON: {
    1: '0x2be5e8c109e2197D077D13A82dAead6a9b3433C5',
    11155111: '0xa30fe40285b8f5c0457dbc3b7c8a280373c40044',
  },
  WTON: {
    1: '0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2',
    11155111: '0x79e0d92670106c85e9067b56b8f674340dca0bbd',
  },
};

export const TOKEN_DECIMALS: Record<KnownToken, number> = {
  TON: 18,
  WTON: 27,
};

export const KNOWN_LAYER2_MAINNET = [
  'tokamak1',
  'DXM_Corp',
  'DSRV',
  'Talken',
  'staked',
  'level',
  'decipher',
  'DeSpread',
  'Danal_Fintech',
  'Hammer',
] as const;

export const KNOWN_LAYER2_SEPOLIA = ['TokamakOperator_v2', 'poseidon'] as const;

export const KNOWN_LAYER2 = [...KNOWN_LAYER2_MAINNET, ...KNOWN_LAYER2_SEPOLIA] as const;

export type KnownLayer2Mainnet = (typeof KNOWN_LAYER2_MAINNET)[number];
export type KnownLayer2Sepolia = (typeof KNOWN_LAYER2_SEPOLIA)[number];
export type KnownLayer2 = KnownLayer2Mainnet | KnownLayer2Sepolia;

export const LAYER2_ADDRESSES: Record<KnownNetwork, Record<string, Address>> = {
  mainnet: {
    tokamak1: '0xf3B17FDB808c7d0Df9ACd24dA34700ce069007DF',
    DXM_Corp: '0x44e3605d0ed58FD125E9C47D1bf25a4406c13b57',
    DSRV: '0x2B67D8D4E61b68744885E243EfAF988f1Fc66E2D',
    Talken: '0x36101b31e74c5E8f9a9cec378407Bbb776287761',
    staked: '0x2c25A6be0e6f9017b5bf77879c487eed466F2194',
    level: '0x0F42D1C40b95DF7A1478639918fc358B4aF5298D',
    decipher: '0xbc602C1D9f3aE99dB4e9fD3662CE3D02e593ec5d',
    DeSpread: '0xC42cCb12515b52B59c02eEc303c887C8658f5854',
    Danal_Fintech: '0xf3CF23D896Ba09d8EcdcD4655d918f71925E3FE5',
    Hammer: '0x06D34f65869Ec94B3BA8c0E08BCEb532f65005E2',
  },
  sepolia: {
    TokamakOperator_v2: '0xCBeF7Cc221c04AD2E68e623613cc5d33b0fE1599',
    poseidon: '0xf078ae62ea4740e19ddf6c0c5e17ecdb820bbee1',
  },
};

export const CONTRACT_ADDRESSES = {
  mainnet: {
    DEPOSIT_MANAGER: '0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e' as Address,
    SEIG_MANAGER: '0x0b55a0f463b6defb81c6063973763951712d0e5f' as Address,
    LAYER2_REGISTRY: '0x7846c2248a7b4de77e9c2bae7fbb93bfc286837b' as Address,
    SWAPPROXY: '0x30e65B3A6e6868F044944Aa0e9C5d52F8dcb138d' as Address,
    L1BRIDGE_REGISTRY: '0x39d43281A4A5e922AB0DCf89825D73273D8C5BA4' as Address,
    LAYER2_MANAGER: '0xD6Bf6B2b7553c8064Ba763AD6989829060FdFC1D' as Address,
    DAO_COMMITTEE: '0xDD9f0cCc044B0781289Ee318e5971b0139602C26' as Address,
    AGENDA_MANAGER: '0xcD4421d082752f363E1687544a09d5112cD4f484' as Address,
  },
  sepolia: {
    DEPOSIT_MANAGER: '0x90ffcc7F168DceDBEF1Cb6c6eB00cA73F922956F' as Address,
    SEIG_MANAGER: '0x2320542ae933FbAdf8f5B97cA348c7CeDA90fAd7' as Address,
    LAYER2_REGISTRY: '0xA0a9576b437E52114aDA8b0BC4149F2F5c604581' as Address,
    SWAPPROXY: '0x690f994b82f001059e24d79292c3c476854b767a' as Address,
    L1BRIDGE_REGISTRY: '0x2D47fa57101203855b336e9E61BC9da0A6dd0Dbc' as Address,
    LAYER2_MANAGER: '0x58B4C2FEf19f5CDdd944AadD8DC99cCC71bfeFDc' as Address,
    DAO_COMMITTEE: '0xA2101482b28E3D99ff6ced517bA41EFf4971a386' as Address,
    AGENDA_MANAGER: '0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08' as Address,
  },
};
