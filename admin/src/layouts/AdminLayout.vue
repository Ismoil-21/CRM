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
import { ref, onMounted, onUnmounted } from 'vue'

const shellRef  = ref(null)
const booting   = ref(true)
const bootError = ref(null)

const CORE_SCRIPTS = [
  'backend-storage.js',
  'auth.js',
  'constants-i18n-ui.js',
  'data-finance.js',
  'attendance-render.js',
  'forms-credentials.js',
  'student-dashboard.js',
  'grading-tests-mentor.js',
  'student-pages-video.js',
  'telegram-bridge.js',
  'ai-assistant.js',
  'coin-system.js',
  'mentor-coin-give.js',
]

const base = import.meta.env.BASE_URL || '/'
const coreBase = base.endsWith('/') ? base + 'core/' : base + '/core/'

function loadScript(name) {
  const src = coreBase + name
  return new Promise((resolve, reject) => {
    // Oldin yuklangan bo'lsa olib tashla (hot reload uchun)
    document.querySelector(`script[data-crm="${name}"]`)?.remove()
    const s = document.createElement('script')
    s.src = src + '?v=' + Date.now()
    s.setAttribute('data-crm', name)
    s.onload = resolve
    s.onerror = () => reject(new Error('Yuklanmadi: ' + src))
    document.body.appendChild(s)
  })
}

function loadCSS(name) {
  const href = base + name
  if (document.querySelector(`link[data-crm-css="${name}"]`)) return Promise.resolve()
  return new Promise(resolve => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = href + '?v=' + Date.now()
    l.setAttribute('data-crm-css', name)
    l.onload = l.onerror = resolve
    document.head.appendChild(l)
  })
}

// Admin portaliga faqat Super Admin kirishi mumkin
function applyAdminGuard() {
  const orig = window.showApp
  if (!orig) return
  window.showApp = function () {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : {}
    if (user.role !== 'Super Admin') {
      if (typeof _authDelete === 'function') _authDelete()
      const errEl = document.getElementById('login-err')
      if (errEl) { errEl.textContent = '🚫 Bu portal faqat Admin uchun!'; errEl.style.display = 'block' }
      const passEl = document.getElementById('login-pass')
      if (passEl) { passEl.value = ''; passEl.focus() }
      return
    }
    orig.call(this)
  }
}

function reload() { location.reload() }

onMounted(async () => {
  try {
    await loadCSS('edu-styles.css')
    const res = await fetch(base + 'app-shell.html')
    if (!res.ok) throw new Error('app-shell.html yuklanmadi (' + res.status + ')')
    shellRef.value.innerHTML = await res.text()

    for (const name of CORE_SCRIPTS) await loadScript(name)

    applyAdminGuard()

    if (typeof window.__crmBoot === 'function') {
      window.__crmBoot()
    } else if (typeof window.checkAuth === 'function') {
      if (window.checkAuth()) {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : {}
        if (user.role === 'Super Admin') {
          if (typeof window.showApp === 'function') window.showApp()
        } else {
          if (typeof _authDelete === 'function') _authDelete()
          const ls = document.getElementById('login-screen')
          if (ls) ls.style.display = 'flex'
        }
      } else {
        const ls = document.getElementById('login-screen')
        if (ls) ls.style.display = 'flex'
      }
    }
    booting.value = false
  } catch (err) {
    console.error('[Admin Boot]', err)
    bootError.value = err.message
    booting.value = false
  }
})

onUnmounted(() => {
  CORE_SCRIPTS.forEach(name => {
    document.querySelector(`script[data-crm="${name}"]`)?.remove()
  })
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }
#crm-root { min-height: 100vh; }

.boot-screen {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 100vh; gap: 1rem;
  background: #0f172a; font-family: system-ui, sans-serif;
}
.boot-spinner {
  width: 48px; height: 48px;
  border: 4px solid #1e293b;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: bspin .8s linear infinite;
}
@keyframes bspin { to { transform: rotate(360deg); } }
.boot-text { color: #94a3b8; font-size: .95rem; }

.boot-error {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1rem; height: 100vh;
  color: #ef4444; font-family: system-ui, sans-serif;
  background: #0f172a;
}
.boot-error button {
  padding: .5rem 1.25rem; background: #6366f1;
  color: #fff; border: none; border-radius: 8px;
  cursor: pointer; font-size: .9rem;
}
</style>
