import { createApp as createVueApp } from 'vue'
import App from './App.vue'

import { createHead } from '@vueuse/head'
import { createAppRouter } from './router'

export async function createApp() {
	const app = createVueApp(App)

	const head = createHead()
	app.use(head)

	const router = createAppRouter()
	app.use(router)

	return {
		app,
		router,
	}
}