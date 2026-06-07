import { createRouter, createWebHistory } from 'vue-router'

const AdminLayout = () => import('../layouts/AdminLayout.vue')
const BlankPage   = { template: '<div></div>' }

const routes = [
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: BlankPage },
      { path: ':pathMatch(.*)*', redirect: '/dashboard' },
    ],
  },
]

const base = import.meta.env.BASE_URL || '/'
const router = createRouter({ history: createWebHistory(base), routes })
router.afterEach(() => { document.title = 'EduManage — Admin' })
export default router
