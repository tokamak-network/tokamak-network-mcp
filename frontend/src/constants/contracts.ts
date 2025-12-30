export const CONTRACTS = {
  mainnet: {
    TON: '0x2be5e8c109e2197D077D13A82dAead6a9b3433C5',
    WTON: '0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2',
    DepositManager: '0x0b58ca72b12f01fc05f8f252e226f3e2089bd00e',
    SeigManager: '0x0b55a0f463b6defb81c6063973763951712d0e5f',
    agendaManager: '0xcD4421d082752f363E1687544a09d5112cD4f484',
  },
  sepolia: {
    TON: '0xa30fe40285B8f5c0457DbC3B7C8A280373c40044',
    WTON: '0x79E0d92670106c85E9067b56B8F674340dCa0Bbd',
    DepositManager: '0x90ffcc7F168DceDBEF1Cb6c6eB00cA73F922956F',
    SeigManager: '0x2320542ae933FbAdf8f5B97cA348c7CeDA90fAd7',
    agendaManager: '0x1444f7a8bC26a3c9001a13271D56d6fF36B44f08',
  },
} as const;

export const OPERATORS = {
  mainnet: [
    { name: 'tokamak1', address: '0xf3B17FDB808c7d0Df9ACd24dA34700ce069007DF' },
    { name: 'DXM_Corp', address: '0x44e3605d0ed58FD125E9C47D1bf25a4406c13b57' },
    { name: 'DSRV', address: '0x2B67D8D4E61b68744885E243EfAF988f1Fc66E2D' },
    { name: 'Talken', address: '0x36101b31e74c5E8f9a9cec378407Bbb776287761' },
    { name: 'staked', address: '0x2c25A6be0e6f9017b5bf77879c487eed466F2194' },
    { name: 'level', address: '0x0F42D1C40b95DF7A1478639918fc358B4aF5298D' },
    { name: 'decipher', address: '0xbc602C1D9f3aE99dB4e9fD3662CE3D02e593ec5d' },
    { name: 'DeSpread', address: '0xC42cCb12515b52B59c02eEc303c887C8658f5854' },
    { name: 'Danal_Fintech', address: '0xf3CF23D896Ba09d8EcdcD4655d918f71925E3FE5' },
    { name: 'Hammer', address: '0x06D34f65869Ec94B3BA8c0E08BCEb532f65005E2' },
  ],
  sepolia: [
    { name: 'TokamakOperator_v2', address: '0xCBeF7Cc221c04AD2E68e623613cc5d33b0fE1599' },
    { name: 'poseidon', address: '0xf078ae62ea4740e19ddf6c0c5e17ecdb820bbee1' },
  ],
} as const;

export type NetworkType = 'mainnet' | 'sepolia';
