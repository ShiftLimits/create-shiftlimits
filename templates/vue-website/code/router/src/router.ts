import { createRouter, createMemoryHistory, createWebHistory, RouteRecordRaw } from 'vue-router'

export function createAppRouter() {
	const route_children = new Map<string, RouteRecordRaw[]>()
	const routes = Object.entries(import.meta.glob('./pages/**/*.{vue,md}')).reduce<RouteRecordRaw[]>((routes, [page_path, component]) => {
		page_path = page_path.replace(/^\.\/pages|.(vue|md)$/g, '')

		let path = page_path.replace(/\/_([^/]*)/g, '/:$1')
		if (path.slice(-5) == 'index') path = path.slice(0, -5)

		if (path == '/404') routes.push({ path: '/:pathMatch(.*)*', component })
		else {
			const [_, ...path_parts] = page_path.split('/')

			let existing_route_path = ''
			let found_route_path = ''
			for (let part of path_parts) {
				existing_route_path += `/${part}`

				if (route_children.has(existing_route_path)) found_route_path = existing_route_path
				else if (found_route_path) break // break if we have found a descendent route's children already and this iteration found nothing
			}

			const children:RouteRecordRaw[] = []
			route_children.set(page_path, children)

			if (found_route_path) {
				route_children.get(found_route_path)!.unshift({ path, children, component })
			} else {
				routes.unshift({ path, children, component })
			}
		}

		return routes
	}, [])

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
