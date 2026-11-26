import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  createDepositTx,
  createMarketSignal,
  createWithdrawalTx,
  deleteMarketSignal,
  getActiveSignals,
  getAllDepositsForAdmin,
  getAllUsersForAdmin,
  getAllWithdrawalsForAdmin,
  getAdminCompanies,
  getAuthUserById,
  getDeviceDeposits,
  getDeviceTrades,
  getDeviceWithdrawals,
  getMarketClock,
  getPaymentSettings,
  getPublicCompanies,
  loginAccount,
  placeTradeTx,
  reviewDepositTx,
  reviewWithdrawalTx,
  setAllUserMarketVerifications,
  setCompanyOutcome,
  settleExpiredTradeTx,
  settleTradesTx,
  setUserDeviceVerification,
  setUserMarketVerification,
  signupAccount,
  updatePaymentSettings,
  verifyAdminPassword,
} from './server/db';
import type { AuthSessionData, UserRecord } from './src/types';

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const BASE_DATA_DIR = process.env.TRADOEARN_DATA_DIR
  ? path.resolve(process.env.TRADOEARN_DATA_DIR)
  : process.cwd();
const UPLOADS_DIR = path.resolve(BASE_DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 16
    ? process.env.ADMIN_SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

const DEVICE_ID_REGEX = /^[a-zA-Z0-9_-]{16,128}$/;
const UPLOAD_FILENAME_REGEX = /^[0-9a-f-]{36}\.(png|jpg|webp)$/;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

interface AuthedRequest extends Request {
  authUserId?: string;
  authCanAccessAdmin?: boolean;
}

function signUserToken(userId: string, canAccessAdmin: boolean): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'user',
      uid: userId,
      adm: Boolean(canAccessAdmin),
      exp: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
      nonce: crypto.randomBytes(8).toString('hex'),
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyUserToken(token: string): { userId: string; canAccessAdmin: boolean } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      decoded.role === 'user' &&
      typeof decoded.uid === 'string' &&
      decoded.uid.length > 0 &&
      typeof decoded.exp === 'number' &&
      decoded.exp > Date.now()
    ) {
      return { userId: decoded.uid, canAccessAdmin: Boolean(decoded.adm) };
    }
    return null;
  } catch {
    return null;
  }
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const token = auth.slice(7).trim();
  const parsed = verifyUserToken(token);
  if (!parsed) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  const user = getAuthUserById(parsed.userId);
  if (!user) {
    res.status(401).json({ error: 'Account not found. Please sign in again.' });
    return;
  }
  req.authUserId = user.userId;
  req.authCanAccessAdmin = parsed.canAccessAdmin || user.canAccessAdmin;
  next();
}

function buildAuthSessionData(user: UserRecord, canAccessAdmin: boolean): AuthSessionData {
  return {
    userId: user.userId,
    traderId: user.traderId,
    email: user.email,
    fullName: user.fullName,
    deviceId: user.deviceId,
    isDeviceVerified: user.isDeviceVerified,
    verifiedMarketIds: user.verifiedMarketIds,
    canAccessAdmin,
    balance: user.balance,
    trades: getDeviceTrades(user.userId),
    deposits: getDeviceDeposits(user.userId),
    withdrawals: getDeviceWithdrawals(user.userId),
    paymentSettings: getPaymentSettings(),
    marketClock: getMarketClock(),
  };
}

function signAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Date.now() + 1000 * 60 * 60 * 12, // 12 hours
      nonce: crypto.randomBytes(8).toString('hex'),
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }
  const token = auth.slice(7).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Admin session expired or invalid.' });
    return;
  }
  next();
}

const signalSseClients = new Set<Response>();

function broadcastActiveSignals() {
  const payload = JSON.stringify({ signals: getActiveSignals() });
  for (const client of signalSseClients) {
    client.write(`event: signals\ndata: ${payload}\n\n`);
  }
}

