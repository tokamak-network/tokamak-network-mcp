# Tokamak Network MCP Server

Tokamak Network의 TON 토큰 스테이킹을 위한 MCP(Model Context Protocol) 서버입니다.

## 주요 기능

- **지갑 연결**: 브라우저 기반 지갑 연결 (MetaMask 등)
- **토큰 관리**: TON/WTON 잔액 조회 및 래핑
- **스테이킹**: Layer2 오퍼레이터에 TON 스테이킹
- **언스테이킹**: 스테이킹 해제 요청
- **출금**: 언스테이킹된 토큰 출금

## 지원 네트워크

| 네트워크 | Chain ID |
|---------|----------|
| Ethereum Mainnet | 1 |
| Sepolia Testnet | 11155111 |

## 설치

```bash
bun install
```

## 실행

### 개발 모드

```bash
bun run dev
```

### 프로덕션 빌드

```bash
bun run build
bun run start
```

## MCP 서버 설정

### Claude Desktop

`claude_desktop_config.json` 파일에 다음을 추가하세요:

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

`.mcp.json` 파일에 다음을 추가하세요:

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

`~/.gemini/settings.json` (전역) 또는 `.gemini/settings.json` (프로젝트) 파일에 다음을 추가하세요:

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

또는 CLI 명령어로 추가:

```bash
gemini mcp add tokamak-network -- bun run /path/to/tokamak-network-mcp/src/index.ts
```

### OpenAI Codex

`~/.codex/config.toml` 파일에 다음을 추가하세요:

```toml
[mcp_servers.tokamak-network]
command = "bun"
args = ["run", "/path/to/tokamak-network-mcp/src/index.ts"]
```

또는 CLI 명령어로 추가:

```bash
codex mcp add tokamak-network -- bun run /path/to/tokamak-network-mcp/src/index.ts
```

## MCP 도구 목록

### 지갑

| 도구명 | 설명 |
|-------|-----|
| `connect_wallet` | 브라우저를 열어 지갑 연결 |
| `get_wallet_address` | 연결된 지갑 주소 조회 |

### 토큰

| 도구명 | 설명 |
|-------|-----|
| `get_token_balance` | TON, WTON 또는 ERC20 토큰 잔액 조회 |
| `approve_token` | 토큰 사용 승인 |
| `wrap-ton` | TON을 WTON으로 래핑 |

### 스테이킹

| 도구명 | 설명 |
|-------|-----|
| `stake-ton` | TON을 Layer2 오퍼레이터에 스테이킹 |
| `get-staked-ton-balance` | 스테이킹된 TON 잔액 조회 |
| `unstake-ton` | 스테이킹 해제 요청 |

### 출금

| 도구명 | 설명 |
|-------|-----|
| `get-pending-withdrawal` | 대기 중인 출금 요청 조회 |
| `withdraw-ton` | 출금 요청 처리 |

## Layer2 오퍼레이터

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

## 사용 예시

```
1. connect_wallet 도구로 지갑 연결
2. get_token_balance 도구로 TON 잔액 확인
3. stake-ton 도구로 원하는 오퍼레이터에 스테이킹
4. get-staked-ton-balance 도구로 스테이킹 잔액 확인
```

## 기술 스택

- **Runtime**: Bun
- **MCP SDK**: @modelcontextprotocol/sdk
- **Web3**: viem
- **Web Server**: Elysia
- **Validation**: Zod

## 라이선스

MIT
