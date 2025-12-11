import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const MCP_SERVER_NAME = 'tokamak-network';
const DIST_PATH = resolve(process.cwd(), 'dist', 'index.js');

type Agent = 'claude' | 'gemini';

const CONFIG_PATHS: Record<Agent, string> = {
  claude: join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  gemini: join(homedir(), '.gemini', 'settings.json'),
};

function ensureDirectoryExists(filePath: string) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function readJsonFile(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) {
    return {};
  }
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function writeJsonFile(filePath: string, data: Record<string, unknown>) {
  ensureDirectoryExists(filePath);
  writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function setupClaude() {
  const configPath = CONFIG_PATHS.claude;
  const config = readJsonFile(configPath);

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  (config.mcpServers as Record<string, unknown>)[MCP_SERVER_NAME] = {
    command: 'bun',
    args: ['run', DIST_PATH],
  };

  writeJsonFile(configPath, config);
  console.log(`Claude Desktop MCP config updated: ${configPath}`);
  console.log(`Added server: ${MCP_SERVER_NAME}`);
}

function setupGemini() {
  const configPath = CONFIG_PATHS.gemini;
  const config = readJsonFile(configPath);

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  (config.mcpServers as Record<string, unknown>)[MCP_SERVER_NAME] = {
    command: 'bun',
    args: ['run', DIST_PATH],
  };

  writeJsonFile(configPath, config);
  console.log(`Gemini CLI MCP config updated: ${configPath}`);
  console.log(`Added server: ${MCP_SERVER_NAME}`);
}

const agent = process.argv[2] as Agent;

if (!agent || !['claude', 'gemini'].includes(agent)) {
  console.error('Usage: bun run scripts/setup-mcp.ts <claude|gemini>');
  process.exit(1);
}

if (agent === 'claude') {
  setupClaude();
} else if (agent === 'gemini') {
  setupGemini();
}