function verifySignalWebhookSecret(req: Request): { ok: true } | { ok: false; status: number; error: string } {
  const configured = (process.env.SIGNAL_WEBHOOK_SECRET || '').trim();
  if (!configured) {
    return {
      ok: false,
      status: 503,
      error: 'External signal webhook secret (SIGNAL_WEBHOOK_SECRET) is not configured on the server.',
    };
  }

  const headerKey = typeof req.headers['x-api-key'] === 'string' ? req.headers['x-api-key'].trim() : '';
  const authHeader =
    typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : '';
  const provided = headerKey || authHeader;

  if (!provided) {
    return {
      ok: false,
      status: 401,
      error: 'Missing webhook credential. Provide x-api-key or Authorization Bearer header.',
    };
  }

  const expectedDigest = crypto.createHash('sha256').update(configured).digest();
  const providedDigest = crypto.createHash('sha256').update(provided).digest();
  if (!crypto.timingSafeEqual(expectedDigest, providedDigest)) {
    return {
      ok: false,
      status: 401,
      error: 'Invalid webhook credential.',
    };
  }

  return { ok: true };
}

function applyExternalSignalCors(req: Request, res: Response) {
  const rawAllowed = (process.env.SIGNAL_ALLOWED_ORIGINS || '').trim();
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin.trim() : '';
  if (!rawAllowed || !origin) return;

  const allowedList = rawAllowed
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowedList.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  }
}

function validateDeviceId(deviceId: unknown): string | null {
  if (typeof deviceId !== 'string') return null;
  const trimmed = deviceId.trim();
  if (!DEVICE_ID_REGEX.test(trimmed)) return null;
  return trimmed;
}

