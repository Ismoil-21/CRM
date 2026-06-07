/**
 * useCrmLoader — CRM yadrosini yuklash uchun composable.
 * Bitta app-shell.html yuklanadi, login → rol bo'yicha panel ochiladi.
 */

import { ref, onMounted, onUnmounted } from 'vue'

const CORE_SCRIPTS = [
  '/core/backend-storage.js',
  '/core/auth.js',
  '/core/constants-i18n-ui.js',
  '/core/data-finance.js',
  '/core/attendance-render.js',
  '/core/forms-credentials.js',
  '/core/student-dashboard.js',
  '/core/grading-tests-mentor.js',
  '/core/student-pages-video.js',
  '/core/telegram-bridge.js',
  '/core/ai-assistant.js',
  '/core/coin-system.js',
  '/core/mentor-coin-give.js',
]

function loadScript(src) {
  return new Promise((resolve, reject) => {
    document.querySelector(`script[data-crm="${src}"]`)?.remove()
    const s = document.createElement('script')
    s.src = src + '?v=' + Date.now()
    s.setAttribute('data-crm', src)
    s.onload = resolve
    s.onerror = () => reject(new Error(`Skript yuklanmadi: ${src}`))
    document.body.appendChild(s)
  })
}

function loadCSS(href) {
  if (document.querySelector(`link[data-crm-css="${href}"]`)) return Promise.resolve()
  return new Promise((resolve) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = href + '?v=' + Date.now()
    l.setAttribute('data-crm-css', href)
    l.onload = resolve
    l.onerror = resolve
    document.head.appendChild(l)
  })
}

export function useCrmLoader(rootRef) {
  const loading = ref(true)
  const error = ref(null)

  onMounted(async () => {
    if (!rootRef.value) return
    try {
      // 1. CSS yuklash (skriptlardan oldin)
      await loadCSS('/edu-styles.css')

      // 2. HTML tuzilmasini yuklash
      const res = await fetch('/app-shell.html')
      if (!res.ok) throw new Error(`app-shell.html yuklanmadi (${res.status})`)
      rootRef.value.innerHTML = await res.text()

      // 3. Skriptlarni ketma-ket yuklash
      for (const src of CORE_SCRIPTS) {
        await loadScript(src)
      }

      loading.value = false
    } catch (err) {
      console.error('[CRM Loader]', err)
      error.value = err.message
      loading.value = false
    }
  })

  onUnmounted(() => {
    CORE_SCRIPTS.forEach(src => {
      document.querySelector(`script[data-crm="${src}"]`)?.remove()
    })
  })

  return { loading, error }
}
