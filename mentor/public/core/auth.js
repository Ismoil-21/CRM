// ===================== AUTH (Yagona - Admin + Mentor + Talaba) =====================
// 🔐 BUG FIX: Auth session faqat browser-local saqlanadi (backend KV'ga YOZILMAYDI)
// backend-storage.js ichida CLIENT_ONLY_KEYS ro'yxatida AUTH_KEY mavjud.

const AUTH_KEY = 'edumanage_auth_v10';
const MENTOR_USERS_KEY = 'edumanage_mentor_users_v8';
const STUDENT_USERS_KEY = 'edumanage_student_users_v9';
const ADMIN_CRED_KEY = 'edumanage_admin_cred_v1';

// ── Auth saqlash/o'qish: localStorage + sessionStorage ikki qatlam ─────────────
// localStorage: tab yopilmasa saqlanadi (eslab qolish)
// sessionStorage: tab yopilsa o'chadi (xavfsizroq fallback)

function _authRead() {
  try {
    // Avval localStorage dan o'qi
    const ls = localStorage.getItem(AUTH_KEY);
    if (ls) return JSON.parse(ls);
    // Fallback: sessionStorage
    const ss = sessionStorage.getItem(AUTH_KEY);
    if (ss) return JSON.parse(ss);
  } catch (e) {}
  return {};
}

function _authWrite(obj) {
  const str = JSON.stringify(obj);
  // localStorage.setItem intercepted by backend-storage — lekin CLIENT_ONLY_KEYS
  // ro'yxatida bo'lgani uchun backend'ga YOZILMAYDI, faqat local qoladi.
  try { Storage.prototype.setItem.call(localStorage, AUTH_KEY, str); } catch (e) {}
  // sessionStorage ga ham yoz — qo'shimcha xavfsizlik
  try { sessionStorage.setItem(AUTH_KEY, str); } catch (e) {}
}

function _authDelete() {
  try { Storage.prototype.removeItem.call(localStorage, AUTH_KEY); } catch (e) {}
  try { sessionStorage.removeItem(AUTH_KEY); } catch (e) {}
}

// ── Admin credentials ─────────────────────────────────────────────────────────
function getAdminCred() {
  try {
    const c = JSON.parse(localStorage.getItem(ADMIN_CRED_KEY) || 'null');
    if (c && c.login && c.pass) return c;
  } catch (e) {}
  return { login: 'admin', pass: 'admin123' };
}
function saveAdminCred(login, pass) {
  // CLIENT_ONLY — backend'ga yozilmaydi
  try { Storage.prototype.setItem.call(localStorage, ADMIN_CRED_KEY, JSON.stringify({ login, pass })); } catch (e) {}
}

// ── Users ─────────────────────────────────────────────────────────────────────
async function getUsers() {
  const ac = getAdminCred();
  const base = [{ login: ac.login, pass: ac.pass, name: 'Admin', role: 'Super Admin' }];
  try {
    const r = await fetch('/api/users');
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data.mentors)) localStorage.setItem(MENTOR_USERS_KEY, JSON.stringify(data.mentors));
      if (Array.isArray(data.students)) localStorage.setItem(STUDENT_USERS_KEY, JSON.stringify(data.students));
    }
  } catch (e) {}
  try {
    const extras = JSON.parse(localStorage.getItem(MENTOR_USERS_KEY) || '[]');
    const studs = JSON.parse(localStorage.getItem(STUDENT_USERS_KEY) || '[]');
    return base.concat(extras).concat(studs);
  } catch (e) { return base; }
}

function saveMentorUsers(arr) {
  localStorage.setItem(MENTOR_USERS_KEY, JSON.stringify(arr));
  fetch('/api/users/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mentors: arr }) }).catch(() => {});
}
function getMentorUsers() { try { return JSON.parse(localStorage.getItem(MENTOR_USERS_KEY) || '[]'); } catch (e) { return []; } }

function saveStudentUsers(arr) {
  localStorage.setItem(STUDENT_USERS_KEY, JSON.stringify(arr));
  fetch('/api/users/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ students: arr }) }).catch(() => {});
}
function getStudentUsers() { try { return JSON.parse(localStorage.getItem(STUDENT_USERS_KEY) || '[]'); } catch (e) { return []; } }

// ── Auth checks ───────────────────────────────────────────────────────────────
function checkAuth() { try { return !!_authRead().loggedIn; } catch (e) { return false; } }
function getCurrentUser() { return _authRead(); }
function isMentorRole() { return getCurrentUser().role === 'Mentor'; }
function isStudentRole() { return getCurrentUser().role === 'Talaba'; }
function isAdminRole() { return getCurrentUser().role === 'Super Admin'; }

// ── Login ─────────────────────────────────────────────────────────────────────
async function doLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value.trim();
  const errEl = document.getElementById('login-err');

  const btn = document.querySelector('.login-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Tekshirilmoqda...'; }

  const users = await getUsers();
  const found = users.find(u => u.login === user && u.pass === pass);

  if (btn) { btn.disabled = false; btn.textContent = 'Kirish'; }

  if (!found) {
    errEl.textContent = "Login yoki parol noto'g'ri!";
    errEl.style.display = 'block';
    ['login-user', 'login-pass'].forEach(id => {
      const el = document.getElementById(id);
      el.classList.add('field-error');
      setTimeout(() => el.classList.remove('field-error'), 500);
    });
    document.getElementById('login-pass').value = '';
    document.getElementById('login-pass').focus();
    return;
  }
  errEl.style.display = 'none';

  const isMentor = found.role === 'Mentor';
  const isStudent = found.role === 'Talaba';

  const lu = document.getElementById('login-user');
  const lp = document.getElementById('login-pass');
  if (lu) lu.value = '';
  if (lp) lp.value = '';

  // UI tab'ni rolga qarab o'rnat — BU backend KV'ga yoziladi (ruxsat berilgan)
  try {
    const ui = JSON.parse(localStorage.getItem(UI_KEY) || '{}');
    ui.tab = isMentor ? 'mentor-dash' : isStudent ? 'student-my' : 'dashboard';
    localStorage.setItem(UI_KEY, JSON.stringify(ui));
  } catch (e) {}

  // Auth state'ni saqlash — CLIENT_ONLY: faqat browserda, backend'ga KETMAYDI
  _authWrite({
    loggedIn: true,
    name: found.name,
    role: found.role,
    mentorName: found.mentorName || null,
    studentId: found.studentId || null,
    studentName: found.studentName || null
  });

  showApp();
}

// ── Logout ────────────────────────────────────────────────────────────────────
function doLogout() {
  if (!confirm('Tizimdan chiqasizmi?')) return;
  _authDelete();
  try { localStorage.removeItem('edu_remember_cred'); } catch (e) {}
  location.reload();
}

// ── showApp: login → panel ────────────────────────────────────────────────────
function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('crm-app').style.display = 'flex';
  initApp();
  updateVideoNavLabels();
  if (isMentorRole()) setupMentorView();
  else if (isStudentRole()) setupStudentView();
  // Admin uchun setupAdminView() initApp() ichida chaqiriladi
}

