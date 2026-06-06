import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '@/pages/dashboard/DashboardPage.vue'
import ReportsPage from '@/pages/reports/ReportsPage.vue'
import TrendsPage from '@/pages/trends/TrendsPage.vue'
import SettingsPage from '@/pages/settings/SettingsPage.vue'

// Use Vite's BASE_URL so the router respects the repository subpath when
// deployed to GitHub Pages (e.g. /Health-Metrics-Tracker-PWA/)
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
