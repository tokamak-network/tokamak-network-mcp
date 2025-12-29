import type { AppDefinition } from '../types/app';
import { StakingApp } from './staking/StakingApp';
import { StockApp } from './stock/StockApp';
import { DocsApp } from './docs/DocsApp';
import { GithubApp } from './github/GithubApp';

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
  {
    id: 'docs',
    name: 'Docs',
    icon: '/docs.svg',
    component: DocsApp,
  },
  {
    id: 'github',
    name: 'Github',
    icon: '/github.svg',
    component: GithubApp,
  },
];
