# Tokamak Network MCP Server(+Tokamak Network Desktop)

An MCP (Model Context Protocol) server for Tokamak Network Ecosystem.

## Why

Tokamak Network Community is committed to achieving absolute decentralization by extending the principles of self-sovereignty beyond the blockchain backend to the user interface itself. While traditional web-based frontends remain tethered to centralized servers—creating critical vulnerabilities such as single points of failure and susceptibility to censorship—the Tokamak Network MCP (Model Context Protocol) shatters this dependency. By enabling users to run interfaces directly on their local machines and interact with the protocol through AI, we ensure that access to the network remains permissionless and uninterrupted. This paradigm shift guarantees that as long as a single user exists, the network’s full utility remains alive, ultimately fulfilling our vision of an "unstoppable, truly decentralized ecosystem" where individual sovereignty is never compromised by third-party infrastructure.

## Features

- **Wallet Connection**: Browser-based wallet connection (MetaMask, etc.)
- **Token Management**: Check TON/WTON balance and wrapping
- **Staking**: Stake TON to Layer2 operators
- **Unstaking**: Request staking withdrawal
- **Withdrawal**: Withdraw unstaked tokens

## Tokamak Network Desktop

Tokamak Network Desktop is a Windows-style web-based UI that works alongside the MCP server. Ask the AI to call the `open-desktop` tool to open the Desktop in your browser.



### Apps

- **Staking**: Stake and unstake TON
- **Price**: Real-time TON/WTON price
- **DAO**: DAO governance agendas
- **Layer2**: Layer2 operator information
- **Docs**: Tokamak Network documentation
- **Github**: Tokamak Network GitHub

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

### Desktop

| Tool | Description |
|------|-------------|
| `open-desktop` | Open Tokamak Network Desktop in browser |

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
