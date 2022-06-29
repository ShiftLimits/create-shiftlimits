import { createRouter, createMemoryHistory, createWebHistory, RouteRecordRaw } from 'vue-router'

export function createAppRouter() {
	const routes:RouteRecordRaw[] = [
		{ path: '/', component: () => import('./pages/index.vue') },

		// 404
		{ path: '/:pathMatch(.*)*', component: () => import('./pages/404.vue') }
	]

	const history = import.meta.env.SSR ? createMemoryHistory() : createWebHistory()

	const router = createRouter({
		scrollBehavior(to, from, saved_position) {
			return { top: 0, left: 0 }
		},
		routes,
		history
	})

	return router
}