// ── Mentor view ───────────────────────────────────────────────────────────────
function setupMentorView() {
  const cu = getCurrentUser();
  ['nav-dashboard', 'nav-courses', 'nav-groups', 'nav-mentors', 'nav-students', 'nav-finance', 'nav-coin-shop', 'nav-student-coin-shop'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  ['nav-mentor-dash', 'nav-mentors-my', 'nav-mentor-chat', 'nav-mentor-ai', 'nav-tests-mentor', 'nav-grades-mentor', 'nav-mentor-videos', 'nav-settings'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'flex';
  });
  const btnReset = document.getElementById('btn-reset');
  const btnExport = document.getElementById('btn-export');
  if (btnReset) btnReset.style.display = 'none';
  if (btnExport) btnExport.style.display = 'none';
  const uName = document.querySelector('.u-name');
  const uRole = document.querySelector('.u-role');
  if (uName) uName.textContent = cu.name || 'Mentor';
  if (uRole) uRole.textContent = 'Mentor';
  const av = document.querySelector('.u-av');
  if (av) av.textContent = (cu.name || 'M').substring(0, 2).toUpperCase();
  const mentorTabs=['mentor-dash','mentors-my','mentor-chat','mentor-ai','tests-mentor','grades-mentor','mentor-videos','settings','tests','grades'];
  const tab = (mentorTabs.indexOf(currentTab)>=0 ? currentTab : 'mentor-dash');
  const navEl = document.getElementById('nav-' + tab) || document.getElementById('nav-mentor-dash');
  go(tab, navEl);
  if (typeof updateMentorCoinTopbar === 'function') updateMentorCoinTopbar();
  const ncMT = document.getElementById('nc-tests-mentor');
  if (ncMT) ncMT.textContent = D.tests.length;
}

// ── Talaba view ───────────────────────────────────────────────────────────────
function setupStudentView() {
  const cu = getCurrentUser();
  ['nav-courses', 'nav-groups', 'nav-mentors', 'nav-students', 'nav-finance', 'nav-settings',
   'nav-dashboard', 'nav-mentor-dash', 'nav-mentors-my', 'nav-mentor-chat', 'nav-tests-mentor',
   'nav-grades-mentor', 'nav-tests', 'nav-grades'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  ['nav-student-my', 'nav-student-schedule', 'nav-student-rating', 'nav-student-grades',
   'nav-student-tests', 'nav-student-chat', 'nav-student-ai', 'nav-student-videos',
   'nav-student-goals', 'nav-settings', 'nav-student-coin-shop'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'flex';
  });
  const ncST = document.getElementById('nc-student-tests');
  if (ncST) {
    const studentId = cu.studentId ? parseInt(cu.studentId) : null;
    const s = studentId ? D.students.find(x => x.id === studentId) : null;
    const grp = s ? D.groups.find(x => x.id === s.groupId) : null;
    const cnt = grp ? (D.tests || []).filter(t => t.groupId === grp.id).length : 0;
    if (cnt > 0) { ncST.textContent = cnt; ncST.style.display = 'flex'; }
  }
  const btnReset = document.getElementById('btn-reset');
  const btnExport = document.getElementById('btn-export');
  if (btnReset) btnReset.style.display = 'none';
  if (btnExport) btnExport.style.display = 'none';
  const uName = document.querySelector('.u-name');
  const uRole = document.querySelector('.u-role');
  const studentId2 = cu.studentId ? parseInt(cu.studentId) : null;
  const savedDisplay = _uiSettings['studentDisplayName_' + (studentId2 || '')];
  const showName = savedDisplay || (cu.studentName || cu.name || 'Talaba');
  const roleLbl = LANG === 'ru' ? 'Студент' : LANG === 'en' ? 'Student' : 'Talaba';
  if (uName) uName.textContent = showName;
  if (uRole) uRole.textContent = roleLbl;
  const av = document.querySelector('.u-av');
  if (av) av.textContent = showName.substring(0, 2).toUpperCase();
  const tab = currentTab || 'student-my';
  const navEl = document.getElementById('nav-' + tab) || document.getElementById('nav-student-my');
  go(tab, navEl);
  if (typeof updateMentorCoinTopbar === 'function') updateMentorCoinTopbar();
}
