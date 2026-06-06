import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '@/pages/dashboard/DashboardPage.vue'
import ReportsPage from '@/pages/reports/ReportsPage.vue'
import TrendsPage from '@/pages/trends/TrendsPage.vue'
import SettingsPage from '@/pages/settings/SettingsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', name: 'dashboard', component: DashboardPage },
    { path: '/trends', name: 'trends', component: TrendsPage },
    { path: '/reports', name: 'reports', component: ReportsPage },
    { path: '/settings', name: 'settings', component: SettingsPage },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router
