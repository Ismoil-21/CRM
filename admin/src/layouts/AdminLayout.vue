<template>
  <div id="crm-root">
    <!-- Yuklanmoqda -->
    <div v-if="booting" class="boot-screen">
      <div class="boot-spinner"></div>
      <p class="boot-text">EduManage yuklanmoqda…</p>
    </div>

    <!-- Xatolik -->
    <div v-else-if="bootError" class="boot-error">
      <span>⚠️ {{ bootError }}</span>
      <button @click="reload">🔄 Qayta yuklash</button>
    </div>

    <!-- App shell — vanilla JS render qiladi -->
    <div v-show="!booting && !bootError" ref="shellRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const shellRef = ref(null);
const booting = ref(true);
const bootError = ref(null);

// Tartib muhim: har bir script keyingisiga bog'liq bo'lishi mumkin
// Shuning uchun dependency group larga bo'lamiz va har group parallel yuklanadi
const SCRIPT_GROUPS = [
  // Group 1: mustaqil util scriptlar — parallel
  ["backend-storage.js", "constants-i18n-ui.js"],
  // Group 2: auth (constants kerak)
  ["auth.js"],
  // Group 3: qolganlar — parallel (hammasi auth + constants ga bog'liq)
  [
    "data-finance.js",
    "attendance-render.js",
    "student-dashboard.js",
    "grading-tests-mentor.js",
    "student-pages-video.js",
    "telegram-bridge.js",
    "ai-assistant.js",
    "coin-system.js",
  ],
  // Group 4: coin-system ga bog'liq
  ["mentor-coin-give.js", "forms-credentials.js"],
];

const base = import.meta.env.BASE_URL || "/";
const coreBase = base.endsWith("/") ? base + "core/" : base + "/core/";

// CSS ni <head> ga preload qilib oldindan boshlash
function preloadCSS(name) {
  const href = base + name;
  if (document.querySelector(`link[data-crm-css="${name}"]`)) return;
  // Preload link — brauzer CSS ni yuklab, render blockmaysiz
  const pre = document.createElement("link");
  pre.rel = "preload";
  pre.as = "style";
  pre.href = href;
  pre.setAttribute("data-crm-pre", name);
  document.head.appendChild(pre);
  // Haqiqiy stylesheet
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = href;
  l.setAttribute("data-crm-css", name);
  document.head.appendChild(l);
}

function loadScript(name) {
  return new Promise((resolve, reject) => {
    document.querySelector(`script[data-crm="${name}"]`)?.remove();
    const s = document.createElement("script");
    s.src = coreBase + name;
    s.setAttribute("data-crm", name);
    s.onload = resolve;
    s.onerror = () => reject(new Error("Yuklanmadi: " + name));
    document.body.appendChild(s);
  });
}

function reload() {
  location.reload();
}

onMounted(async () => {
  try {
    // CSS va HTML ni parallel boshlash
    preloadCSS("edu-styles.css");
    const htmlPromise = fetch(base + "app-shell.html").then((r) => {
      if (!r.ok)
        throw new Error("app-shell.html yuklanmadi (" + r.status + ")");
      return r.text();
    });

    // HTML tayyor bo'lguncha 1-group scriptlarni ham boshlash
    const [html] = await Promise.all([htmlPromise]);
    shellRef.value.innerHTML = html;

    // Script grouplarni ketma-ket, lekin har group ichida parallel
    for (const group of SCRIPT_GROUPS) {
      await Promise.all(group.map(loadScript));
    }

    // Admin guard
    const orig = window.showApp;
    if (orig) {
      window.showApp = function () {
        const user =
          typeof getCurrentUser === "function" ? getCurrentUser() : {};
        if (user.role !== "Super Admin") {
          if (typeof _authDelete === "function") _authDelete();
          const errEl = document.getElementById("login-err");
          if (errEl) {
            errEl.textContent = "🚫 Bu portal faqat Admin uchun!";
            errEl.style.display = "block";
          }
          const passEl = document.getElementById("login-pass");
          if (passEl) {
            passEl.value = "";
            passEl.focus();
          }
          return;
        }
        orig.call(this);
      };
    }

    if (typeof window.__crmBoot === "function") {
      window.__crmBoot();
    }
    booting.value = false;
  } catch (err) {
    console.error("[Admin Boot]", err);
    bootError.value = err.message;
    booting.value = false;
  }
});

onUnmounted(() => {
  SCRIPT_GROUPS.flat().forEach((name) => {
    document.querySelector(`script[data-crm="${name}"]`)?.remove();
  });
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html,
body {
  height: 100%;
}
#crm-root {
  min-height: 100vh;
}

.boot-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
  background: #0f172a;
  font-family: system-ui, sans-serif;
}
.boot-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #1e293b;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: bspin 0.8s linear infinite;
}
@keyframes bspin {
  to {
    transform: rotate(360deg);
  }
}
.boot-text {
  color: #94a3b8;
  font-size: 0.95rem;
}

.boot-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  height: 100vh;
  color: #ef4444;
  font-family: system-ui, sans-serif;
  background: #0f172a;
}
.boot-error button {
  padding: 0.5rem 1.25rem;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}
</style>
