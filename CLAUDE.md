# Project Structure

## src/ - MCP 서버
MCP(Model Context Protocol) 서버 코드. Tokamak Network 토큰 전송 / 스테이킹 / 언스테이킹 / 출금 기능을 AI 에이전트에 제공합니다.

```
src/
├── index.ts          # MCP 서버 엔트리포인트
├── ws.ts             # WebSocket 서버 (프론트엔드 통신)
├── constants.ts      # 컨트랙트 주소, 네트워크 설정
├── schema.ts         # Zod 스키마 정의
├── types.ts          # TypeScript 타입 정의
├── errors.ts         # 커스텀 에러 클래스
├── tokens.ts         # 토큰 관련 유틸리티
├── transaction.ts    # 트랜잭션 빌더
├── utils.ts          # 공통 유틸리티
├── wagmi-config.ts   # Wagmi 클라이언트 설정
├── actions/          # 블록체인 조회 액션
│   ├── balance.ts    # 잔액 조회
│   ├── layer2.ts     # L2 오퍼레이터 조회
│   ├── stake.ts      # 스테이킹 정보 조회
│   └── withdraw.ts   # 출금 요청 조회
└── tools/            # MCP 도구 정의
    ├── erc20.ts      # ERC20 토큰 도구
    ├── ton.ts        # TON 토큰 도구
    ├── stake.ts      # 스테이킹 도구
    ├── unstake.ts    # 언스테이킹 도구
    ├── withdraw.ts   # 출금 도구
    ├── wallet.ts     # 지갑 연결 도구
    └── helper.ts     # 헬퍼 함수
```

## frontend/ - 웹 UI
MCP 서버와 WebSocket으로 통신하는 React 프론트엔드. 트랜잭션 서명 및 앱 런처 UI를 제공합니다.

**기술 스택**: Vite + React 18 + TypeScript + Tailwind CSS v4 + Wagmi + Viem

```
frontend/src/
├── main.tsx          # React 엔트리포인트
├── App.tsx           # 메인 쉘 (앱 런처, 트랜잭션 처리)
├── apps/             # 플러그인 앱
│   ├── index.ts      # 앱 레지스트리 (APPS 배열)
│   └── staking/
│       └── StakingApp.tsx  # 스테이킹 앱
├── config/
│   └── wagmi.ts      # Wagmi/WalletConnect 설정
├── constants/        # 상수 정의
│   ├── index.ts      # barrel export
│   ├── contracts.ts  # 컨트랙트 주소, 오퍼레이터 목록
│   └── abis.ts       # ABI 정의
├── types/            # TypeScript 인터페이스
│   ├── index.ts      # barrel export + 공통 타입
│   └── app.ts        # 앱 인터페이스 (AppProps, AppDefinition)
├── utils/            # 유틸리티 함수
│   ├── index.ts      # barrel export
│   ├── format.ts     # 포맷팅 함수
│   └── decode.ts     # calldata 디코딩
├── hooks/            # React 커스텀 훅
│   ├── index.ts      # barrel export
│   ├── useWebSocket.ts         # MCP 서버 통신
│   ├── useStakingData.ts       # 스테이킹 데이터 조회 (multicall)
│   ├── useNotifications.ts     # 알림 관리
│   └── useTransactionRequest.ts # 트랜잭션 요청 처리
└── i18n/             # 다국어 지원
    ├── index.ts      # LanguageContext, useLanguage hook
    └── translations.ts # 번역 데이터 (en/ko)
```

### 플러그인 앱 시스템
새 앱 추가 시:
1. `apps/<app-name>/<AppName>App.tsx` 생성 (AppProps 인터페이스 구현)
2. `apps/index.ts`의 APPS 배열에 AppDefinition 추가
3. 앱은 `onRequestTransaction(tx)`으로 트랜잭션 요청

### UI 스타일
- macOS 스타일 UI (메뉴바, 윈도우, 드롭다운)
- 다크 테마 기반 (`bg-gray-800`, `bg-gray-900`)
- 유리 효과 (`backdrop-blur-xl`)

### 네트워크 설정
- `CONTRACTS[network]`: 컨트랙트 주소 (mainnet/sepolia)
- `OPERATORS[network]`: 오퍼레이터 목록 (mainnet/sepolia)

## scripts/
- `setup-mcp.ts` - MCP 서버 설정 스크립트

# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')
- Use const for variables that don't need to be re-assigned
- Use let for variables that need to be re-assigned
- Use arrow functions for functions that are assigned to a variable
- 파일/디렉터리를 추가하거나 삭제할 때 위 Project Structure 섹션도 함께 업데이트하세요.

# Commit
- 커밋 메세지를 작성할 때는 핵심 내용만 간략하게 작성하세요.