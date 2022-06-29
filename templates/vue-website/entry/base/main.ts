import { createApp as createVueApp } from 'vue'
import App from './App.vue'

import { createHead } from '@vueuse/head'

export async function createApp() {
	const app = createVueApp(App)

	const head = createHead()
	app.use(head)

	return {
		app,
	}
}