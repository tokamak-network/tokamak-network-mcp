export const translations = {
  en: {
    // Menu bar
    'menu.connect': 'Connect',

    // Staking app
    'staking.title': 'Tokamak Network Staking',
    'staking.subtitle': 'Stake or unstake tokens',
    'staking.connectWallet': 'Please connect your wallet first',
    'staking.stake': 'STAKE',
    'staking.unstake': 'UNSTAKE',
    'staking.operator': 'Operator',
    'staking.selectOperator': 'Select Operator',
    'staking.amount': 'Amount',
    'staking.balance': 'Balance',
    'staking.network': 'Network',
    'staking.stakeButton': 'Stake',
    'staking.stakedAmount': 'Staked Amount',
    'staking.pendingWithdrawals': 'Pending Withdrawals',
    'staking.noPendingWithdrawals': 'No pending withdrawals',
    'staking.ready': 'Ready',
    'staking.blocks': 'blocks',
    'staking.withdrawTON': 'Withdraw TON',
    'staking.withdrawWTON': 'Withdraw WTON',
    'staking.newUnstakeRequest': 'New Unstake Request',
    'staking.requestWithdrawal': 'Unstake',
    'staking.loading': 'Loading...',

    // Transaction
    'tx.title': 'Transaction Request',
    'tx.signTransaction': 'Sign Transaction',
    'tx.reviewConfirm': 'Review and confirm this transaction',
    'tx.to': 'To',
    'tx.value': 'Value',
    'tx.function': 'Function',
    'tx.amount': 'Amount',
    'tx.spender': 'Spender',
    'tx.layer2': 'Layer2',
    'tx.receiveAs': 'Receive as',
    'tx.depositManager': 'Deposit Manager',
    'tx.wtonContract': 'WTON Contract',
    'tx.data': 'Data',
    'tx.cancel': 'Cancel',
    'tx.confirm': 'Confirm',
    'tx.signing': 'Signing...',

    // About
    'about.tagline': 'L2 ON-DEMAND',
    'about.subtitle': 'TAILORED ETHEREUM',
    'about.description':
      'Tokamak Network offers customized L2 networks & simple way to deploy your own L2 based on your needs',
    'about.goToWebsite': 'Go to Website',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.clearAll': 'Clear All',
    'notifications.noNotifications': 'No notifications',
    'notifications.txRequest': 'Transaction Request',
    'notifications.newTx': 'New transaction to',

    // Stock app
    'stock.title': 'TON Price',
    'stock.subtitle': 'TOKAMAK token prices by exchange',
    'stock.disclaimer': 'Prices update every 30 seconds',
  },
  ko: {
    // Menu bar
    'menu.connect': '연결',

    // Staking app
    'staking.title': '토카막 스테이킹',
    'staking.subtitle': '토큰 스테이킹 및 언스테이킹',
    'staking.connectWallet': '먼저 지갑을 연결해주세요',
    'staking.stake': '스테이킹',
    'staking.unstake': '언스테이킹',
    'staking.operator': '오퍼레이터',
    'staking.selectOperator': '오퍼레이터 선택',
    'staking.amount': '수량',
    'staking.balance': '잔액',
    'staking.network': '네트워크',
    'staking.stakeButton': '스테이킹',
    'staking.stakedAmount': '스테이킹된 수량',
    'staking.pendingWithdrawals': '대기 중인 출금',
    'staking.noPendingWithdrawals': '대기 중인 출금 없음',
    'staking.ready': '출금 가능',
    'staking.blocks': '블록',
    'staking.withdrawTON': 'TON으로 출금',
    'staking.withdrawWTON': 'WTON으로 출금',
    'staking.newUnstakeRequest': '새 언스테이킹 요청',
    'staking.requestWithdrawal': '언스테이킹',
    'staking.loading': '로딩 중...',

    // Transaction
    'tx.title': '트랜잭션 요청',
    'tx.signTransaction': '트랜잭션 서명',
    'tx.reviewConfirm': '트랜잭션을 검토하고 확인하세요',
    'tx.to': '수신자',
    'tx.value': '값',
    'tx.function': '함수',
    'tx.amount': '수량',
    'tx.spender': '승인 대상',
    'tx.layer2': '레이어2',
    'tx.receiveAs': '수령 토큰',
    'tx.depositManager': '예치 관리자',
    'tx.wtonContract': 'WTON 컨트랙트',
    'tx.data': '데이터',
    'tx.cancel': '취소',
    'tx.confirm': '확인',
    'tx.signing': '서명 중...',

    // About
    'about.tagline': '온디맨드 L2',
    'about.subtitle': '맞춤형 이더리움',
    'about.description':
      '토카막 네트워크는 맞춤형 L2 네트워크와 간편한 L2 배포 서비스를 제공합니다',
    'about.goToWebsite': '웹사이트 방문',

    // Notifications
    'notifications.title': '알림',
    'notifications.clearAll': '모두 삭제',
    'notifications.noNotifications': '알림 없음',
    'notifications.txRequest': '트랜잭션 요청',
    'notifications.newTx': '새 트랜잭션:',

    // Stock app
    'stock.title': 'TON 시세',
    'stock.subtitle': '거래소별 TOKAMAK 토큰 가격',
    'stock.disclaimer': '30초마다 가격이 갱신됩니다',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
export type Language = keyof typeof translations;
