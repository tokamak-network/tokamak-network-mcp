import type { AppDefinition } from '../types/app';
import { StakingApp } from './staking/StakingApp';
import { StockApp } from './stock/StockApp';

export const APPS: AppDefinition[] = [
  {
    id: 'staking',
    name: 'Staking',
    icon: '/tokamak.svg',
    component: StakingApp,
  },
  {
    id: 'stock',
    name: 'Price',
    icon: '/stock.svg',
    component: StockApp,
  },
];
