/**
 * Firestore Security Rules Specification Tests (Phase 0 TDD)
 * Evaluates the "Dirty Dozen" attack vectors against firestore.rules.
 */
export interface DirtyDozenCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  payload: Record<string, unknown>;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Self-Credit Signup',
    collection: 'users/{uid}',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { balance: 5000, isDeviceVerified: false, verifiedMarketIds: [] },
  },
  {
    id: 2,
    name: 'Self-Verify Device',
    collection: 'users/{uid}',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { isDeviceVerified: true },
  },
  {
    id: 3,
    name: 'Self-Verify Markets',
    collection: 'users/{uid}',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { verifiedMarketIds: [1, 2, 3] },
  },
  {
    id: 4,
    name: 'Unpaired Balance Inflation',
    collection: 'users/{uid}',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { balance: 99999, lastActionRef: 'FAKE_REF' },
  },
  {
    id: 5,
    name: 'Shadow Ghost Field on User',
    collection: 'users/{uid}',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { role: 'admin', balance: 0 },
  },
  {
    id: 6,
    name: 'Privilege Escalation via admins',
    collection: 'admins/{uid}',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { uid: 'attacker', email: 'attacker@example.com' },
  },
  {
    id: 7,
    name: 'Unverified Email Admin Spoof',
    collection: 'settings/admin_auth',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    payload: { email: 'bakar123abu123@gmail.com', email_verified: false },
  },
  {
    id: 8,
    name: 'Trade Amount Over-Limit',
    collection: 'trades/{tradeId}',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    payload: { amount: 50000, status: 'OPEN' },
  },
  {
    id: 9,
    name: 'Double Trade Settlement',
    collection: 'trades/{tradeId}',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'WON', payout: 200 },
  },
  {
    id: 10,
    name: 'Self-Approve Deposit',
    collection: 'deposits/{depositId}',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    payload: { status: 'APPROVED' },
  },
  {
    id: 11,
    name: 'Blanket List of Deposits',
    collection: 'deposits',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    payload: { queryWithoutUserFilter: true },
  },
  {
    id: 12,
    name: 'Read Admin Auth Hash by Trader',
    collection: 'settings/admin_auth',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    payload: { uid: 'trader-uid' },
  },
];
