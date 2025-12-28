import type { AppDefinition } from '../types/app';
import { StakingApp } from './staking/StakingApp';

export const APPS: AppDefinition[] = [
  {
    id: 'staking',
    name: 'Staking',
    icon: '/tokamak.svg',
    component: StakingApp,
  },
];