function parseAndSaveScreenshot(dataUrl: unknown): string {
  if (typeof dataUrl !== 'string') {
    throw new Error('Payment screenshot image is required.');
  }
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error('Screenshot must be a valid PNG, JPG, or WEBP image.');
  }

  const rawExt = match[1].toLowerCase();
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const buffer = Buffer.from(match[2], 'base64');

  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error('Screenshot file size must be between 1 byte and 5 MB.');
  }

  // Verify image magic bytes
  const isPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  const isJpg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isWebp =
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP';

  if ((ext === 'png' && !isPng) || (ext === 'jpg' && !isJpg) || (ext === 'webp' && !isWebp)) {
    throw new Error('Uploaded file contents do not match the declared image format.');
  }

  const filename = `${crypto.randomUUID()}.${ext}`;
  const targetPath = path.resolve(UPLOADS_DIR, filename);
  if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
    throw new Error('Invalid upload target.');
  }

  fs.writeFileSync(targetPath, buffer);
  return filename;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Health & Market Clock
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, marketClock: getMarketClock() });
  });

  app.get('/api/market-clock', (_req, res) => {
    res.json(getMarketClock());
  });

  // Public 30-company catalog (never includes admin outcomes)
  app.get('/api/companies', (_req, res) => {
    res.json({ companies: getPublicCompanies() });
  });

  // Active incoming 1-minute market signals for chart display
  app.get('/api/signals', (req, res) => {
    const companyIdParam = req.query.companyId ? Number(req.query.companyId) : undefined;
    const signals =
      typeof companyIdParam === 'number' && Number.isInteger(companyIdParam)
        ? getActiveSignals(companyIdParam)
        : getActiveSignals();
    res.json({ signals });
  });

  // Real-time SSE stream for instant incoming signal updates
  app.get('/api/signals/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    signalSseClients.add(res);
    res.write(`event: signals\ndata: ${JSON.stringify({ signals: getActiveSignals() })}\n\n`);

    const keepAlive = setInterval(() => {
      res.write(': ping\n\n');
    }, 25_000);

    req.on('close', () => {
      clearInterval(keepAlive);
      signalSseClients.delete(res);
    });
  });

  // External Webhook: Receive UP/DOWN signal from another app (authenticated via SIGNAL_WEBHOOK_SECRET)
  app.options('/api/external/signal', (req, res) => {
    applyExternalSignalCors(req, res);
    res.status(204).end();
  });

  app.post('/api/external/signal', (req, res) => {
    applyExternalSignalCors(req, res);
    const authResult = verifySignalWebhookSecret(req);
    if (!authResult.ok) {
      res.status(authResult.status).json({ error: authResult.error });
      return;
    }

    try {
      const rawDirInput =
        req.body?.direction ?? req.body?.signal ?? req.body?.action ?? req.body?.side;
      const rawDir = typeof rawDirInput === 'string' ? rawDirInput.trim().toUpperCase() : '';
      const normalizedDirection =
        rawDir === 'UP' || rawDir === 'BUY' || rawDir === 'CALL' || rawDir === 'BULL' || rawDir === 'LONG'
          ? 'UP'
          : rawDir === 'DOWN' || rawDir === 'SELL' || rawDir === 'PUT' || rawDir === 'BEAR' || rawDir === 'SHORT'
            ? 'DOWN'
            : rawDirInput;

      const rawSymbol =
        req.body?.symbol ??
        req.body?.ticker ??
        req.body?.asset ??
        req.body?.market ??
        req.body?.company;

      const rawMinutes = req.body?.durationMinutes ?? req.body?.minutes;
      const resolvedDurationSec =
        req.body?.durationSec ??
        req.body?.duration ??
        (rawMinutes !== undefined && rawMinutes !== null && rawMinutes !== ''
          ? Math.round(Number(rawMinutes) * 60)
          : undefined);

      const signal = createMarketSignal({
        companyId:
          req.body?.companyId !== undefined ? Number(req.body.companyId) : undefined,
        symbol: typeof rawSymbol === 'string' ? rawSymbol : undefined,
        direction: normalizedDirection,
        durationSec: resolvedDurationSec,
        confidence: req.body?.confidence,
        source: req.body?.source,
        note: req.body?.note,
      });

      broadcastActiveSignals();
      res.status(201).json({ ok: true, signal });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Invalid signal payload.',
      });
    }
  });

  // Account Signup (Email + Password + Exact 30-Char Name + Unique 10-Digit Trader ID)
  app.post('/api/auth/signup', (req, res) => {
    const deviceFingerprint = validateDeviceId(req.body?.deviceId) || '';
    try {
      const user = signupAccount({
        email: req.body?.email,
        password: req.body?.password,
        name: req.body?.name,
        deviceFingerprint,
      });
      const token = signUserToken(user.userId, user.canAccessAdmin);
      res.status(201).json({
        token,
        session: buildAuthSessionData(user, user.canAccessAdmin),
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to create account.',
      });
    }
  });

  // Account Login (Email + Password + optional 30-Char Verification Name)
  app.post('/api/auth/login', (req, res) => {
    const deviceFingerprint = validateDeviceId(req.body?.deviceId) || '';
    try {
      const user = loginAccount({
        email: req.body?.email,
        password: req.body?.password,
        name: req.body?.name,
        deviceFingerprint,
      });
      const token = signUserToken(user.userId, user.canAccessAdmin);
      res.json({
        token,
        session: buildAuthSessionData(user, user.canAccessAdmin),
      });
    } catch (err) {
      res.status(401).json({
        error: err instanceof Error ? err.message : 'Unable to sign in.',
      });
    }
  });

  // Authenticated Session Hydration
  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    const user = getAuthUserById(req.authUserId!);
    if (!user) {
      res.status(401).json({ error: 'Account not found.' });
      return;
    }
    res.json({
      session: buildAuthSessionData(user, Boolean(req.authCanAccessAdmin)),
    });
  });

  // Execute a duration-based prediction trade
  app.post('/api/trades', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUserId!;
    const companyId = Number(req.body?.companyId);
    const direction = req.body?.direction;
    const amount = Number(req.body?.amount);
    const durationMs = Number(req.body?.durationMs);
    const entryPrice = Number(req.body?.entryPrice);

    if (!Number.isInteger(companyId) || companyId < 1) {
      res.status(400).json({ error: 'Invalid company selection.' });
      return;
    }
    if (direction !== 'UP' && direction !== 'DOWN') {
      res.status(400).json({ error: 'Trade direction must be UP or DOWN.' });
      return;
    }

    try {
      const result = placeTradeTx(
        userId,
        companyId,
        direction,
        amount,
        durationMs,
        entryPrice
      );
      res.status(201).json({
        ...result,
        trades: getDeviceTrades(userId),
        marketClock: getMarketClock(),
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to place trade.',
      });
    }
  });

  // Settle an expired trade when Date.now() >= expiryTimestamp
  app.post('/api/trades/:id/settle', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUserId!;
    const tradeId = req.params.id;
    const exitPrice = Number(req.body?.exitPrice);

    try {
      const result = settleExpiredTradeTx(tradeId, userId, exitPrice);
      res.json({
        ...result,
        trades: getDeviceTrades(userId),
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to settle trade.',
      });
    }
  });

  // Submit a deposit request with screenshot upload ($5 - $1,000)
  app.post('/api/deposits', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUserId!;
    const amount = Number(req.body?.amount);
    const referenceNote = typeof req.body?.referenceNote === 'string' ? req.body.referenceNote : '';

    if (referenceNote.length > 300) {
      res.status(400).json({ error: 'Reference note must be 300 characters or fewer.' });
      return;
    }

    try {
      const filename = parseAndSaveScreenshot(req.body?.screenshotDataUrl);
      const id = createDepositTx(userId, amount, referenceNote, filename);
      res.status(201).json({
        id,
        deposits: getDeviceDeposits(userId),
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to submit deposit request.',
      });
    }
  });

  // Submit a withdrawal request ($10 - $1,000)
  app.post('/api/withdrawals', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUserId!;
    const amount = Number(req.body?.amount);
    const paymentMethod =
      typeof req.body?.paymentMethod === 'string' ? req.body.paymentMethod.trim() : '';
    const accountNumber =
      typeof req.body?.accountNumber === 'string' ? req.body.accountNumber.trim() : '';
    const legacyDetails =
      typeof req.body?.paymentDetails === 'string' ? req.body.paymentDetails.trim() : '';

    let paymentDetails = legacyDetails;
    if (paymentMethod || accountNumber) {
      if (paymentMethod.length < 2 || paymentMethod.length > 80) {
        res.status(400).json({ error: 'Please specify a valid payment method or service.' });
        return;
      }
      if (accountNumber.length < 4 || accountNumber.length > 160) {
        res.status(400).json({ error: 'Please enter a valid account or phone number.' });
        return;
      }
      paymentDetails = `${paymentMethod} · ${accountNumber}`;
    }

    try {
      const result = createWithdrawalTx(userId, amount, paymentDetails);
      res.status(201).json({
        ...result,
        withdrawals: getDeviceWithdrawals(userId),
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to submit withdrawal request.',
      });
    }
  });

  // Safely serve uploaded payment screenshots
  app.get('/api/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    if (!UPLOAD_FILENAME_REGEX.test(filename)) {
      res.status(400).json({ error: 'Invalid file identifier.' });
      return;
    }

    const resolved = path.resolve(UPLOADS_DIR, filename);
    if (!resolved.startsWith(UPLOADS_DIR + path.sep) || !fs.existsSync(resolved)) {
      res.status(404).json({ error: 'Screenshot not found.' });
      return;
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.sendFile(resolved);
  });

  // Admin Login (strictly gated behind authenticated trigger-name check + admin password)
  app.post('/api/admin/login', requireAuth, (req: AuthedRequest, res) => {
    if (!req.authCanAccessAdmin) {
      res.status(403).json({ error: 'Access Denied: Admin privileges are not unlocked for this account.' });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password || !verifyAdminPassword(password)) {
      res.status(401).json({ error: 'Access Denied: Invalid Password' });
      return;
    }

    const token = signAdminToken();
    res.json({ token });
  });

  // Admin Dashboard Data
  app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
    res.json({
      companies: getAdminCompanies(),
      users: getAllUsersForAdmin(),
      deposits: getAllDepositsForAdmin(),
      withdrawals: getAllWithdrawalsForAdmin(),
      paymentSettings: getPaymentSettings(),
      marketClock: getMarketClock(),
      signals: getActiveSignals(),
    });
  });

  // Admin Device Verification Toggle
  app.patch('/api/admin/users/:userId/device-verify', requireAdmin, (req, res) => {
    const userId = validateDeviceId(req.params.userId);
    if (!userId) {
      res.status(400).json({ error: 'Valid user identifier is required.' });
      return;
    }
    const isDeviceVerified = req.body?.isDeviceVerified;
    if (typeof isDeviceVerified !== 'boolean') {
      res.status(400).json({ error: 'isDeviceVerified boolean is required.' });
      return;
    }

    try {
      const updated = setUserDeviceVerification(userId, isDeviceVerified);
      res.json({ user: updated });
    } catch (err) {
      res.status(404).json({
        error: err instanceof Error ? err.message : 'Unable to update device verification.',
      });
    }
  });

  // Admin Individual Market Verification Toggle (30 Markets)
  app.patch('/api/admin/users/:userId/markets/:companyId', requireAdmin, (req, res) => {
    const userId = validateDeviceId(req.params.userId);
    const companyId = Number(req.params.companyId);
    const verified = req.body?.verified;

    if (!userId) {
      res.status(400).json({ error: 'Valid user identifier is required.' });
      return;
    }
    if (!Number.isInteger(companyId) || companyId < 1 || companyId > 30) {
      res.status(400).json({ error: 'Valid market ID (1–30) is required.' });
      return;
    }
    if (typeof verified !== 'boolean') {
      res.status(400).json({ error: 'verified boolean is required.' });
      return;
    }

    try {
      const updated = setUserMarketVerification(userId, companyId, verified);
      res.json({ user: updated });
    } catch (err) {
      res.status(404).json({
        error: err instanceof Error ? err.message : 'Unable to update market verification.',
      });
    }
  });

  // Admin Bulk Verify/Revoke All 30 Markets for a User
  app.put('/api/admin/users/:userId/markets', requireAdmin, (req, res) => {
    const userId = validateDeviceId(req.params.userId);
    const verified = req.body?.verified;

    if (!userId) {
      res.status(400).json({ error: 'Valid user identifier is required.' });
      return;
    }
    if (typeof verified !== 'boolean') {
      res.status(400).json({ error: 'verified boolean is required.' });
      return;
    }

    try {
      const updated = setAllUserMarketVerifications(userId, verified);
      res.json({ user: updated });
    } catch (err) {
      res.status(404).json({
        error: err instanceof Error ? err.message : 'Unable to update market verifications.',
      });
    }
  });

  // Admin Manual Signal Trigger & Management
  app.post('/api/admin/signals', requireAdmin, (req, res) => {
    try {
      const signal = createMarketSignal({
        companyId:
          req.body?.companyId !== undefined ? Number(req.body.companyId) : undefined,
        symbol:
          typeof req.body?.symbol === 'string'
            ? req.body.symbol
            : typeof req.body?.ticker === 'string'
              ? req.body.ticker
              : undefined,
        direction:
          typeof req.body?.direction === 'string'
            ? req.body.direction.trim().toUpperCase()
            : req.body?.direction,
        durationSec: req.body?.durationSec,
        confidence: req.body?.confidence,
        source: req.body?.source || 'Admin Signal Desk',
        note: req.body?.note,
      });

      broadcastActiveSignals();
      res.status(201).json({ signal, signals: getActiveSignals() });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to publish signal.',
      });
    }
  });

  app.delete('/api/admin/signals/:id', requireAdmin, (req, res) => {
    const deleted = deleteMarketSignal(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Signal not found.' });
      return;
    }
    broadcastActiveSignals();
    res.json({ ok: true, signals: getActiveSignals() });
  });

  // Admin Company Outcome Toggle
  app.patch('/api/admin/companies/:id/outcome', requireAdmin, (req, res) => {
    const companyId = Number(req.params.id);
    const outcome = req.body?.outcome;
    if (!Number.isInteger(companyId) || (outcome !== 'UP' && outcome !== 'DOWN')) {
      res.status(400).json({ error: 'Valid company ID and outcome (UP/DOWN) required.' });
      return;
    }

    try {
      const updated = setCompanyOutcome(companyId, outcome);
      res.json({ company: updated });
    } catch (err) {
      res.status(404).json({
        error: err instanceof Error ? err.message : 'Unable to update outcome.',
      });
    }
  });

  // Admin Deposit Review
  app.post('/api/admin/deposits/:id/review', requireAdmin, (req, res) => {
    const depositId = req.params.id;
    const action = req.body?.action;
    const adminNote = typeof req.body?.adminNote === 'string' ? req.body.adminNote : '';

    if (action !== 'APPROVE' && action !== 'REJECT') {
      res.status(400).json({ error: 'Action must be APPROVE or REJECT.' });
      return;
    }

    try {
      const deposit = reviewDepositTx(depositId, action, adminNote);
      res.json({ deposit });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to review deposit.',
      });
    }
  });

  // Admin Withdrawal Review
  app.post('/api/admin/withdrawals/:id/review', requireAdmin, (req, res) => {
    const withdrawalId = req.params.id;
    const action = req.body?.action;
    const adminNote = typeof req.body?.adminNote === 'string' ? req.body.adminNote : '';

    if (action !== 'COMPLETE' && action !== 'REJECT') {
      res.status(400).json({ error: 'Action must be COMPLETE or REJECT.' });
      return;
    }

    try {
      const withdrawal = reviewWithdrawalTx(withdrawalId, action, adminNote);
      res.json({ withdrawal });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to process withdrawal.',
      });
    }
  });

  // Admin Payment Details Settings
  app.put('/api/admin/settings/payment', requireAdmin, (req, res) => {
    const methodTitle =
      typeof req.body?.methodTitle === 'string' ? req.body.methodTitle.trim() : '';
    const accountTitle =
      typeof req.body?.accountTitle === 'string' ? req.body.accountTitle.trim() : '';
    const accountNumber =
      typeof req.body?.accountNumber === 'string' ? req.body.accountNumber.trim() : '';
    const instructions =
      typeof req.body?.instructions === 'string' ? req.body.instructions.trim() : '';

    if (!methodTitle || !accountTitle || !accountNumber) {
      res.status(400).json({
        error: 'Payment method, account title, and account/wallet number are required.',
      });
      return;
    }

    const updated = updatePaymentSettings({
      methodTitle,
      accountTitle,
      accountNumber,
      instructions,
    });
    res.json({ paymentSettings: updated });
  });

  // Admin Manual Settlement Trigger (supplements automated 9:00 PM cron)
  app.post('/api/admin/settle-now', requireAdmin, (_req, res) => {
    const result = settleTradesTx(true);
    res.json({
      ...result,
      marketClock: getMarketClock(),
      companies: getAdminCompanies(),
    });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const appRoot = process.env.TRADOEARN_APP_ROOT
      ? path.resolve(process.env.TRADOEARN_APP_ROOT)
      : process.cwd();
    const distDir = path.resolve(appRoot, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`TradoEarn server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TradoEarn server:', err);
  process.exit(1);
});
