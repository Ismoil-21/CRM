# EduManage CRM — MongoDB Versiyasi

## Arxitektura

```
CRM_portals_v5/
├── backend/          ← Express.js API server (MongoDB)
│   ├── server.js     ← Asosiy server (barcha 4 port)
│   ├── package.json
│   └── .env          ← MongoDB URI va boshqa sozlamalar
├── admin/            ← Admin portal (Vue.js)
├── mentor/           ← Mentor portal (Vue.js)
├── student/          ← Talaba portal (Vue.js)
└── start-all.sh      ← Hammasini bir vaqtda ishga tushirish
```

## Portlar

| Portal        | URL                         | Foydalanuvchi  |
|---------------|-----------------------------| ---------------|
| API Server    | http://localhost:3000       | —              |
| Admin Portal  | http://localhost:3001       | Super Admin    |
| Mentor Portal | http://localhost:3002       | Mentor         |
| Talaba Portal | http://localhost:3003       | Talaba         |

## MongoDB Collections

| Collection  | Ma'lumot                                    |
|-------------|---------------------------------------------|
| `crm_data`  | Kurslar, guruhlar, talabalar, davomat, baho |
| `users`     | Mentor va talaba login ma'lumotlari         |
| `coins`     | Coin tizimi (coins, shop, purchases)        |
| `kv`        | Universal key-value storage                 |

## Ishga tushirish

### 1. Tez ishga tushirish
```bash
./start-all.sh
```

### 2. Qo'lda ishga tushirish
```bash
cd backend
npm install
npm start
```

### 3. Vue frontendlarni build qilish (ixtiyoriy)
```bash
# Admin
cd admin && npm install && npm run build

# Mentor
cd mentor && npm install && npm run build

# Student
cd student && npm install && npm run build
```

## .env sozlamalari

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/CRM
TELEGRAM_BOT_TOKEN=bot_token_bu_yerga
ANTHROPIC_API_KEY=anthropic_key_bu_yerga  # ixtiyoriy
PORT=3000
ADMIN_PORT=3001
MENTOR_PORT=3002
STUDENT_PORT=3003
```

## API Endpointlar

```
GET  /api/health          — Server holati
GET  /api/data            — CRM ma'lumotlari
POST /api/data            — CRM ma'lumotlarini saqlash
GET  /api/users           — Foydalanuvchilar
POST /api/users/save      — Foydalanuvchilarni saqlash
GET  /api/coins           — Coin tizimi
POST /api/coins           — Coinlarni saqlash
POST /api/coins/send-mentor — Mentorga coin yuborish
GET  /api/kv              — KV store
POST /api/kv              — KV yozish
POST /api/kv/bulk         — KV ommaviy yozish
POST /api/kv/clear        — KV tozalash
GET  /api/db/stats        — MongoDB statistika
POST /api/send-attendance — Telegram davomat
POST /api/ai-chat         — AI yordamchi
```

## Login ma'lumotlari (default)

| Rol       | Login      | Parol     |
|-----------|------------|-----------|
| Admin     | admin      | admin123  |
| Mentor    | toxr1234   | toxr1234  |

> ⚠️ Admin login/paroli Settings sahifasida o'zgartiriladi.
> Mentor/talaba logini Admin panelida boshqariladi.
