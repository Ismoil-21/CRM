import { createRouter, createWebHistory } from 'vue-router'

const StudentLayout = () => import('../layouts/StudentLayout.vue')
const BlankPage     = { template: '<div></div>' }

const routes = [
  {
    path: '/',
    component: StudentLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'StudentDashboard', component: BlankPage },
      { path: ':pathMatch(.*)*', redirect: '/dashboard' },
    ],
  },
]

const base = import.meta.env.BASE_URL || '/'
const router = createRouter({ history: createWebHistory(base), routes })
router.afterEach(() => { document.title = 'EduManage — Talaba' })
export default router
