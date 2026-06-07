/**
 * EduManage CRM — Backend (MongoDB versiyasi)
 * Barcha ma'lumotlar MongoDB'da saqlanadi
 *
 * Ishga tushirish: cd backend && npm install && npm start
 */

import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, existsSync } from "fs";
import { MongoClient, ObjectId } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── .env o'qish ──────────────────────────────────────────────────────────────
const envPath = join(__dirname, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (k && !(k in process.env)) process.env[k] = v;
  }
}

const app = express();
app.use(express.json({ limit: "10mb" }));

// ─── Static fayl cache headers (tezlik uchun) ────────────────────────────────
app.use((req, res, next) => {
  const ext = (req.path.split(".").pop() || "").toLowerCase();
  if (
    ["js", "css", "ico", "png", "jpg", "webp", "woff2", "woff", "svg"].includes(
      ext,
    )
  ) {
    res.setHeader("Cache-Control", "public, max-age=86400");
  }
  next();
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ─── MongoDB Ulanish ──────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/CRM";
let db = null;
let mongoClient = null;

async function connectMongo() {
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    db = mongoClient.db();
    console.log("✅ MongoDB ulandi:", db.databaseName);

    // Indekslar yaratish
    await db.collection("kv").createIndex({ key: 1 }, { unique: true });
    await db.collection("users").createIndex({ login: 1 }, { unique: true });

    // Mavjud JSON ma'lumotlarni MongoDB ga ko'chirish
    await migrateJsonToMongo();

    return true;
  } catch (err) {
    console.error("❌ MongoDB ulanmadi:", err.message);
    return false;
  }
}

// ─── JSON → MongoDB Migration ─────────────────────────────────────────────────
async function migrateJsonToMongo() {
  // crm-data.json migratsiyasi
  const dataFile = join(__dirname, "crm-data.json");
  if (existsSync(dataFile)) {
    try {
      const data = JSON.parse(readFileSync(dataFile, "utf8"));
      const existing = await db
        .collection("crm_data")
        .findOne({ _type: "main" });
      if (!existing) {
        await db
          .collection("crm_data")
          .insertOne({ _type: "main", ...data, _migratedAt: new Date() });
        console.log("📦 crm-data.json → MongoDB (crm_data)");
      }
    } catch (e) {
      console.log("crm-data.json migration skip:", e.message);
    }
  }

  // crm-users.json migratsiyasi
  const usersFile = join(__dirname, "crm-users.json");
  if (existsSync(usersFile)) {
    try {
      const usersData = JSON.parse(readFileSync(usersFile, "utf8"));
      const existing = await db.collection("users").countDocuments();
      if (existing === 0) {
        const allUsers = [];
        if (Array.isArray(usersData.mentors)) {
          for (const u of usersData.mentors)
            allUsers.push({ ...u, _role: "mentor" });
        }
        if (Array.isArray(usersData.students)) {
          for (const u of usersData.students)
            allUsers.push({ ...u, _role: "student" });
        }
        if (allUsers.length > 0) {
          await db.collection("users").insertMany(allUsers);
          console.log(`📦 crm-users.json → MongoDB (${allUsers.length} users)`);
        }
      }
    } catch (e) {
      console.log("crm-users.json migration skip:", e.message);
    }
  }

  // crm-coins.json migratsiyasi
  const coinsFile = join(__dirname, "crm-coins.json");
  if (existsSync(coinsFile)) {
    try {
      const coinsData = JSON.parse(readFileSync(coinsFile, "utf8"));
      const existing = await db.collection("coins").findOne({ _type: "main" });
      if (!existing) {
        await db
          .collection("coins")
          .insertOne({ _type: "main", ...coinsData, _migratedAt: new Date() });
        console.log("📦 crm-coins.json → MongoDB (coins)");
      }
    } catch (e) {
      console.log("crm-coins.json migration skip:", e.message);
    }
  }

  // crm-kv.json migratsiyasi
  const kvFile = join(__dirname, "crm-kv.json");
  if (existsSync(kvFile)) {
    try {
      const kvData = JSON.parse(readFileSync(kvFile, "utf8"));
      const existing = await db.collection("kv").countDocuments();
      if (existing === 0 && Object.keys(kvData).length > 0) {
        const docs = Object.entries(kvData).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        await db.collection("kv").insertMany(docs);
        console.log(`📦 crm-kv.json → MongoDB (${docs.length} keys)`);
      }
    } catch (e) {
      console.log("crm-kv.json migration skip:", e.message);
    }
  }
}

// ─── DB Helper ────────────────────────────────────────────────────────────────
function getDb() {
  if (!db) throw new Error("MongoDB ulanmagan");
  return db;
}

// ─── Users API ────────────────────────────────────────────────────────────────
app.get("/api/users", async (_req, res) => {
  try {
    const allUsers = await getDb().collection("users").find({}).toArray();
    const mentors = allUsers
      .filter((u) => u._role === "mentor")
      .map(({ _id, _role, ...u }) => u);
    const students = allUsers
      .filter((u) => u._role === "student")
      .map(({ _id, _role, ...u }) => u);
    res.json({ ok: true, mentors, students });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/users/save", async (req, res) => {
  try {
    const { mentors, students } = req.body || {};
    if (!Array.isArray(mentors) && !Array.isArray(students))
      return res
        .status(400)
        .json({ ok: false, error: "mentors yoki students massivi kerak" });

    const col = getDb().collection("users");

    if (Array.isArray(mentors)) {
      await col.deleteMany({ _role: "mentor" });
      if (mentors.length > 0)
        await col.insertMany(mentors.map((u) => ({ ...u, _role: "mentor" })));
    }
    if (Array.isArray(students)) {
      await col.deleteMany({ _role: "student" });
      if (students.length > 0)
        await col.insertMany(students.map((u) => ({ ...u, _role: "student" })));
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── CRM Ma'lumotlari API ─────────────────────────────────────────────────────
app.get("/api/data", async (_req, res) => {
  try {
    const doc = await getDb().collection("crm_data").findOne({ _type: "main" });
    if (doc) {
      const { _id, _type, _migratedAt, ...data } = doc;
      res.json({ ok: true, data });
    } else {
      res.json({ ok: false, data: null });
    }
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/data", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object")
      return res.status(400).json({ ok: false, error: "data obyekti kerak" });

    await getDb()
      .collection("crm_data")
      .updateOne(
        { _type: "main" },
        { $set: { ...payload, _type: "main", _updatedAt: new Date() } },
        { upsert: true },
      );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── Coin Tizimi API ──────────────────────────────────────────────────────────
app.get("/api/coins", async (_req, res) => {
  try {
    // Birinchi: KV dan o'qiymiz (frontend shim shu yerga yozadi)
    const COIN_KEY = "edu_mentor_coins_v1";
    const SHOP_KEY = "edu_shop_v1";
    const PURCHASE_KEY = "edu_purchases_v1";

    const kvDocs = await getDb()
      .collection("kv")
      .find({
        key: { $in: [COIN_KEY, SHOP_KEY, PURCHASE_KEY] },
      })
      .toArray();

    const kvMap = {};
    for (const doc of kvDocs) kvMap[doc.key] = doc.value;

    let coins = {},
      shop = [],
      purchases = [];

    if (kvMap[COIN_KEY]) {
      try {
        coins = JSON.parse(kvMap[COIN_KEY]);
      } catch (e) {}
    }
    if (kvMap[SHOP_KEY]) {
      try {
        shop = JSON.parse(kvMap[SHOP_KEY]);
      } catch (e) {}
    }
    if (kvMap[PURCHASE_KEY]) {
      try {
        purchases = JSON.parse(kvMap[PURCHASE_KEY]);
      } catch (e) {}
    }

    // KV bo'sh bo'lsa fallback: dedicated coins collection
    if (!Object.keys(coins).length) {
      const doc = await getDb().collection("coins").findOne({ _type: "main" });
      if (doc) {
        const { _id, _type, _migratedAt, _updatedAt, ...rest } = doc;
        if (rest.coins) coins = rest.coins;
        if (Array.isArray(rest.shop) && rest.shop.length) shop = rest.shop;
        if (Array.isArray(rest.purchases) && rest.purchases.length)
          purchases = rest.purchases;
      }
    }

    res.json({ ok: true, coins, shop, purchases });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/coins", async (req, res) => {
  try {
    const { coins, shop, purchases } = req.body || {};
    const update = { _type: "main", _updatedAt: new Date() };
    if (coins && typeof coins === "object") update.coins = coins;
    if (Array.isArray(shop)) update.shop = shop;
    if (Array.isArray(purchases)) update.purchases = purchases;

    await getDb()
      .collection("coins")
      .updateOne({ _type: "main" }, { $set: update }, { upsert: true });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/coins/send-mentor", async (req, res) => {
  try {
    const { mentorName, amount } = req.body || {};
    if (!mentorName || !amount || amount <= 0)
      return res
        .status(400)
        .json({ ok: false, error: "mentorName va amount kerak" });

    const doc = (await getDb()
      .collection("coins")
      .findOne({ _type: "main" })) || { coins: {} };
    const updatedCoins = { ...(doc.coins || {}), ["m_" + mentorName]: amount };

    await getDb()
      .collection("coins")
      .updateOne(
        { _type: "main" },
        { $set: { coins: updatedCoins, _updatedAt: new Date() } },
        { upsert: true },
      );
    res.json({ ok: true, coins: updatedCoins });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── Universal KV Store API ───────────────────────────────────────────────────
app.get("/api/kv", async (_req, res) => {
  try {
    const docs = await getDb().collection("kv").find({}).toArray();
    const data = {};
    for (const doc of docs) data[doc.key] = doc.value;
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/kv", async (req, res) => {
  try {
    const { key, value } = req.body || {};
    if (typeof key !== "string" || !key)
      return res.status(400).json({ ok: false, error: "key kerak" });

    if (value === null || value === undefined) {
      await getDb().collection("kv").deleteOne({ key });
    } else {
      await getDb()
        .collection("kv")
        .updateOne(
          { key },
          { $set: { key, value: String(value), _updatedAt: new Date() } },
          { upsert: true },
        );
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/kv/bulk", async (req, res) => {
  try {
    const { pairs } = req.body || {};
    if (!Array.isArray(pairs))
      return res.status(400).json({ ok: false, error: "pairs massivi kerak" });

    const ops = pairs.map(({ key, value }) => ({
      updateOne: {
        filter: { key },
        update: { $set: { key, value: String(value), _updatedAt: new Date() } },
        upsert: true,
      },
    }));
    if (ops.length > 0) await getDb().collection("kv").bulkWrite(ops);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/kv/clear", async (_req, res) => {
  try {
    await getDb().collection("kv").deleteMany({});
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── MongoDB Health Check ─────────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  const tgOk =
    !!process.env.TELEGRAM_BOT_TOKEN &&
    !process.env.TELEGRAM_BOT_TOKEN.includes("your_");
  const aiOk =
    !!process.env.ANTHROPIC_API_KEY &&
    !process.env.ANTHROPIC_API_KEY.includes("your_");
  let mongoOk = false;
  let mongoInfo = {};
  try {
    await db.admin().ping();
    const stats = await db.stats();
    mongoOk = true;
    mongoInfo = { collections: stats.collections, dataSize: stats.dataSize };
  } catch (e) {}

  res.json({
    ok: true,
    service: "EduManage CRM",
    version: "3.0.0-mongodb",
    telegram: tgOk ? "✅ sozlangan" : "⚠️ sozlanmagan",
    anthropic: aiOk ? "✅ Anthropic" : "➡️ Pollinations (bepul)",
    mongodb: mongoOk ? `✅ ulangan (${db.databaseName})` : "❌ ulanmagan",
    mongoInfo,
  });
});

// ─── MongoDB Stats ────────────────────────────────────────────────────────────
app.get("/api/db/stats", async (_req, res) => {
  try {
    const cols = ["crm_data", "users", "coins", "kv"];
    const stats = {};
    for (const col of cols) {
      stats[col] = await getDb().collection(col).countDocuments();
    }
    res.json({ ok: true, stats });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── Telegram Davomat ─────────────────────────────────────────────────────────
app.post("/api/send-attendance", async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes("your_"))
    return res
      .status(500)
      .json({ ok: false, error: "TELEGRAM_BOT_TOKEN sozlanmagan" });
  const { chatId, groupName, date, rows } = req.body || {};
  if (!chatId || !groupName || !date || !Array.isArray(rows))
    return res
      .status(400)
      .json({ ok: false, error: "Majburiy: chatId, groupName, date, rows[]" });
  const lines = rows
    .map((r, i) => {
      const icon =
        r.status === "K"
          ? "✅"
          : r.status === "Y"
            ? "❌"
            : r.status === "S"
              ? "🟡"
              : "⚪️";
      return `${i + 1}. ${r.fullName} ${icon}`;
    })
    .join("\n");
  const time = new Date().toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const text = `📊 *Davomat hisoboti*\n👥 Guruh: *${groupName}*\n📅 Sana: *${date}*\n⏱️ Vaqt: *${time}*\n\n${lines}\n\nBelgilar: ✅ Keldi · ❌ Yo'q · 🟡 Sababli · ⚪️ Belgilanmagan`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.ok)
      return res
        .status(502)
        .json({ ok: false, error: data.description || `HTTP ${r.status}` });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: e?.message });
  }
});

// ─── AI Yordamchi ─────────────────────────────────────────────────────────────
app.post("/api/ai-chat", async (req, res) => {
  const { messages, system } = req.body || {};
  if (!Array.isArray(messages))
    return res.status(400).json({ ok: false, error: "messages massivi kerak" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (key && !key.includes("your_")) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: system || "",
          messages,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok)
        return res.json({ ok: true, text: data.content?.[0]?.text || "" });
    } catch (e) {}
  }
  try {
    const msgs = [];
    if (system) msgs.push({ role: "system", content: system });
    for (const m of messages)
      msgs.push({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || ""),
      });
    const r = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai", messages: msgs, private: true }),
    });
    const raw = await r.text();
    if (!r.ok)
      return res
        .status(502)
        .json({ ok: false, error: `AI ishlamayapti (${r.status})` });
    let text = "";
    try {
      const p = JSON.parse(raw);
      text = p.choices?.[0]?.message?.content || p.text || raw;
    } catch {
      text = raw;
    }
    return res.json({ ok: true, text });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "AI'ga ulanib bo'lmadi" });
  }
});

// ─── Frontend static — Render uchun BITTA PORT, path orqali ajratilgan ─────────
//
//   /admin/*   → admin portal
//   /mentor/*  → mentor portal
//   /student/* → talaba portal
//   /api/*     → REST API
//   /          → sahifa tanlash (redirect)
//
// Mahalliy ishlatishda PORT=3000 — hammasi shu portda.
// Render.com da PORT avtomatik beriladi.

const PORT = parseInt(process.env.PORT || "3000");

// ── Static fayllar yo'llari ─────────────────────────────────────────────────
const adminPublic = join(__dirname, "..", "admin", "public");
const mentorPublic = join(__dirname, "..", "mentor", "public");
const studentPublic = join(__dirname, "..", "student", "public");
const adminDist = join(__dirname, "..", "admin", "dist");
const mentorDist = join(__dirname, "..", "mentor", "dist");
const studentDist = join(__dirname, "..", "student", "dist");

// ── Portaller: /admin, /mentor, /student ────────────────────────────────────
// Vite build qilinsa dist/ papkasi ishlatiladi.
// dist/ papkasida public/ ichidagi fayllar ham bo'ladi (Vite avtomatik ko'chiradi).
// Agar dist/ yo'q bo'lsa — public/ dan ishlaydi.

const portals = [
  { prefix: "/admin", dist: adminDist, pub: adminPublic },
  { prefix: "/mentor", dist: mentorDist, pub: mentorPublic },
  { prefix: "/student", dist: studentDist, pub: studentPublic },
];

for (const { prefix, dist, pub } of portals) {
  // dist/ bor bo'lsa ishlatamiz, yo'q bo'lsa public/ dan
  const root = existsSync(dist) ? dist : existsSync(pub) ? pub : null;

  if (!root) {
    app.get(prefix, (_req, res) =>
      res.status(503).send("Portal build qilinmagan"),
    );
    app.get(prefix + "/*", (_req, res) =>
      res.status(503).send("Portal build qilinmagan"),
    );
    continue;
  }

  // Static fayllar
  app.use(prefix, express.static(root, { index: false }));

  // dist/ yo'q bo'lsa public/core ni ham serve qil
  if (!existsSync(dist) && existsSync(join(pub, "core"))) {
    app.use(prefix + "/core", express.static(join(pub, "core")));
  }

  // SPA fallback — index.html
  const indexFile = join(root, "index.html");
  app.get(prefix, (_req, res) => {
    existsSync(indexFile)
      ? res.sendFile(indexFile)
      : res.status(404).send("Portal topilmadi");
  });
  app.get(prefix + "/*", (_req, res) => {
    existsSync(indexFile)
      ? res.sendFile(indexFile)
      : res.status(404).send("Portal topilmadi");
  });
}

// ── Bosh sahifa — portallar ro'yxati ────────────────────────────────────────
app.get("/", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EduManage CRM</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#0f172a;color:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center}
  .wrap{text-align:center;padding:40px 20px}
  h1{font-size:2rem;font-weight:800;margin-bottom:8px}
  p{color:#94a3b8;margin-bottom:40px}
  .cards{display:flex;gap:20px;flex-wrap:wrap;justify-content:center}
  .card{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px 40px;text-decoration:none;color:inherit;transition:.2s;min-width:180px}
  .card:hover{background:#273449;border-color:#64748b;transform:translateY(-3px)}
  .icon{font-size:2.5rem;margin-bottom:12px}
  .label{font-weight:700;font-size:1.1rem}
  .sub{color:#64748b;font-size:.85rem;margin-top:4px}
</style>
</head>
<body>
<div class="wrap">
  <h1>🎓 EduManage CRM</h1>
  <p>Portalingizni tanlang</p>
  <div class="cards">
    <a class="card" href="/admin">
      <div class="icon">🔵</div>
      <div class="label">Admin</div>
      <div class="sub">Boshqaruv paneli</div>
    </a>
    <a class="card" href="/mentor">
      <div class="icon">🟢</div>
      <div class="label">Mentor</div>
      <div class="sub">Mentor kabineti</div>
    </a>
    <a class="card" href="/student">
      <div class="icon">🟡</div>
      <div class="label">Talaba</div>
      <div class="sub">Talaba kabineti</div>
    </a>
  </div>
</div>
</body>
</html>`);
});

// ─── Serverni ishga tushirish ─────────────────────────────────────────────────
async function start() {
  await connectMongo();

  app.listen(PORT, "0.0.0.0", () => {
    const base = `http://localhost:${PORT}`;
    console.log(`\n✅ Server ishga tushdi: ${base}`);
    console.log(`   🔵 Admin:   ${base}/admin`);
    console.log(`   🟢 Mentor:  ${base}/mentor`);
    console.log(`   🟡 Talaba:  ${base}/student`);
    console.log(`   🔧 API:     ${base}/api`);
  });

  const tgOk =
    !!process.env.TELEGRAM_BOT_TOKEN &&
    !process.env.TELEGRAM_BOT_TOKEN.includes("your_");
  const aiOk =
    !!process.env.ANTHROPIC_API_KEY &&
    !process.env.ANTHROPIC_API_KEY.includes("your_");
  console.log(`\n   MongoDB:   ${db ? "✅ ulangan" : "❌ ulanmagan"}`);
  console.log(`   Telegram:  ${tgOk ? "✅ sozlangan" : "⚠️  sozlanmagan"}`);
  console.log(
    `   AI:        ${aiOk ? "✅ Anthropic" : "➡️  Pollinations (bepul)"}\n`,
  );
}

start().catch(console.error);
