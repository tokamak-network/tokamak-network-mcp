import { parseAbi } from 'viem';

export const SUPPORTED_ABI = parseAbi([
  'function swapFromTON(uint256 tonAmount)',
  'function approve(address spender, uint256 amount)',
  'function approveAndCall(address spender, uint256 amount, bytes data)',
  'function requestWithdrawal(address layer2, uint256 amount)',
  'function processRequest(address layer2, bool receiveTON)',
  'function deposit(address layer2, uint256 amount)',
]);

export const ERC20_ABI = parseAbi(['function balanceOf(address owner) view returns (uint256)']);

export const SEIG_MANAGER_ABI = parseAbi([
  'function stakeOf(address layer2, address account) view returns (uint256)',
]);

export const DEPOSIT_MANAGER_ABI = parseAbi([
  'function withdrawalRequestIndex(address layer2, address account) view returns (uint256)',
  'function numRequests(address layer2, address account) view returns (uint256)',
  'function withdrawalRequest(address layer2, address account, uint256 index) view returns (uint128 withdrawableBlockNumber, uint128 amount, bool processed)',
]);

export const AGENDA_MANAGER_ABI = parseAbi([
  'function agendas(uint256 index) view returns ((uint256 createdTimestamp, uint256 noticeEndTimestamp, uint256 votingPeriodInSeconds, uint256 votingStartedTimestamp, uint256 votingEndTimestamp, uint256 executableLimitTimestamp, uint256 executedTimestamp, uint256 countingYes, uint256 countingNo, uint256 countingAbstain, uint8 status, uint8 result, address[] voters, bool executed))',
  'function numAgendas() view returns (uint256)',
]);

export const LAYER2_ABI = parseAbi([
  'function totalStaked() view returns (uint256)',
  'function operator() view returns (address)',
  'function updateSeigniorage() returns (bool)',
]);
