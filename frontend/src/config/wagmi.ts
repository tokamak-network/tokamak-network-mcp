import { mainnet, sepolia } from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// Get project ID from https://cloud.reown.com
const projectId = '270e2899732f3dff922152b1c0a98943';

const metadata = {
  name: 'TNM',
  description: 'TNM MCP Dashboard',
  url: 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

const networks = [mainnet, sepolia];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, sepolia],
  projectId,
  metadata,
  features: {
    analytics: false,
  },
});

export const config = wagmiAdapter.wagmiConfig;
