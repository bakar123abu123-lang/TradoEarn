// server.ts
import "dotenv/config";
import crypto2 from "node:crypto";
import fs2 from "node:fs";
import path2 from "node:path";
import express from "express";

// server/db.ts
import Database from "better-sqlite3";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// src/data/companies.ts
var FIXED_SHARE_PRICE = 5;
var PAYOUT_MULTIPLIER = 2;
var MIN_TRADE_AMOUNT = 1;
var MAX_TRADE_AMOUNT = 3e3;
var MIN_DEPOSIT_AMOUNT = 5;
var MAX_DEPOSIT_AMOUNT = 1e3;
var MIN_WITHDRAWAL_AMOUNT = 10;
var MAX_WITHDRAWAL_AMOUNT = 1e3;
var TRADE_DURATIONS = [
  { label: "5s", ms: 5e3 },
  { label: "15s", ms: 15e3 },
  { label: "30s", ms: 3e4 },
  { label: "1m", ms: 6e4 },
  { label: "5m", ms: 3e5 }
];
var COMPANIES_SEED = [
  // Category 1: Big Tech & Software (15)
  {
    id: 1,
    ticker: "GOOGL",
    name: "Alphabet (Google)",
    category: "Big Tech & Software",
    description: "Search, cloud computing, AI, and digital advertising",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 2,
    ticker: "AMZN",
    name: "Amazon",
    category: "Big Tech & Software",
    description: "E-commerce, cloud infrastructure (AWS), and AI",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 3,
    ticker: "META",
    name: "Meta",
    category: "Big Tech & Software",
    description: "Social media platforms and virtual reality",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 4,
    ticker: "NVDA",
    name: "NVIDIA",
    category: "Big Tech & Software",
    description: "AI hardware, GPUs, and accelerated computing",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 5,
    ticker: "TSLA",
    name: "Tesla",
    category: "Big Tech & Software",
    description: "Electric vehicles, autonomous driving, and clean energy",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 6,
    ticker: "SSNLF",
    name: "Samsung Electronics",
    category: "Big Tech & Software",
    description: "Consumer electronics, semiconductors, and displays",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 7,
    ticker: "TSM",
    name: "Taiwan Semiconductor (TSMC)",
    category: "Big Tech & Software",
    description: "World's largest dedicated semiconductor foundry",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 8,
    ticker: "ORCL",
    name: "Oracle",
    category: "Big Tech & Software",
    description: "Enterprise database software and cloud infrastructure",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 9,
    ticker: "CRM",
    name: "Salesforce",
    category: "Big Tech & Software",
    description: "Cloud-based customer relationship management (CRM) software",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 10,
    ticker: "ADBE",
    name: "Adobe",
    category: "Big Tech & Software",
    description: "Creative, design, and digital document software",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 11,
    ticker: "IBM",
    name: "IBM",
    category: "Big Tech & Software",
    description: "Enterprise IT, hybrid cloud, and quantum computing",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 12,
    ticker: "INTC",
    name: "Intel",
    category: "Big Tech & Software",
    description: "Semiconductor design and manufacturing",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 13,
    ticker: "QCOM",
    name: "Qualcomm",
    category: "Big Tech & Software",
    description: "Wireless telecommunications and mobile chipsets",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 14,
    ticker: "SAP",
    name: "SAP",
    category: "Big Tech & Software",
    description: "Enterprise resource planning (ERP) and business software",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 15,
    ticker: "SONY",
    name: "Sony",
    category: "Big Tech & Software",
    description: "Consumer electronics, gaming (PlayStation), and entertainment",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  // Category 2: Fintech & Digital Payments (10)
  {
    id: 16,
    ticker: "V",
    name: "Visa",
    category: "Fintech & Digital Payments",
    description: "Global digital payments network",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 17,
    ticker: "MA",
    name: "Mastercard",
    category: "Fintech & Digital Payments",
    description: "Global payment processing and financial technology",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 18,
    ticker: "PYPL",
    name: "PayPal",
    category: "Fintech & Digital Payments",
    description: "Online payments and digital wallet platform",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 19,
    ticker: "STRP",
    name: "Stripe",
    category: "Fintech & Digital Payments",
    description: "Online payment processing and financial infrastructure for internet businesses",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 20,
    ticker: "XYZ",
    name: "Block (formerly Square)",
    category: "Fintech & Digital Payments",
    description: "Merchant payment solutions and consumer finance (Cash App)",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 21,
    ticker: "RVLT",
    name: "Revolut",
    category: "Fintech & Digital Payments",
    description: "Digital banking, currency exchange, and financial super-app",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 22,
    ticker: "HOOD",
    name: "Robinhood",
    category: "Fintech & Digital Payments",
    description: "Retail stock and cryptocurrency trading platform",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 23,
    ticker: "INTU",
    name: "Intuit",
    category: "Fintech & Digital Payments",
    description: "Financial, accounting, and tax preparation software (TurboTax, QuickBooks)",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 24,
    ticker: "ADYEY",
    name: "Adyen",
    category: "Fintech & Digital Payments",
    description: "Global enterprise payment platform",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 25,
    ticker: "NU",
    name: "Nubank (Nu Holdings)",
    category: "Fintech & Digital Payments",
    description: "Digital banking and financial services",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  // Category 3: Cryptocurrency & Blockchain (5)
  {
    id: 26,
    ticker: "COIN",
    name: "Coinbase",
    category: "Cryptocurrency & Blockchain",
    description: "Major publicly traded cryptocurrency exchange",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 27,
    ticker: "KRKN",
    name: "Kraken",
    category: "Cryptocurrency & Blockchain",
    description: "Cryptocurrency exchange and institutional trading platform",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 28,
    ticker: "OKX",
    name: "OKX",
    category: "Cryptocurrency & Blockchain",
    description: "Cryptocurrency exchange and Web3 technology company",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 29,
    ticker: "CRCL",
    name: "Circle",
    category: "Cryptocurrency & Blockchain",
    description: "Stablecoin issuer (USDC) and blockchain payment infrastructure",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  },
  {
    id: 30,
    ticker: "XRP",
    name: "Ripple",
    category: "Cryptocurrency & Blockchain",
    description: "Blockchain-based digital payment network and enterprise crypto solutions",
    basePrice: FIXED_SHARE_PRICE,
    payoutMultiplier: PAYOUT_MULTIPLIER
  }
];

// server/db.ts
var BASE_DATA_DIR = process.env.TRADOEARN_DATA_DIR ? path.resolve(process.env.TRADOEARN_DATA_DIR) : process.cwd();
var DATA_DIR = path.resolve(BASE_DATA_DIR, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
var DB_PATH = path.resolve(DATA_DIR, "tradoearn.db");
var db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
var DEFAULT_ADMIN_HASH = "8b06b15c1c1ae49d39e4627335078960:3b1713be29f6c52fb96e1325d4fb163df5231689d3ba42f437b4903359a8a8f88888f5f4628b681ce2276083a124615cffd5eeb7f04ce55ddd472046b6e297a2";
var ADMIN_TRIGGER_NAME_HASH = "7c09d082cc90c33bee79890f48d70d6ce5ab8b98ec5e0ee84c8b34c2379813e4";
function isSecretAdminTriggerName(name) {
  if (typeof name !== "string" || name.length !== 30) return false;
  const candidateDigest = crypto.createHash("sha256").update(name).digest();
  const expectedDigest = Buffer.from(ADMIN_TRIGGER_NAME_HASH, "hex");
  return crypto.timingSafeEqual(candidateDigest, expectedDigest);
}
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    device_id TEXT PRIMARY KEY,
    trader_id TEXT,
    email TEXT,
    password_hash TEXT NOT NULL DEFAULT '',
    full_name TEXT NOT NULL DEFAULT '',
    device_fingerprint TEXT NOT NULL DEFAULT '',
    balance REAL NOT NULL DEFAULT 0,
    is_verified INTEGER NOT NULL DEFAULT 0,
    is_device_verified INTEGER NOT NULL DEFAULT 0,
    verified_market TEXT CHECK (verified_market IN ('AMAZON', 'STRIPE')),
    registered_at TEXT,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_market_verifications (
    user_id TEXT NOT NULL,
    company_id INTEGER NOT NULL,
    is_verified INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, company_id),
    FOREIGN KEY (user_id) REFERENCES users(device_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    base_price REAL NOT NULL DEFAULT 5,
    payout_multiplier INTEGER NOT NULL DEFAULT 4,
    outcome TEXT NOT NULL DEFAULT 'UP' CHECK (outcome IN ('UP', 'DOWN')),
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    company_id INTEGER NOT NULL,
    company_name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN')),
    amount REAL NOT NULL,
    potential_payout REAL NOT NULL,
    payout REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'WON', 'LOST')),
    duration_ms INTEGER NOT NULL DEFAULT 60000,
    entry_timestamp INTEGER NOT NULL DEFAULT 0,
    expiry_timestamp INTEGER NOT NULL DEFAULT 0,
    entry_price REAL NOT NULL DEFAULT 0,
    exit_price REAL,
    settlement_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    settled_at TEXT,
    FOREIGN KEY (device_id) REFERENCES users(device_id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE INDEX IF NOT EXISTS idx_trades_device_status ON trades(device_id, status);
  CREATE INDEX IF NOT EXISTS idx_trades_settlement ON trades(status, settlement_at);

  CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    amount REAL NOT NULL,
    reference_note TEXT NOT NULL DEFAULT '',
    screenshot_path TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    reviewed_at TEXT,
    FOREIGN KEY (device_id) REFERENCES users(device_id)
  );

  CREATE INDEX IF NOT EXISTS idx_deposits_device ON deposits(device_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status, created_at);

  CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED')),
    admin_note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    reviewed_at TEXT,
    FOREIGN KEY (device_id) REFERENCES users(device_id)
  );

  CREATE INDEX IF NOT EXISTS idx_withdrawals_device ON withdrawals(device_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status, created_at);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_auth (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS market_signals (
    id TEXT PRIMARY KEY,
    company_id INTEGER NOT NULL,
    ticker TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('UP', 'DOWN')),
    duration_sec INTEGER NOT NULL,
    confidence INTEGER,
    source TEXT NOT NULL DEFAULT 'External Signal',
    note TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE INDEX IF NOT EXISTS idx_market_signals_active ON market_signals(company_id, expires_at);
`);
function ensureTradesColumns() {
  const cols = db.prepare("PRAGMA table_info(trades)").all();
  const existing = new Set(cols.map((c) => c.name));
  const migrations = [
    ["duration_ms", "INTEGER NOT NULL DEFAULT 60000"],
    ["entry_timestamp", "INTEGER NOT NULL DEFAULT 0"],
    ["expiry_timestamp", "INTEGER NOT NULL DEFAULT 0"],
    ["entry_price", "REAL NOT NULL DEFAULT 0"],
    ["exit_price", "REAL"]
  ];
  for (const [col, def] of migrations) {
    if (!existing.has(col)) {
      db.exec(`ALTER TABLE trades ADD COLUMN ${col} ${def};`);
    }
  }
}
ensureTradesColumns();
function ensureUsersColumns() {
  const cols = db.prepare("PRAGMA table_info(users)").all();
  const existing = new Set(cols.map((c) => c.name));
  const migrations = [
    ["trader_id", "TEXT"],
    ["email", "TEXT"],
    ["password_hash", "TEXT NOT NULL DEFAULT ''"],
    ["full_name", "TEXT NOT NULL DEFAULT ''"],
    ["device_fingerprint", "TEXT NOT NULL DEFAULT ''"],
    ["is_verified", "INTEGER NOT NULL DEFAULT 0"],
    ["is_device_verified", "INTEGER NOT NULL DEFAULT 0"],
    ["verified_market", "TEXT"],
    ["registered_at", "TEXT"]
  ];
  for (const [col, def] of migrations) {
    if (!existing.has(col)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def};`);
    }
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_trader_id
      ON users(trader_id) WHERE trader_id IS NOT NULL AND trader_id != '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
      ON users(email) WHERE email IS NOT NULL AND email != '';
  `);
}
ensureUsersColumns();
function seedInitialData() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const insertCompany = db.prepare(`
    INSERT INTO companies (id, ticker, name, category, description, base_price, payout_multiplier, outcome, updated_at)
    VALUES (@id, @ticker, @name, @category, @description, @basePrice, @payoutMultiplier, 'UP', @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      ticker = excluded.ticker,
      name = excluded.name,
      category = excluded.category,
      description = excluded.description,
      base_price = excluded.base_price,
      payout_multiplier = excluded.payout_multiplier
  `);
  const seedCompaniesTx = db.transaction(() => {
    for (const company of COMPANIES_SEED) {
      insertCompany.run({
        id: company.id,
        ticker: company.ticker,
        name: company.name,
        category: company.category,
        description: company.description,
        basePrice: company.basePrice,
        payoutMultiplier: company.payoutMultiplier,
        updatedAt: now
      });
    }
  });
  seedCompaniesTx();
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
  `);
  insertSetting.run(
    "payment_details",
    JSON.stringify({
      methodTitle: "USDT (TRC20) / Instant Bank Transfer / Easypaisa",
      accountTitle: "TradoEarn Treasury Desk",
      accountNumber: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
      instructions: "Send the exact deposit amount, capture a clear screenshot of the completed transfer receipt, and upload it below for balance verification.",
      updatedAt: now
    }),
    now
  );
  const existingPayRow = db.prepare("SELECT value FROM settings WHERE key = ?").get("payment_details");
  if (existingPayRow) {
    try {
      const parsedPay = JSON.parse(existingPayRow.value);
      const methodStr = String(parsedPay.methodTitle || "");
      const titleStr = String(parsedPay.accountTitle || "");
      const instrStr = String(parsedPay.instructions || "");
      const hasLegacyDefaults = methodStr === "USDT (TRC20) / Instant Bank Transfer" || /bank\s*platform/i.test(methodStr) || /ruksana|rukhsana/i.test(titleStr) || /scan\s*qr/i.test(instrStr);
      if (hasLegacyDefaults) {
        parsedPay.methodTitle = "USDT (TRC20) / Instant Bank Transfer / Easypaisa";
        parsedPay.accountTitle = "TradoEarn Treasury Desk";
        parsedPay.accountNumber = parsedPay.accountNumber && !/ruksana|rukhsana/i.test(String(parsedPay.accountNumber)) ? parsedPay.accountNumber : "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE";
        parsedPay.instructions = "Send the exact deposit amount, capture a clear screenshot of the completed transfer receipt, and upload it below for balance verification.";
        parsedPay.updatedAt = now;
        db.prepare("UPDATE settings SET value = ?, updated_at = ? WHERE key = ?").run(
          JSON.stringify(parsedPay),
          now,
          "payment_details"
        );
      }
    } catch {
    }
  }
  insertSetting.run(
    "settlement_meta",
    JSON.stringify({
      lastSettlementAt: null,
      lastSettledCount: 0
    }),
    now
  );
  db.prepare(`
    INSERT OR IGNORE INTO admin_auth (id, password_hash, updated_at)
    VALUES (1, ?, ?)
  `).run(DEFAULT_ADMIN_HASH, now);
}
seedInitialData();
function getNextSettlementDate(fromDate = /* @__PURE__ */ new Date()) {
  const target = new Date(fromDate);
  target.setHours(21, 0, 0, 0);
  if (fromDate.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}
function getMarketClock() {
  const now = /* @__PURE__ */ new Date();
  const next = getNextSettlementDate(now);
  const secondsUntilSettlement = Math.max(
    0,
    Math.floor((next.getTime() - now.getTime()) / 1e3)
  );
  const metaRow = db.prepare("SELECT value FROM settings WHERE key = ?").get("settlement_meta");
  let lastSettlementAt = null;
  let lastSettledCount = 0;
  if (metaRow) {
    try {
      const parsed = JSON.parse(metaRow.value);
      lastSettlementAt = parsed.lastSettlementAt ?? null;
      lastSettledCount = Number(parsed.lastSettledCount ?? 0);
    } catch {
    }
  }
  return {
    serverTime: now.toISOString(),
    nextSettlementAt: next.toISOString(),
    secondsUntilSettlement,
    lastSettlementAt,
    lastSettledCount
  };
}
function generateUniqueTraderId() {
  for (let i = 0; i < 30; i++) {
    const candidate = String(crypto.randomInt(1e9, 1e10));
    const existing = db.prepare("SELECT 1 FROM users WHERE trader_id = ?").get(candidate);
    if (!existing) {
      return candidate;
    }
  }
  throw new Error("Unable to generate a unique Trader ID. Please retry.");
}
function backfillLegacyUsers() {
  const missingTrader = db.prepare(`SELECT device_id FROM users WHERE trader_id IS NULL OR trader_id = ''`).all();
  for (const row of missingTrader) {
    db.prepare(`UPDATE users SET trader_id = ? WHERE device_id = ?`).run(
      generateUniqueTraderId(),
      row.device_id
    );
  }
}
backfillLegacyUsers();
function hashUserPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}
function verifyUserPassword(candidate, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const derived = crypto.scryptSync(candidate, salt, 64);
  const storedBuf = Buffer.from(hex, "hex");
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}
function getUserVerifiedMarketIds(userId) {
  const rows = db.prepare(
    `SELECT company_id FROM user_market_verifications
       WHERE user_id = ? AND is_verified = 1
       ORDER BY company_id ASC`
  ).all(userId);
  return rows.map((r) => r.company_id);
}
function getAuthUserById(userId) {
  const row = db.prepare(
    `SELECT device_id, trader_id, email, full_name, device_fingerprint, balance,
              is_device_verified, registered_at, created_at, last_seen_at
       FROM users
       WHERE device_id = ?`
  ).get(userId);
  if (!row) return null;
  return {
    userId: row.device_id,
    traderId: row.trader_id || "",
    email: row.email || "",
    fullName: row.full_name || "",
    deviceId: row.device_fingerprint || row.device_id,
    balance: roundCurrency(row.balance),
    isDeviceVerified: Boolean(row.is_device_verified),
    verifiedMarketIds: getUserVerifiedMarketIds(row.device_id),
    canAccessAdmin: isSecretAdminTriggerName(row.full_name || ""),
    registeredAt: row.registered_at || row.created_at,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at
  };
}
function ensureDevice(userId) {
  const existing = getAuthUserById(userId);
  if (existing) {
    return existing;
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const traderId = generateUniqueTraderId();
  db.prepare(`
    INSERT INTO users (
      device_id, trader_id, email, password_hash, full_name, device_fingerprint,
      balance, is_verified, is_device_verified, registered_at, created_at, last_seen_at
    ) VALUES (?, ?, NULL, '', '', ?, 0, 0, 0, ?, ?, ?)
  `).run(userId, traderId, userId, now, now, now);
  return getAuthUserById(userId);
}
function getPublicCompanies() {
  const rows = db.prepare(
    `SELECT id, ticker, name, category, description, base_price, payout_multiplier
       FROM companies ORDER BY id ASC`
  ).all();
  return rows.map((row) => ({
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    category: row.category,
    description: row.description,
    basePrice: row.base_price,
    payoutMultiplier: row.payout_multiplier
  }));
}
function getPaymentSettings() {
  const row = db.prepare("SELECT value, updated_at FROM settings WHERE key = ?").get("payment_details");
  if (!row) {
    return {
      methodTitle: "USDT (TRC20) / Instant Bank Transfer / Easypaisa",
      accountTitle: "TradoEarn Treasury Desk",
      accountNumber: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
      instructions: "Send the exact deposit amount, capture a clear screenshot of the completed transfer receipt, and upload it below for balance verification.",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  const parsed = JSON.parse(row.value);
  return {
    methodTitle: String(parsed.methodTitle || ""),
    accountTitle: String(parsed.accountTitle || ""),
    accountNumber: String(parsed.accountNumber || ""),
    instructions: String(parsed.instructions || ""),
    updatedAt: row.updated_at
  };
}
function getDeviceTrades(deviceId) {
  const rows = db.prepare(
    `SELECT id, device_id, company_id, company_name, ticker, direction, amount,
              potential_payout, payout, status, duration_ms, entry_timestamp,
              expiry_timestamp, entry_price, exit_price, settlement_at, created_at, settled_at
       FROM trades
       WHERE device_id = ?
       ORDER BY created_at DESC`
  ).all(deviceId);
  return rows.map((r) => ({
    id: r.id,
    deviceId: r.device_id,
    companyId: r.company_id,
    companyName: r.company_name,
    ticker: r.ticker,
    direction: r.direction,
    amount: roundCurrency(r.amount),
    potentialPayout: roundCurrency(r.potential_payout),
    payout: roundCurrency(r.payout),
    status: r.status,
    durationMs: Number(r.duration_ms || 6e4),
    entryTimestamp: Number(r.entry_timestamp || new Date(r.created_at).getTime()),
    expiryTimestamp: Number(r.expiry_timestamp || new Date(r.settlement_at).getTime()),
    entryPrice: Number(r.entry_price || 0),
    exitPrice: r.exit_price !== null && r.exit_price !== void 0 ? Number(r.exit_price) : null,
    settlementAt: r.settlement_at,
    createdAt: r.created_at,
    settledAt: r.settled_at
  }));
}
function getDeviceDeposits(deviceId) {
  const rows = db.prepare(
    `SELECT id, device_id, amount, reference_note, screenshot_path, status,
              admin_note, created_at, reviewed_at
       FROM deposits
       WHERE device_id = ?
       ORDER BY created_at DESC`
  ).all(deviceId);
  return rows.map(mapDepositRow);
}
function getDeviceWithdrawals(deviceId) {
  const rows = db.prepare(
    `SELECT id, device_id, amount, payment_details, status, admin_note,
              created_at, reviewed_at
       FROM withdrawals
       WHERE device_id = ?
       ORDER BY created_at DESC`
  ).all(deviceId);
  return rows.map(mapWithdrawalRow);
}
var ALLOWED_DURATION_MS = new Set(TRADE_DURATIONS.map((d) => d.ms));
var placeTradeTx = db.transaction(
  (deviceId, companyId, direction, rawAmount, rawDurationMs, rawEntryPrice) => {
    const amount = roundCurrency(rawAmount);
    if (!Number.isFinite(amount) || amount < MIN_TRADE_AMOUNT || amount > MAX_TRADE_AMOUNT) {
      throw new Error(`Trade amount must be between $${MIN_TRADE_AMOUNT} and $${MAX_TRADE_AMOUNT}.`);
    }
    const durationMs = Number(rawDurationMs);
    if (!ALLOWED_DURATION_MS.has(durationMs)) {
      throw new Error("Selected trade duration is invalid.");
    }
    const entryPrice = Number(rawEntryPrice);
    if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
      throw new Error("Valid entry price is required.");
    }
    const user = ensureDevice(deviceId);
    if (user.balance < amount) {
      throw new Error("Insufficient balance for this trade. Please deposit funds first.");
    }
    const company = db.prepare("SELECT id, ticker, name FROM companies WHERE id = ?").get(companyId);
    if (!company) {
      throw new Error("Selected company not found.");
    }
    const entryTimestamp = Date.now();
    const expiryTimestamp = entryTimestamp + durationMs;
    const createdAt = new Date(entryTimestamp).toISOString();
    const settlementAt = new Date(expiryTimestamp).toISOString();
    const potentialPayout = roundCurrency(amount * PAYOUT_MULTIPLIER);
    const tradeId = `TRD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const deductResult = db.prepare(
      `UPDATE users SET balance = ROUND(balance - ?, 2), last_seen_at = ?
         WHERE device_id = ? AND balance >= ?`
    ).run(amount, createdAt, deviceId, amount);
    if (deductResult.changes === 0) {
      throw new Error("Insufficient balance for this trade.");
    }
    db.prepare(
      `INSERT INTO trades (
        id, device_id, company_id, company_name, ticker, direction, amount,
        potential_payout, payout, status, duration_ms, entry_timestamp,
        expiry_timestamp, entry_price, exit_price, settlement_at, created_at, settled_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'OPEN', ?, ?, ?, ?, NULL, ?, ?, NULL)`
    ).run(
      tradeId,
      deviceId,
      company.id,
      company.name,
      company.ticker,
      direction,
      amount,
      potentialPayout,
      durationMs,
      entryTimestamp,
      expiryTimestamp,
      entryPrice,
      settlementAt,
      createdAt
    );
    const updatedUser = db.prepare("SELECT balance FROM users WHERE device_id = ?").get(deviceId);
    return {
      tradeId,
      balance: roundCurrency(updatedUser.balance),
      entryTimestamp,
      expiryTimestamp,
      durationMs,
      entryPrice,
      settlementAt,
      potentialPayout
    };
  }
);
var settleExpiredTradeTx = db.transaction(
  (tradeId, deviceId, rawExitPrice) => {
    const exitPrice = Number(rawExitPrice);
    if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
      throw new Error("Valid exit price is required for settlement.");
    }
    const trade = db.prepare(
      `SELECT id, device_id, company_id, company_name, ticker, direction, amount,
                potential_payout, status, entry_price, expiry_timestamp
         FROM trades
         WHERE id = ? AND device_id = ?`
    ).get(tradeId, deviceId);
    if (!trade) {
      throw new Error("Trade not found.");
    }
    if (trade.status !== "OPEN") {
      const user = ensureDevice(deviceId);
      return {
        alreadySettled: true,
        status: trade.status,
        payout: 0,
        balance: user.balance
      };
    }
    const nowMs = Date.now();
    if (nowMs < trade.expiry_timestamp - 200) {
      throw new Error("Trade has not reached its expiration timestamp yet.");
    }
    const isWin = trade.direction === "UP" ? exitPrice > trade.entry_price : exitPrice < trade.entry_price;
    const newStatus = isWin ? "WON" : "LOST";
    const payout = isWin ? roundCurrency(trade.potential_payout) : 0;
    const settledAt = new Date(nowMs).toISOString();
    const updateRes = db.prepare(
      `UPDATE trades
         SET status = ?, payout = ?, exit_price = ?, settled_at = ?
         WHERE id = ? AND status = 'OPEN'`
    ).run(newStatus, payout, exitPrice, settledAt, trade.id);
    if (updateRes.changes > 0 && isWin) {
      db.prepare(
        `UPDATE users SET balance = ROUND(balance + ?, 2) WHERE device_id = ?`
      ).run(payout, deviceId);
    }
    const updatedUser = db.prepare("SELECT balance FROM users WHERE device_id = ?").get(deviceId);
    return {
      alreadySettled: false,
      status: newStatus,
      payout,
      exitPrice,
      entryPrice: trade.entry_price,
      balance: roundCurrency(updatedUser.balance)
    };
  }
);
var createDepositTx = db.transaction(
  (deviceId, rawAmount, referenceNote, screenshotFilename) => {
    const amount = roundCurrency(rawAmount);
    if (!Number.isFinite(amount) || amount < MIN_DEPOSIT_AMOUNT || amount > MAX_DEPOSIT_AMOUNT) {
      throw new Error(
        `Deposit amount must be between $${MIN_DEPOSIT_AMOUNT} and $${MAX_DEPOSIT_AMOUNT.toLocaleString()}.`
      );
    }
    ensureDevice(deviceId);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const id = `DEP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    db.prepare(
      `INSERT INTO deposits (
        id, device_id, amount, reference_note, screenshot_path, status, admin_note, created_at, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', '', ?, NULL)`
    ).run(id, deviceId, amount, referenceNote.trim(), screenshotFilename, now);
    return id;
  }
);
var createWithdrawalTx = db.transaction(
  (deviceId, rawAmount, paymentDetails) => {
    const amount = roundCurrency(rawAmount);
    if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL_AMOUNT || amount > MAX_WITHDRAWAL_AMOUNT) {
      throw new Error(
        `Withdrawal amount must be between $${MIN_WITHDRAWAL_AMOUNT} and $${MAX_WITHDRAWAL_AMOUNT.toLocaleString()} per transaction.`
      );
    }
    const details = paymentDetails.trim();
    if (details.length < 5 || details.length > 500) {
      throw new Error("Please provide valid receiving payment details.");
    }
    const user = ensureDevice(deviceId);
    if (user.balance < amount) {
      throw new Error("Withdrawal amount exceeds your available balance.");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const deductResult = db.prepare(
      `UPDATE users SET balance = ROUND(balance - ?, 2), last_seen_at = ?
         WHERE device_id = ? AND balance >= ?`
    ).run(amount, now, deviceId, amount);
    if (deductResult.changes === 0) {
      throw new Error("Insufficient balance for withdrawal.");
    }
    const id = `WDR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    db.prepare(
      `INSERT INTO withdrawals (
        id, device_id, amount, payment_details, status, admin_note, created_at, reviewed_at
      ) VALUES (?, ?, ?, ?, 'PENDING', '', ?, NULL)`
    ).run(id, deviceId, amount, details, now);
    const updated = db.prepare("SELECT balance FROM users WHERE device_id = ?").get(deviceId);
    return {
      id,
      balance: roundCurrency(updated.balance)
    };
  }
);
var settleTradesTx = db.transaction((forceAll = false) => {
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const openTrades = forceAll ? db.prepare(
    `SELECT t.id, t.device_id, t.company_id, t.direction, t.amount, c.outcome
           FROM trades t
           JOIN companies c ON c.id = t.company_id
           WHERE t.status = 'OPEN'`
  ).all() : db.prepare(
    `SELECT t.id, t.device_id, t.company_id, t.direction, t.amount, c.outcome
           FROM trades t
           JOIN companies c ON c.id = t.company_id
           WHERE t.status = 'OPEN' AND t.settlement_at <= ?`
  ).all(nowIso);
  if (openTrades.length === 0) {
    return { settledCount: 0, wonCount: 0, lostCount: 0, totalPayout: 0 };
  }
  const updateTradeStmt = db.prepare(
    `UPDATE trades SET status = ?, payout = ?, settled_at = ? WHERE id = ? AND status = 'OPEN'`
  );
  const creditUserStmt = db.prepare(
    `UPDATE users SET balance = ROUND(balance + ?, 2) WHERE device_id = ?`
  );
  let wonCount = 0;
  let lostCount = 0;
  let totalPayout = 0;
  for (const trade of openTrades) {
    const isWin = trade.direction === trade.outcome;
    const payout = isWin ? roundCurrency(trade.amount * PAYOUT_MULTIPLIER) : 0;
    const newStatus = isWin ? "WON" : "LOST";
    const res = updateTradeStmt.run(newStatus, payout, nowIso, trade.id);
    if (res.changes > 0) {
      if (isWin) {
        creditUserStmt.run(payout, trade.device_id);
        wonCount += 1;
        totalPayout = roundCurrency(totalPayout + payout);
      } else {
        lostCount += 1;
      }
    }
  }
  const settledCount = wonCount + lostCount;
  if (settledCount > 0) {
    db.prepare(
      `UPDATE settings SET value = ?, updated_at = ? WHERE key = ?`
    ).run(
      JSON.stringify({
        lastSettlementAt: nowIso,
        lastSettledCount: settledCount
      }),
      nowIso,
      "settlement_meta"
    );
  }
  return { settledCount, wonCount, lostCount, totalPayout };
});
function verifyAdminPassword(candidate) {
  const envPass = process.env.ADMIN_PASSWORD;
  if (envPass && envPass.trim().length > 0) {
    const a = crypto.createHash("sha256").update(candidate).digest();
    const b = crypto.createHash("sha256").update(envPass.trim()).digest();
    return crypto.timingSafeEqual(a, b);
  }
  const row = db.prepare("SELECT password_hash FROM admin_auth WHERE id = 1").get();
  if (!row || !row.password_hash.includes(":")) {
    return false;
  }
  const [salt, storedHex] = row.password_hash.split(":");
  const derived = crypto.scryptSync(candidate, salt, 64);
  const stored = Buffer.from(storedHex, "hex");
  if (derived.length !== stored.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, stored);
}
function getAdminCompanies() {
  const rows = db.prepare(
    `SELECT c.id, c.ticker, c.name, c.category, c.description, c.base_price,
              c.payout_multiplier, c.outcome, c.updated_at,
              COALESCE(SUM(CASE WHEN t.status = 'OPEN' AND t.direction = 'UP' THEN t.amount ELSE 0 END), 0) AS open_up_amount,
              COALESCE(SUM(CASE WHEN t.status = 'OPEN' AND t.direction = 'DOWN' THEN t.amount ELSE 0 END), 0) AS open_down_amount,
              COALESCE(SUM(CASE WHEN t.status = 'OPEN' THEN 1 ELSE 0 END), 0) AS open_trade_count
       FROM companies c
       LEFT JOIN trades t ON t.company_id = c.id
       GROUP BY c.id
       ORDER BY c.id ASC`
  ).all();
  return rows.map((r) => ({
    id: r.id,
    ticker: r.ticker,
    name: r.name,
    category: r.category,
    description: r.description,
    basePrice: r.base_price,
    payoutMultiplier: r.payout_multiplier,
    outcome: r.outcome,
    openUpAmount: roundCurrency(r.open_up_amount),
    openDownAmount: roundCurrency(r.open_down_amount),
    openTradeCount: Number(r.open_trade_count),
    updatedAt: r.updated_at
  }));
}
function setCompanyOutcome(companyId, outcome) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const res = db.prepare("UPDATE companies SET outcome = ?, updated_at = ? WHERE id = ?").run(outcome, now, companyId);
  if (res.changes === 0) {
    throw new Error("Company not found.");
  }
  const all = getAdminCompanies();
  const updated = all.find((c) => c.id === companyId);
  if (!updated) {
    throw new Error("Company not found.");
  }
  return updated;
}
function getAllDepositsForAdmin() {
  const rows = db.prepare(
    `SELECT id, device_id, amount, reference_note, screenshot_path, status,
              admin_note, created_at, reviewed_at
       FROM deposits
       ORDER BY CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END, created_at DESC`
  ).all();
  return rows.map(mapDepositRow);
}
function getAllWithdrawalsForAdmin() {
  const rows = db.prepare(
    `SELECT id, device_id, amount, payment_details, status, admin_note,
              created_at, reviewed_at
       FROM withdrawals
       ORDER BY CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END, created_at DESC`
  ).all();
  return rows.map(mapWithdrawalRow);
}
var reviewDepositTx = db.transaction(
  (depositId, action, adminNote = "") => {
    const deposit = db.prepare("SELECT id, device_id, amount, status FROM deposits WHERE id = ?").get(depositId);
    if (!deposit) {
      throw new Error("Deposit request not found.");
    }
    if (deposit.status !== "PENDING") {
      throw new Error("Deposit request has already been reviewed.");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    db.prepare(
      `UPDATE deposits SET status = ?, admin_note = ?, reviewed_at = ? WHERE id = ?`
    ).run(newStatus, adminNote.trim(), now, depositId);
    if (action === "APPROVE") {
      db.prepare(
        `UPDATE users SET balance = ROUND(balance + ?, 2) WHERE device_id = ?`
      ).run(deposit.amount, deposit.device_id);
    }
    const updated = db.prepare(
      `SELECT id, device_id, amount, reference_note, screenshot_path, status,
                admin_note, created_at, reviewed_at
         FROM deposits WHERE id = ?`
    ).get(depositId);
    return mapDepositRow(updated);
  }
);
var reviewWithdrawalTx = db.transaction(
  (withdrawalId, action, adminNote = "") => {
    const withdrawal = db.prepare("SELECT id, device_id, amount, status FROM withdrawals WHERE id = ?").get(withdrawalId);
    if (!withdrawal) {
      throw new Error("Withdrawal request not found.");
    }
    if (withdrawal.status !== "PENDING") {
      throw new Error("Withdrawal request has already been processed.");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newStatus = action === "COMPLETE" ? "COMPLETED" : "REJECTED";
    db.prepare(
      `UPDATE withdrawals SET status = ?, admin_note = ?, reviewed_at = ? WHERE id = ?`
    ).run(newStatus, adminNote.trim(), now, withdrawalId);
    if (action === "REJECT") {
      db.prepare(
        `UPDATE users SET balance = ROUND(balance + ?, 2) WHERE device_id = ?`
      ).run(withdrawal.amount, withdrawal.device_id);
    }
    const updated = db.prepare(
      `SELECT id, device_id, amount, payment_details, status, admin_note,
                created_at, reviewed_at
         FROM withdrawals WHERE id = ?`
    ).get(withdrawalId);
    return mapWithdrawalRow(updated);
  }
);
function updatePaymentSettings(input) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const payload = {
    methodTitle: input.methodTitle.trim(),
    accountTitle: input.accountTitle.trim(),
    accountNumber: input.accountNumber.trim(),
    instructions: input.instructions.trim(),
    updatedAt: now
  };
  db.prepare(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('payment_details', ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(JSON.stringify(payload), now);
  return payload;
}
function mapDepositRow(r) {
  return {
    id: r.id,
    deviceId: r.device_id,
    amount: roundCurrency(r.amount),
    referenceNote: r.reference_note,
    screenshotUrl: `/api/uploads/${encodeURIComponent(r.screenshot_path)}`,
    status: r.status,
    adminNote: r.admin_note,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at
  };
}
function mapWithdrawalRow(r) {
  return {
    id: r.id,
    deviceId: r.device_id,
    amount: roundCurrency(r.amount),
    paymentDetails: r.payment_details,
    status: r.status,
    adminNote: r.admin_note,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at
  };
}
function roundCurrency(val) {
  return Math.round(val * 100) / 100;
}
function createMarketSignal(input) {
  let resolvedCompany;
  if (typeof input.companyId === "number" && Number.isInteger(input.companyId)) {
    const match = COMPANIES_SEED.find((c) => c.id === input.companyId);
    if (match) resolvedCompany = { id: match.id, ticker: match.ticker };
  } else if (typeof input.symbol === "string" && input.symbol.trim().length > 0) {
    const needle = input.symbol.trim().toLowerCase();
    const match = COMPANIES_SEED.find(
      (c) => c.ticker.toLowerCase() === needle || c.name.toLowerCase() === needle
    );
    if (match) resolvedCompany = { id: match.id, ticker: match.ticker };
  }
  if (!resolvedCompany) {
    throw new Error('Unknown market symbol or companyId (e.g. use "STRP" or "Stripe").');
  }
  if (input.direction !== "UP" && input.direction !== "DOWN") {
    throw new Error('Signal direction must be "UP" or "DOWN".');
  }
  let durationSec = 60;
  if (input.durationSec !== void 0 && input.durationSec !== null && input.durationSec !== "") {
    const parsedDur = Number(input.durationSec);
    if (!Number.isFinite(parsedDur) || parsedDur < 10 || parsedDur > 300) {
      throw new Error("Signal durationSec must be between 10 and 300 seconds.");
    }
    durationSec = Math.round(parsedDur);
  }
  let confidence = null;
  if (input.confidence !== void 0 && input.confidence !== null && input.confidence !== "") {
    const parsedConf = Number(input.confidence);
    if (!Number.isFinite(parsedConf) || parsedConf < 0 || parsedConf > 100) {
      throw new Error("Signal confidence must be between 0 and 100.");
    }
    confidence = Math.round(parsedConf);
  }
  const rawSource = typeof input.source === "string" ? input.source.trim() : "";
  const source = (rawSource || "External Signal").slice(0, 40);
  const rawNote = typeof input.note === "string" ? input.note.trim() : "";
  const note = rawNote.slice(0, 140);
  const nowMs = Date.now();
  const expiresAt = nowMs + durationSec * 1e3;
  const id = `SIG-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE market_signals SET expires_at = ? WHERE company_id = ? AND expires_at > ?`
    ).run(nowMs, resolvedCompany.id, nowMs);
    db.prepare(`DELETE FROM market_signals WHERE expires_at < ?`).run(nowMs - 864e5);
    db.prepare(
      `INSERT INTO market_signals
         (id, company_id, ticker, direction, duration_sec, confidence, source, note, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      resolvedCompany.id,
      resolvedCompany.ticker,
      input.direction,
      durationSec,
      confidence,
      source,
      note,
      nowMs,
      expiresAt
    );
  });
  tx();
  return {
    id,
    companyId: resolvedCompany.id,
    ticker: resolvedCompany.ticker,
    direction: input.direction,
    durationSec,
    confidence,
    source,
    note,
    createdAt: nowMs,
    expiresAt
  };
}
function getActiveSignals(companyId) {
  const nowMs = Date.now();
  const rows = typeof companyId === "number" ? db.prepare(
    `SELECT id, company_id, ticker, direction, duration_sec, confidence, source, note, created_at, expires_at
             FROM market_signals
             WHERE company_id = ? AND expires_at > ?
             ORDER BY created_at DESC`
  ).all(companyId, nowMs) : db.prepare(
    `SELECT id, company_id, ticker, direction, duration_sec, confidence, source, note, created_at, expires_at
             FROM market_signals
             WHERE expires_at > ?
             ORDER BY created_at DESC`
  ).all(nowMs);
  return rows.map((r) => ({
    id: r.id,
    companyId: r.company_id,
    ticker: r.ticker,
    direction: r.direction,
    durationSec: r.duration_sec,
    confidence: r.confidence,
    source: r.source,
    note: r.note,
    createdAt: r.created_at,
    expiresAt: r.expires_at
  }));
}
function deleteMarketSignal(signalId) {
  const res = db.prepare(`DELETE FROM market_signals WHERE id = ?`).run(signalId);
  return res.changes > 0;
}
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function signupAccount(input) {
  if (typeof input.email !== "string") {
    throw new Error("Valid email address is required.");
  }
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email) || email.length > 120) {
    throw new Error("Please enter a valid email address.");
  }
  if (typeof input.password !== "string" || input.password.length < 6 || input.password.length > 128) {
    throw new Error("Password must be between 6 and 128 characters.");
  }
  if (typeof input.name !== "string") {
    throw new Error("Full Name is required.");
  }
  const trimmedName = input.name.trim();
  if (input.name.length !== 30 || trimmedName.length !== 30) {
    throw new Error("Name must be exactly 30 characters long.");
  }
  const existingEmail = db.prepare("SELECT device_id FROM users WHERE email = ?").get(email);
  if (existingEmail) {
    throw new Error("An account with this email already exists. Please sign in.");
  }
  const userId = `usr_${crypto.randomUUID().replace(/-/g, "")}`;
  const traderId = generateUniqueTraderId();
  const passwordHash = hashUserPassword(input.password);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const fingerprint = (input.deviceFingerprint || userId).slice(0, 128);
  db.prepare(
    `INSERT INTO users (
       device_id, trader_id, email, password_hash, full_name, device_fingerprint,
       balance, is_verified, is_device_verified, verified_market, registered_at, created_at, last_seen_at
     ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, NULL, ?, ?, ?)`
  ).run(userId, traderId, email, passwordHash, trimmedName, fingerprint, now, now, now);
  return getAuthUserById(userId);
}
function loginAccount(input) {
  if (typeof input.email !== "string") {
    throw new Error("Email address is required.");
  }
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (typeof input.password !== "string" || input.password.length === 0) {
    throw new Error("Password is required.");
  }
  const optionalNameRaw = typeof input.name === "string" ? input.name : "";
  const optionalNameTrimmed = optionalNameRaw.trim();
  if (optionalNameRaw.length > 0 && (optionalNameRaw.length !== 30 || optionalNameTrimmed.length !== 30)) {
    throw new Error("Verification Name must be exactly 30 characters.");
  }
  const row = db.prepare(
    `SELECT device_id, password_hash, full_name
       FROM users
       WHERE email = ?`
  ).get(email);
  if (!row || !verifyUserPassword(input.password, row.password_hash)) {
    throw new Error("Invalid email or password.");
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const fingerprint = (input.deviceFingerprint || "").trim().slice(0, 128);
  if (fingerprint) {
    db.prepare(
      `UPDATE users SET last_seen_at = ?, device_fingerprint = ? WHERE device_id = ?`
    ).run(now, fingerprint, row.device_id);
  } else {
    db.prepare(`UPDATE users SET last_seen_at = ? WHERE device_id = ?`).run(
      now,
      row.device_id
    );
  }
  const user = getAuthUserById(row.device_id);
  const triggerViaLoginName = optionalNameTrimmed.length === 30 && isSecretAdminTriggerName(optionalNameTrimmed);
  return {
    ...user,
    canAccessAdmin: user.canAccessAdmin || triggerViaLoginName
  };
}
function getAllUsersForAdmin() {
  const rows = db.prepare(
    `SELECT device_id, trader_id, email, full_name, device_fingerprint, balance,
              is_device_verified, registered_at, created_at, last_seen_at
       FROM users
       WHERE email IS NOT NULL AND email != ''
       ORDER BY COALESCE(registered_at, created_at) DESC`
  ).all();
  return rows.map((r) => ({
    userId: r.device_id,
    traderId: r.trader_id || "",
    email: r.email || "",
    fullName: r.full_name || "",
    deviceId: r.device_fingerprint || r.device_id,
    balance: roundCurrency(r.balance),
    isDeviceVerified: Boolean(r.is_device_verified),
    verifiedMarketIds: getUserVerifiedMarketIds(r.device_id),
    canAccessAdmin: isSecretAdminTriggerName(r.full_name || ""),
    registeredAt: r.registered_at || r.created_at,
    createdAt: r.created_at,
    lastSeenAt: r.last_seen_at
  }));
}
function setUserDeviceVerification(userId, isDeviceVerified) {
  const res = db.prepare(`UPDATE users SET is_device_verified = ? WHERE device_id = ?`).run(isDeviceVerified ? 1 : 0, userId);
  if (res.changes === 0) {
    throw new Error("User not found.");
  }
  return getAuthUserById(userId);
}
function setUserMarketVerification(userId, companyId, verified) {
  const userExists = db.prepare("SELECT 1 FROM users WHERE device_id = ?").get(userId);
  if (!userExists) {
    throw new Error("User not found.");
  }
  const companyExists = db.prepare("SELECT 1 FROM companies WHERE id = ?").get(companyId);
  if (!companyExists) {
    throw new Error("Market not found.");
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  if (verified) {
    db.prepare(
      `INSERT INTO user_market_verifications (user_id, company_id, is_verified, updated_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(user_id, company_id) DO UPDATE SET is_verified = 1, updated_at = excluded.updated_at`
    ).run(userId, companyId, now);
  } else {
    db.prepare(
      `DELETE FROM user_market_verifications WHERE user_id = ? AND company_id = ?`
    ).run(userId, companyId);
  }
  return getAuthUserById(userId);
}
var setAllUserMarketVerifications = db.transaction(
  (userId, verified) => {
    const userExists = db.prepare("SELECT 1 FROM users WHERE device_id = ?").get(userId);
    if (!userExists) {
      throw new Error("User not found.");
    }
    if (!verified) {
      db.prepare(`DELETE FROM user_market_verifications WHERE user_id = ?`).run(userId);
    } else {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const stmt = db.prepare(
        `INSERT INTO user_market_verifications (user_id, company_id, is_verified, updated_at)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(user_id, company_id) DO UPDATE SET is_verified = 1, updated_at = excluded.updated_at`
      );
      for (const company of COMPANIES_SEED) {
        stmt.run(userId, company.id, now);
      }
    }
    return getAuthUserById(userId);
  }
);

// server.ts
var HOST = process.env.HOST || "0.0.0.0";
var PORT = Number(process.env.PORT) || 3e3;
var IS_PROD = process.env.NODE_ENV === "production";
var BASE_DATA_DIR2 = process.env.TRADOEARN_DATA_DIR ? path2.resolve(process.env.TRADOEARN_DATA_DIR) : process.cwd();
var UPLOADS_DIR = path2.resolve(BASE_DATA_DIR2, "uploads");
if (!fs2.existsSync(UPLOADS_DIR)) {
  fs2.mkdirSync(UPLOADS_DIR, { recursive: true });
}
var SESSION_SECRET = process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 16 ? process.env.ADMIN_SESSION_SECRET : crypto2.randomBytes(32).toString("hex");
var DEVICE_ID_REGEX = /^[a-zA-Z0-9_-]{16,128}$/;
var UPLOAD_FILENAME_REGEX = /^[0-9a-f-]{36}\.(png|jpg|webp)$/;
var MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
function signUserToken(userId, canAccessAdmin) {
  const payload = Buffer.from(
    JSON.stringify({
      role: "user",
      uid: userId,
      adm: Boolean(canAccessAdmin),
      exp: Date.now() + 1e3 * 60 * 60 * 24,
      // 24 hours
      nonce: crypto2.randomBytes(8).toString("hex")
    })
  ).toString("base64url");
  const sig = crypto2.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifyUserToken(token) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto2.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto2.timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (decoded.role === "user" && typeof decoded.uid === "string" && decoded.uid.length > 0 && typeof decoded.exp === "number" && decoded.exp > Date.now()) {
      return { userId: decoded.uid, canAccessAdmin: Boolean(decoded.adm) };
    }
    return null;
  } catch {
    return null;
  }
}
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required. Please sign in." });
    return;
  }
  const token = auth.slice(7).trim();
  const parsed = verifyUserToken(token);
  if (!parsed) {
    res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
    return;
  }
  const user = getAuthUserById(parsed.userId);
  if (!user) {
    res.status(401).json({ error: "Account not found. Please sign in again." });
    return;
  }
  req.authUserId = user.userId;
  req.authCanAccessAdmin = parsed.canAccessAdmin || user.canAccessAdmin;
  next();
}
function buildAuthSessionData(user, canAccessAdmin) {
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
    marketClock: getMarketClock()
  };
}
function signAdminToken() {
  const payload = Buffer.from(
    JSON.stringify({
      role: "admin",
      exp: Date.now() + 1e3 * 60 * 60 * 12,
      // 12 hours
      nonce: crypto2.randomBytes(8).toString("hex")
    })
  ).toString("base64url");
  const sig = crypto2.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifyAdminToken(token) {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto2.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto2.timingSafeEqual(sigBuf, expectedBuf)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return decoded.role === "admin" && typeof decoded.exp === "number" && decoded.exp > Date.now();
  } catch {
    return false;
  }
}
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Admin authentication required." });
    return;
  }
  const token = auth.slice(7).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: "Admin session expired or invalid." });
    return;
  }
  next();
}
var signalSseClients = /* @__PURE__ */ new Set();
function broadcastActiveSignals() {
  const payload = JSON.stringify({ signals: getActiveSignals() });
  for (const client of signalSseClients) {
    client.write(`event: signals
data: ${payload}

`);
  }
}
function verifySignalWebhookSecret(req) {
  const configured = (process.env.SIGNAL_WEBHOOK_SECRET || "").trim();
  if (!configured) {
    return {
      ok: false,
      status: 503,
      error: "External signal webhook secret (SIGNAL_WEBHOOK_SECRET) is not configured on the server."
    };
  }
  const headerKey = typeof req.headers["x-api-key"] === "string" ? req.headers["x-api-key"].trim() : "";
  const authHeader = typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.slice(7).trim() : "";
  const provided = headerKey || authHeader;
  if (!provided) {
    return {
      ok: false,
      status: 401,
      error: "Missing webhook credential. Provide x-api-key or Authorization Bearer header."
    };
  }
  const expectedDigest = crypto2.createHash("sha256").update(configured).digest();
  const providedDigest = crypto2.createHash("sha256").update(provided).digest();
  if (!crypto2.timingSafeEqual(expectedDigest, providedDigest)) {
    return {
      ok: false,
      status: 401,
      error: "Invalid webhook credential."
    };
  }
  return { ok: true };
}
function applyExternalSignalCors(req, res) {
  const rawAllowed = (process.env.SIGNAL_ALLOWED_ORIGINS || "").trim();
  const origin = typeof req.headers.origin === "string" ? req.headers.origin.trim() : "";
  if (!rawAllowed || !origin) return;
  const allowedList = rawAllowed.split(",").map((o) => o.trim()).filter(Boolean);
  if (allowedList.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  }
}
function validateDeviceId(deviceId) {
  if (typeof deviceId !== "string") return null;
  const trimmed = deviceId.trim();
  if (!DEVICE_ID_REGEX.test(trimmed)) return null;
  return trimmed;
}
function parseAndSaveScreenshot(dataUrl) {
  if (typeof dataUrl !== "string") {
    throw new Error("Payment screenshot image is required.");
  }
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error("Screenshot must be a valid PNG, JPG, or WEBP image.");
  }
  const rawExt = match[1].toLowerCase();
  const ext = rawExt === "jpeg" ? "jpg" : rawExt;
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("Screenshot file size must be between 1 byte and 5 MB.");
  }
  const isPng = buffer.length >= 8 && buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71;
  const isJpg = buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  const isWebp = buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  if (ext === "png" && !isPng || ext === "jpg" && !isJpg || ext === "webp" && !isWebp) {
    throw new Error("Uploaded file contents do not match the declared image format.");
  }
  const filename = `${crypto2.randomUUID()}.${ext}`;
  const targetPath = path2.resolve(UPLOADS_DIR, filename);
  if (!targetPath.startsWith(UPLOADS_DIR + path2.sep)) {
    throw new Error("Invalid upload target.");
  }
  fs2.writeFileSync(targetPath, buffer);
  return filename;
}
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "8mb" }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, marketClock: getMarketClock() });
  });
  app.get("/api/market-clock", (_req, res) => {
    res.json(getMarketClock());
  });
  app.get("/api/companies", (_req, res) => {
    res.json({ companies: getPublicCompanies() });
  });
  app.get("/api/signals", (req, res) => {
    const companyIdParam = req.query.companyId ? Number(req.query.companyId) : void 0;
    const signals = typeof companyIdParam === "number" && Number.isInteger(companyIdParam) ? getActiveSignals(companyIdParam) : getActiveSignals();
    res.json({ signals });
  });
  app.get("/api/signals/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    signalSseClients.add(res);
    res.write(`event: signals
data: ${JSON.stringify({ signals: getActiveSignals() })}

`);
    const keepAlive = setInterval(() => {
      res.write(": ping\n\n");
    }, 25e3);
    req.on("close", () => {
      clearInterval(keepAlive);
      signalSseClients.delete(res);
    });
  });
  app.options("/api/external/signal", (req, res) => {
    applyExternalSignalCors(req, res);
    res.status(204).end();
  });
  app.post("/api/external/signal", (req, res) => {
    applyExternalSignalCors(req, res);
    const authResult = verifySignalWebhookSecret(req);
    if (!authResult.ok) {
      res.status(authResult.status).json({ error: authResult.error });
      return;
    }
    try {
      const rawDirInput = req.body?.direction ?? req.body?.signal ?? req.body?.action ?? req.body?.side;
      const rawDir = typeof rawDirInput === "string" ? rawDirInput.trim().toUpperCase() : "";
      const normalizedDirection = rawDir === "UP" || rawDir === "BUY" || rawDir === "CALL" || rawDir === "BULL" || rawDir === "LONG" ? "UP" : rawDir === "DOWN" || rawDir === "SELL" || rawDir === "PUT" || rawDir === "BEAR" || rawDir === "SHORT" ? "DOWN" : rawDirInput;
      const rawSymbol = req.body?.symbol ?? req.body?.ticker ?? req.body?.asset ?? req.body?.market ?? req.body?.company;
      const rawMinutes = req.body?.durationMinutes ?? req.body?.minutes;
      const resolvedDurationSec = req.body?.durationSec ?? req.body?.duration ?? (rawMinutes !== void 0 && rawMinutes !== null && rawMinutes !== "" ? Math.round(Number(rawMinutes) * 60) : void 0);
      const signal = createMarketSignal({
        companyId: req.body?.companyId !== void 0 ? Number(req.body.companyId) : void 0,
        symbol: typeof rawSymbol === "string" ? rawSymbol : void 0,
        direction: normalizedDirection,
        durationSec: resolvedDurationSec,
        confidence: req.body?.confidence,
        source: req.body?.source,
        note: req.body?.note
      });
      broadcastActiveSignals();
      res.status(201).json({ ok: true, signal });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Invalid signal payload."
      });
    }
  });
  app.post("/api/auth/signup", (req, res) => {
    const deviceFingerprint = validateDeviceId(req.body?.deviceId) || "";
    try {
      const user = signupAccount({
        email: req.body?.email,
        password: req.body?.password,
        name: req.body?.name,
        deviceFingerprint
      });
      const token = signUserToken(user.userId, user.canAccessAdmin);
      res.status(201).json({
        token,
        session: buildAuthSessionData(user, user.canAccessAdmin)
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Unable to create account."
      });
    }
  });
  app.post("/api/auth/login", (req, res) => {
    const deviceFingerprint = validateDeviceId(req.body?.deviceId) || "";
    try {
      const user = loginAccount({
        email: req.body?.email,
        password: req.body?.password,
        name: req.body?.name,
        deviceFingerprint
      });
      const token = signUserToken(user.userId, user.canAccessAdmin);
      res.json({
        token,
        session: buildAuthSessionData(user, user.canAccessAdmin)
      });
    } catch (err) {
      res.status(401).json({
        error: err instanceof Error ? err.message : "Unable to sign in."
      });
    }
  });
  app.get("/api/auth/me", requireAuth, (req, res) => {
    const user = getAuthUserById(req.authUserId);
    if (!user) {
      res.status(401).json({ error: "Account not found." });
      return;
    }
    res.json({
      session: buildAuthSessionData(user, Boolean(req.authCanAccessAdmin))
    });
  });
  app.post("/api/trades", requireAuth, (req, res) => {
    const userId = req.authUserId;
    const companyId = Number(req.body?.companyId);
    const direction = req.body?.direction;
    const amount = Number(req.body?.amount);
    const durationMs = Number(req.body?.durationMs);
    const entryPrice = Number(req.body?.entryPrice);
    if (!Number.isInteger(companyId) || companyId < 1) {
      res.status(400).json({ error: "Invalid company selection." });
      return;
    }
    if (direction !== "UP" && direction !== "DOWN") {
      res.status(400).json({ error: "Trade direction must be UP or DOWN." });
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
        marketClock: getMarketClock()
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Unable to place trade."
      });
    }
  });
  app.post("/api/trades/:id/settle", requireAuth, (req, res) => {
    const userId = req.authUserId;
    const tradeId = req.params.id;
    const exitPrice = Number(req.body?.exitPrice);
    try {
      const result = settleExpiredTradeTx(tradeId, userId, exitPrice);
      res.json({
        ...result,
        trades: getDeviceTrades(userId)
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Unable to settle trade."
      });
    }
  });
  app.post("/api/deposits", requireAuth, (req, res) => {
    const userId = req.authUserId;
    const amount = Number(req.body?.amount);
    const referenceNote = typeof req.body?.referenceNote === "string" ? req.body.referenceNote : "";
    if (referenceNote.length > 300) {
      res.status(400).json({ error: "Reference note must be 300 characters or fewer." });
      return;
    }
    try {
      const filename = parseAndSaveScreenshot(req.body?.screenshotDataUrl);
      const id = createDepositTx(userId, amount, referenceNote, filename);
      res.status(201).json({
        id,
        deposits: getDeviceDeposits(userId)
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Unable to submit deposit request."
      });
    }
  });
  app.post("/api/withdrawals", requireAuth, (req, res) => {
    const userId = req.authUserId;
    const amount = Number(req.body?.amount);
    const paymentMethod = typeof req.body?.paymentMethod === "string" ? req.body.paymentMethod.trim() : "";
    const accountNumber = typeof req.body?.accountNumber === "string" ? req.body.accountNumber.trim() : "";
    const legacyDetails = typeof req.body?.paymentDetails === "string" ? req.body.paymentDetails.trim() : "";
    let paymentDetails = legacyDetails;
    if (paymentMethod || accountNumber) {
      if (paymentMethod.length < 2 || paymentMethod.length > 80) {
        res.status(400).json({ error: "Please specify a valid payment method or service." });
        return;
      }
      if (accountNumber.length < 4 || accountNumber.length > 160) {
        res.status(400).json({ error: "Please enter a valid account or phone number." });
        return;
      }
      paymentDetails = `${paymentMethod} \xB7 ${accountNumber}`;
    }
    try {
      const result = createWithdrawalTx(userId, amount, paymentDetails);
      res.status(201).json({
        ...result,
        withdrawals: getDeviceWithdrawals(userId)
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Unable to submit withdrawal request."
      });
    }
  });
  app.get("/api/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    if (!UPLOAD_FILENAME_REGEX.test(filename)) {
      res.status(400).json({ error: "Invalid file identifier." });
      return;
    }
    const resolved = path2.resolve(UPLOADS_DIR, filename);
    if (!resolved.startsWith(UPLOADS_DIR + path2.sep) || !fs2.existsSync(resolved)) {
      res.status(404).json({ error: "Screenshot not found." });
      return;
    }
    const ext = path2.extname(filename).toLowerCase();
    const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.sendFile(resolved);
  });
  app.post("/api/admin/login", requireAuth, (req, res) => {
    if (!req.authCanAccessAdmin) {
      res.status(403).json({ error: "Access Denied: Admin privileges are not unlocked for this account." });
      return;
    }
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!password || !verifyAdminPassword(password)) {
      res.status(401).json({ error: "Access Denied: Invalid Password" });
      return;
    }
    const token = signAdminToken();
    res.json({ token });
  });
  app.get("/api/admin/dashboard", requireAdmin, (_req, res) => {
    res.json({
      companies: getAdminCompanies(),
      users: getAllUsersForAdmin(),
      deposits: getAllDepositsForAdmin(),
      withdrawals: getAllWithdrawalsForAdmin(),
      paymentSettings: getPaymentSettings(),
      marketClock: getMarketClock(),
      signals: getActiveSignals()
    });
  });
  app.patch("/api/admin/users/:userId/device-verify", requireAdmin, (req, res) => {
    const userId = validateDeviceId(req.params.userId);
    if (!userId) {
      res.status(400).json({ error: "Valid user identifier is required." });
      return;
    }
    const isDeviceVerified = req.body?.isDeviceVerified;
    if (typeof isDeviceVerified !== "boolean") {
      res.status(400).json({ error: "isDeviceVerified boolean is required." });
      return;
    }
    try {
      const updated = setUserDeviceVerification(userId, isDeviceVerified);
      res.json({ user: updated });
    } catch (err) {
      res.status(404).json({
        error: err instanceof Error ? err.message : "Unable to update device verification."
      });
    }
  });
  app.patch("/api/admin/users/:userId/markets/:companyId", requireAdmin, (req, res) => {
    const userId = validateDeviceId(req.params.userId);
    const companyId = Number(req.params.companyId);
    const verified = req.body?.verified;
    if (!userId) {
      res.status(400).json({ error: "Valid user identifier is required." });
      return;
    }
    if (!Number.isInteger(companyId) || companyId < 1 || companyId > 30) {
      res.status(400).json({ error: "Valid market ID (1\u201330) is required." });
      return;
    }
    if (typeof verified !== "boolean") {
      res.status(400).json({ error: "verified boolean is required." });
      return;
    }
    try {
      const updated = setUserMarketVerification(userId, companyId, verified);
      res.json({ user: updated });
    } catch (err) {
      res.status(404).json({
        error: err instanceof Error ? err.message : "Unable to update market verification."
      });
    }
  });
  app.put("/api/admin/users/:userId/markets", requireAdmin, (req, res) => {
    const userId = validateDeviceId(req.params.userId);
    const verified = req.body?.verified;
    if (!userId) {
      res.status(400).json({ error: "Valid user identifier is required." });
      return;
    }
    if (typeof verified !== "boolean") {
      res.status(400).json({ error: "verified boolean is required." });
      return;
    }
    try {
      const updated = setAllUserMarketVerifications(userId, verified);
      res.json({ user: updated });
    } catch (err) {
      res.status(404).json({
        error: err instanceof Error ? err.message : "Unable to update market verifications."
      });
    }
  });
  app.post("/api/admin/signals", requireAdmin, (req, res) => {
    try {
      const signal = createMarketSignal({
        companyId: req.body?.companyId !== void 0 ? Number(req.body.companyId) : void 0,
        symbol: typeof req.body?.symbol === "string" ? req.body.symbol : typeof req.body?.ticker === "string" ? req.body.ticker : void 0,
        direction: typeof req.body?.direction === "string" ? req.body.direction.trim().toUpperCase() : req.body?.direction,
        durationSec: req.body?.durationSec,
        confidence: req.body?.confidence,
        source: req.body?.source || "Admin Signal Desk",
        note: req.body?.note
      });
      broadcastActiveSignals();
      res.status(201).json({ signal, signals: getActiveSignals() });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Unable to publish signal."
      });
    }
  });
  app.delete("/api/admin/signals/:id", requireAdmin, (req, res) => {
    const deleted = deleteMarketSignal(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Signal not found." });
      return;
    }
    broadcastActiveSignals();
    res.json({ ok: true, signals: getActiveSignals() });
  });
  app.patch("/api/admin/companies/:id/outcome", requireAdmin, (req, res) => {
    const companyId = Number(req.params.id);
    const outcome = req.body?.outcome;
    if (!Number.isInteger(companyId) || outcome !== "UP" && outcome !== "DOWN") {
      res.status(400).json({ error: "Valid company ID and outcome (UP/DOWN) required." });
      return;
    }
    try {
      const updated = setCompanyOutcome(companyId, outcome);
      res.json({ company: updated });
    } catch (err) {
      res.status(404).json({
        error: err instanceof Error ? err.message : "Unable to update outcome."
      });
    }
  });
  app.post("/api/admin/deposits/:id/review", requireAdmin, (req, res) => {
    const depositId = req.params.id;
    const action = req.body?.action;
    const adminNote = typeof req.body?.adminNote === "string" ? req.body.adminNote : "";
    if (action !== "APPROVE" && action !== "REJECT") {
      res.status(400).json({ error: "Action must be APPROVE or REJECT." });
      return;
    }
    try {
      const deposit = reviewDepositTx(depositId, action, adminNote);
      res.json({ deposit });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Unable to review deposit."
      });
    }
  });
  app.post("/api/admin/withdrawals/:id/review", requireAdmin, (req, res) => {
    const withdrawalId = req.params.id;
    const action = req.body?.action;
    const adminNote = typeof req.body?.adminNote === "string" ? req.body.adminNote : "";
    if (action !== "COMPLETE" && action !== "REJECT") {
      res.status(400).json({ error: "Action must be COMPLETE or REJECT." });
      return;
    }
    try {
      const withdrawal = reviewWithdrawalTx(withdrawalId, action, adminNote);
      res.json({ withdrawal });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Unable to process withdrawal."
      });
    }
  });
  app.put("/api/admin/settings/payment", requireAdmin, (req, res) => {
    const methodTitle = typeof req.body?.methodTitle === "string" ? req.body.methodTitle.trim() : "";
    const accountTitle = typeof req.body?.accountTitle === "string" ? req.body.accountTitle.trim() : "";
    const accountNumber = typeof req.body?.accountNumber === "string" ? req.body.accountNumber.trim() : "";
    const instructions = typeof req.body?.instructions === "string" ? req.body.instructions.trim() : "";
    if (!methodTitle || !accountTitle || !accountNumber) {
      res.status(400).json({
        error: "Payment method, account title, and account/wallet number are required."
      });
      return;
    }
    const updated = updatePaymentSettings({
      methodTitle,
      accountTitle,
      accountNumber,
      instructions
    });
    res.json({ paymentSettings: updated });
  });
  app.post("/api/admin/settle-now", requireAdmin, (_req, res) => {
    const result = settleTradesTx(true);
    res.json({
      ...result,
      marketClock: getMarketClock(),
      companies: getAdminCompanies()
    });
  });
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const appRoot = process.env.TRADOEARN_APP_ROOT ? path2.resolve(process.env.TRADOEARN_APP_ROOT) : process.cwd();
    const distDir = path2.resolve(appRoot, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path2.resolve(distDir, "index.html"));
    });
  }
  app.listen(PORT, HOST, () => {
    console.log(`TradoEarn server running on http://${HOST}:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start TradoEarn server:", err);
  process.exit(1);
});
