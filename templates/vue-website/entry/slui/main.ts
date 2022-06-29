import { createApp as createVueApp } from 'vue'
import App from './App.vue'

import { createHead } from '@vueuse/head'
import { SLUI } from 'slui'

export async function createApp() {
	const app = createVueApp(App)

	const head = createHead()
	app.use(head)

	app.use(SLUI)

	return {
		app,
		slui,
	}
}