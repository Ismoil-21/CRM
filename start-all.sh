#!/bin/bash
# ─────────────────────────────────────────────────────
#  EduManage CRM — Barcha portlarni ishga tushirish
# ─────────────────────────────────────────────────────

echo ""
echo "🚀 EduManage CRM (MongoDB versiyasi) ishga tushmoqda..."
echo ""

# Backend o'rnatish
cd "$(dirname "$0")/backend"

if [ ! -d "node_modules" ]; then
  echo "📦 Backend dependencies o'rnatilmoqda..."
  npm install
fi

echo "✅ Backend tayyor"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔵 Admin Portal:   http://localhost:3001"
echo "  🟢 Mentor Portal:  http://localhost:3002"
echo "  🟡 Talaba Portal:  http://localhost:3003"
echo "  🔧 API:            http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Toxtatish uchun: Ctrl+C"
echo ""

node server.js
