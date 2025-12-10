# Tokamak Network MCP Server(EN)

An MCP (Model Context Protocol) server for TON token staking on Tokamak Network.

## Features

- **Wallet Connection**: Browser-based wallet connection (MetaMask, etc.)
- **Token Management**: Check TON/WTON balance and wrapping
- **Staking**: Stake TON to Layer2 operators
- **Unstaking**: Request staking withdrawal
- **Withdrawal**: Withdraw unstaked tokens

## Supported Networks

| Network | Chain ID |
|---------|----------|
| Ethereum Mainnet | 1 |
| Sepolia Testnet | 11155111 |

## Installation

```bash
bun install
```

## Running

### Development Mode

```bash
bun run dev
```

### Production Build

```bash
bun run build
bun run start
```

## MCP Server Configuration

### Claude Desktop

Add the following to your `claude_desktop_config.json` file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tokamak-network": {
      "command": "bun",
      "args": ["run", "/path/to/tokamak-network-mcp/src/index.ts"]
    }
  }
}
```

### Claude Code

Add the following to your `.mcp.json` file:

```json
{
  "mcpServers": {
    "tokamak-network": {
      "command": "bun",
      "args": ["run", "/path/to/tokamak-network-mcp/src/index.ts"]
    }
  }
}
```

### Gemini CLI

Add the following to `~/.gemini/settings.json` (global) or `.gemini/settings.json` (project):

```json
{
  "mcpServers": {
    "tokamak-network": {
      "command": "bun",
      "args": ["run", "/path/to/tokamak-network-mcp/src/index.ts"]
    }
  }
}
```

Or add via CLI command:

```bash
gemini mcp add tokamak-network -- bun run /path/to/tokamak-network-mcp/src/index.ts
```

### OpenAI Codex

Add the following to your `~/.codex/config.toml` file:

```toml
[mcp_servers.tokamak-network]
command = "bun"
args = ["run", "/path/to/tokamak-network-mcp/src/index.ts"]
```

Or add via CLI command:

```bash
codex mcp add tokamak-network -- bun run /path/to/tokamak-network-mcp/src/index.ts
```

## MCP Tools

### Wallet

| Tool | Description |
|------|-------------|
| `connect_wallet` | Open browser to connect wallet |
| `get_wallet_address` | Get connected wallet address |

### Token

| Tool | Description |
|------|-------------|
| `get_token_balance` | Get TON, WTON or ERC20 token balance |
| `approve_token` | Approve token spending |
| `wrap-ton` | Wrap TON to WTON |

### Staking

| Tool | Description |
|------|-------------|
| `stake-ton` | Stake TON to Layer2 operator |
| `get-staked-ton-balance` | Get staked TON balance |
| `unstake-ton` | Request unstaking |

### Withdrawal

| Tool | Description |
|------|-------------|
| `get-pending-withdrawal` | Get pending withdrawal requests |
| `withdraw-ton` | Process withdrawal request |

## Layer2 Operators

### Mainnet

- tokamak1
- DXM_Corp
- DSRV
- Talken
- staked
- level
- decipher
- DeSpread
- Danal_Fintech
- Hammer

### Sepolia

- TokamakOperator_v2
- poseidon

## Usage Example

```
1. Connect wallet using connect_wallet tool
2. Check TON balance using get_token_balance tool
3. Stake to desired operator using stake-ton tool
4. Check staked balance using get-staked-ton-balance tool
```

## Tech Stack

- **Runtime**: Bun
- **MCP SDK**: @modelcontextprotocol/sdk
- **Web3**: viem
- **Web Server**: Elysia
- **Validation**: Zod

## License

MIT
