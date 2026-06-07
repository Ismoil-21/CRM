import { createRouter, createWebHistory } from 'vue-router'

const MentorLayout = () => import('../layouts/MentorLayout.vue')
const BlankPage    = { template: '<div></div>' }

const routes = [
  {
    path: '/',
    component: MentorLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'MentorDashboard', component: BlankPage },
      { path: ':pathMatch(.*)*', redirect: '/dashboard' },
    ],
  },
]

const base = import.meta.env.BASE_URL || '/'
const router = createRouter({ history: createWebHistory(base), routes })
router.afterEach(() => { document.title = 'EduManage — Mentor' })
export default router
