/**
 * stores/auth.js — Markaziy autentifikatsiya store
 * localStorage'dan sessiyani tiklaydi (refresh'da ham saqlanadi)
 * Role: 'Super Admin' | 'Mentor' | 'Talaba'
 */
import { reactive, computed } from 'vue'

const AUTH_KEY = 'edumanage_auth_v10'
const MENTOR_USERS_KEY = 'edumanage_mentor_users_v8'
const STUDENT_USERS_KEY = 'edumanage_student_users_v9'
const ADMIN_CRED_KEY = 'edumanage_admin_cred_v1'

function _authRead() {
  try {
    const ls = localStorage.getItem(AUTH_KEY)
    if (ls) return JSON.parse(ls)
    const ss = sessionStorage.getItem(AUTH_KEY)
    if (ss) return JSON.parse(ss)
  } catch (e) {}
  return {}
}

function _authWrite(obj) {
  const str = JSON.stringify(obj)
  try { Storage.prototype.setItem.call(localStorage, AUTH_KEY, str) } catch (e) {}
  try { sessionStorage.setItem(AUTH_KEY, str) } catch (e) {}
}

function _authDelete() {
  try { Storage.prototype.removeItem.call(localStorage, AUTH_KEY) } catch (e) {}
  try { sessionStorage.removeItem(AUTH_KEY) } catch (e) {}
}

// Singleton store (reactive object, Vue Pinia o'rniga yengil variant)
const state = reactive({
  loggedIn: false,
  name: '',
  role: '',           // 'Super Admin' | 'Mentor' | 'Talaba'
  mentorName: null,
  studentId: null,
  studentName: null,
})

export function useAuthStore() {
  // Computed role helpers
  const isAdmin   = computed(() => state.role === 'Super Admin')
  const isMentor  = computed(() => state.role === 'Mentor')
  const isStudent = computed(() => state.role === 'Talaba')
  const isLoggedIn = computed(() => state.loggedIn)

  /** localStorage'dan holatni tiklash (main.js da chaqiriladi) */
  function init() {
    const data = _authRead()
    if (data.loggedIn) {
      Object.assign(state, data)
    }
  }

  /** Admin credentials */
  function getAdminCred() {
    try {
      const c = JSON.parse(localStorage.getItem(ADMIN_CRED_KEY) || 'null')
      if (c && c.login && c.pass) return c
    } catch (e) {}
    return { login: 'admin', pass: 'admin123' }
  }

  /** Barcha foydalanuvchilarni olish (backend + localStorage) */
  async function getAllUsers() {
    const ac = getAdminCred()
    const base = [{ login: ac.login, pass: ac.pass, name: 'Admin', role: 'Super Admin' }]
    try {
      const r = await fetch('/api/users')
      if (r.ok) {
        const data = await r.json()
        if (Array.isArray(data.mentors))
          localStorage.setItem(MENTOR_USERS_KEY, JSON.stringify(data.mentors))
        if (Array.isArray(data.students))
          localStorage.setItem(STUDENT_USERS_KEY, JSON.stringify(data.students))
      }
    } catch (e) {}
    try {
      const extras = JSON.parse(localStorage.getItem(MENTOR_USERS_KEY) || '[]')
      const studs  = JSON.parse(localStorage.getItem(STUDENT_USERS_KEY) || '[]')
      return base.concat(extras).concat(studs)
    } catch (e) { return base }
  }

  /**
   * Login — credentials tekshirib, state va localStorage'ga yozadi
   * @returns { ok, error, role }
   */
  async function login(username, password) {
    const users = await getAllUsers()
    const found = users.find(u => u.login === username && u.pass === password)
    if (!found) return { ok: false, error: "Login yoki parol noto'g'ri!" }

    const authData = {
      loggedIn: true,
      name: found.name,
      role: found.role,
      mentorName: found.mentorName || null,
      studentId: found.studentId || null,
      studentName: found.studentName || null,
    }
    _authWrite(authData)
    Object.assign(state, authData)
    return { ok: true, role: found.role }
  }

  /** Logout */
  function logout() {
    _authDelete()
    Object.assign(state, {
      loggedIn: false, name: '', role: '',
      mentorName: null, studentId: null, studentName: null,
    })
  }

  return {
    state,
    isAdmin,
    isMentor,
    isStudent,
    isLoggedIn,
    init,
    login,
    logout,
    getAdminCred,
  }
}
