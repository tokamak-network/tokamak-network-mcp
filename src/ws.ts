import path from 'node:path';
import { staticPlugin } from '@elysiajs/static';
import { Elysia } from 'elysia';
import open from 'open';
import type { Address, Hash, Hex } from 'viem';
import type { KnownNetwork } from './constants';
import { ERRORS } from './errors';

const projectRoot = path.resolve(import.meta.dir, '..');
const frontendDist = path.join(projectRoot, 'frontend', 'dist');

// WebSocket client type
type WsClient = {
  send: (data: string) => void;
};

interface TransactionRequest {
  to: Address;
  data: Hex;
  value?: bigint;
}

type WalletMessage =
  | { type: 'wallet_connected'; data: { address: Address; network: string } }
  | { type: 'tx_result'; data: { hash: Hash } }
  | { type: 'sign_tx'; data: TransactionRequest }
  | { type: 'network_changed'; data: { network: string } };

// State
let wsClient: WsClient | null = null;
let walletAddress: Address | null = null;
let network: KnownNetwork | null = null;
let txResultResolver: ((hash: Hash) => void) | null = null;
let dashboardPort = 3000;
let serverStarted = false;

// Ensure server is started (lazy initialization)
export function ensureServerStarted(port: number = 3000): void {
  if (serverStarted) return;
  serverStarted = true;
  dashboardPort = port;

  const app = createServer(port);
  app.listen(port, () => {
    console.error(`Server running on http://localhost:${port}`);
  });
  open(`http://localhost:${port}`);
}

// State getters/setters
export function getWsClient(): WsClient | null {
  ensureServerStarted();
  return wsClient;
}

export function setWsClient(client: WsClient | null) {
  wsClient = client;
}

type ConnectionState =
  | { connected: true; address: Address; network: KnownNetwork }
  | { connected: false; address: null; network: null };
export function getConnectionState(): ConnectionState {
  ensureServerStarted();
  if (walletAddress && network) {
    return { connected: true, address: walletAddress, network };
  }
  return { connected: false, address: null, network: null };
}

export function getAccount(): Address {
  ensureServerStarted();
  if (!walletAddress) throw new Error(ERRORS.NO_WALLET_CONNECTED);
  return walletAddress;
}

export function setAccount(address: Address) {
  walletAddress = address;
}

export function getNetwork(): KnownNetwork {
  if (!network) throw new Error(ERRORS.NO_WALLET_CONNECTED);
  return network;
}

export function setNetwork(value: KnownNetwork) {
  network = value;
}

export function getTxResultResolver(): ((hash: Hash) => void) | null {
  return txResultResolver;
}

export function setTxResultResolver(resolver: ((hash: Hash) => void) | null) {
  txResultResolver = resolver;
}

// WebSocket server
export function createServer(port: number = 3000) {
  const app = new Elysia()
    .get('/', () => Bun.file(path.join(frontendDist, 'index.html')))
    .use(
      staticPlugin({
        assets: frontendDist,
        prefix: '/',
      }),
    )
    .ws('/ws', {
      open(ws) {
        setWsClient(ws);
      },
      message(ws, message) {
        const msg = (typeof message === 'string' ? JSON.parse(message) : message) as WalletMessage;

        if (msg.type === 'wallet_connected') {
          const data = msg.data as { address: Address; network: KnownNetwork };
          setAccount(data.address);
          setNetwork(data.network);
        } else if (msg.type === 'network_changed') {
          const data = msg.data as { network: KnownNetwork };
          setNetwork(data.network);
        } else if (msg.type === 'tx_result') {
          const resolver = getTxResultResolver();
          if (resolver) {
            const data = msg.data as { hash: Hash };
            resolver(data.hash);
            setTxResultResolver(null);
          }
        }
      },
      close() {
        setWsClient(null);
      },
    })
    .get('/api/health', () => ({ status: 'ok' }))
    .get('/api/wallet', () => ({ address: getAccount() }));

  return app;
}

export async function startServer(port: number = 3000): Promise<void> {
  dashboardPort = port;
  const app = createServer(port);

  app.listen(port, () => {
    console.error(`Server running on http://localhost:${port}`);
  });
}

export async function openBrowser(): Promise<void> {
  await open(`http://localhost:${dashboardPort}`);
}
