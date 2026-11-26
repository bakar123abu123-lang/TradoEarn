# TradoEarn Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **User Identity & Wallet Integrity**:
   - A `/users/{userId}` document can only be created by the matching verified Firebase user (`request.auth.uid == userId && request.auth.token.email_verified == true`), with initial `balance == 0`, `isDeviceVerified == false`, and `verifiedMarketIds.size() == 0`.
   - A user can never arbitrarily increase their `balance` or toggle `isDeviceVerified` / `verifiedMarketIds`. Every user-initiated balance change MUST occur atomically alongside a `trades/{tradeId}` or `withdrawals/{withdrawalId}` document referenced by `lastActionRef` via `getAfter(...)`.
2. **Admin Privilege Isolation**:
   - Admin access is derived exclusively from `request.auth.token.email_verified == true` matching the bootstrapped owner email or an existing `/admins/{request.auth.uid}` document—never from client claims or user-editable profile fields.
   - `/settings/admin_auth` is readable and writable exclusively by verified admins (`isAdmin()`).
3. **Trade Terminal-State Locking & Payout Bounds**:
   - A `/trades/{tradeId}` document must start in `status == 'OPEN'` with `payout == 0`, `amount` in `[1, 3000]`, and `potentialPayout == amount * 2`.
   - Once settled (`WON` or `LOST`), a non-admin cannot mutate the trade again (`existing.status == 'OPEN'`).
4. **Deposit & Withdrawal Review Locking**:
   - `/deposits/{depositId}` and `/withdrawals/{withdrawalId}` start in `PENDING` with `reviewedAt == null`.
   - Only `isAdmin()` can transition them from `PENDING` to `APPROVED`/`REJECTED` (deposits) or `COMPLETED`/`REJECTED` (withdrawals), locking immutable `userId`, `amount`, and `createdAt`.
5. **PII & Query Isolation**:
   - `list` queries on `users`, `trades`, `deposits`, and `withdrawals` explicitly enforce `resource.data.userId == request.auth.uid` for non-admins so no trader can list another trader's records.

## 2. The "Dirty Dozen" Attack Payloads
1. **Self-Credit Signup**: `POST /users/{uid}` with `balance: 5000` -> `PERMISSION_DENIED`.
2. **Self-Verify Device**: `PATCH /users/{uid}` by owner setting `isDeviceVerified: true` -> `PERMISSION_DENIED`.
3. **Self-Verify Markets**: `PATCH /users/{uid}` by owner setting `verifiedMarketIds: [1, 2, 3]` -> `PERMISSION_DENIED`.
4. **Unpaired Balance Inflation**: `PATCH /users/{uid}` by owner increasing `balance` without an atomic settled trade in `lastActionRef` -> `PERMISSION_DENIED`.
5. **Shadow Ghost Field**: `POST /users/{uid}` adding `role: "admin"` -> `PERMISSION_DENIED` (`hasOnly` rejects).
6. **Privilege Escalation**: `POST /admins/{uid}` by non-admin -> `PERMISSION_DENIED`.
7. **Unverified Email Spoof**: Write attempt with `email_verified: false` -> `PERMISSION_DENIED`.
8. **Trade Amount Over-Limit**: `POST /trades/{id}` with `amount: 50000` -> `PERMISSION_DENIED`.
9. **Double Trade Settlement**: `PATCH /trades/{id}` by owner where `existing.status == 'WON'` -> `PERMISSION_DENIED`.
10. **Self-Approve Deposit**: `PATCH /deposits/{id}` by owner setting `status: 'APPROVED'` -> `PERMISSION_DENIED`.
11. **Read Another User's Deposits**: `GET /deposits/{otherId}` or `LIST /deposits` without `where('userId', '==', uid)` -> `PERMISSION_DENIED`.
12. **Read Admin Auth Hash**: `GET /settings/admin_auth` by non-admin -> `PERMISSION_DENIED`.
