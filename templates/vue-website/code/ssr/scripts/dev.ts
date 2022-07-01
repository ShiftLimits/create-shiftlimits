import express from 'express'
import { createServer as createViteServer, createLogger } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { bold, green, dim, white } from 'kolorist'
import { printServerUrls, resolveHostname } from './utils/server'

async function createServer() {
	const vite = await createViteServer({
		server: { middlewareMode: true }
	})

	const app = express()
	app.use(vite.middlewares)
	app.use('*', async (req, res) => {
		const url = req.originalUrl

		try {
			let template = readFileSync(resolve(__dirname, '../index.html'), 'utf-8')
			template = await vite.transformIndexHtml(url, template)

			const { render } = await vite.ssrLoadModule('/src/entry-node.ts')

			const [headTags, htmlAttrs, bodyAttrs, appHtml, preloadLinks = ''] = await render(url)
			const html = template
				.replace(/<html/, `<html${htmlAttrs}`)
				.replace(/<body/, `<body${bodyAttrs}`)
				.replace(`<!--preload-links-->`, preloadLinks)
				.replace(`<!--head-tags-->`, headTags)
				.replace(`<!--ssr-outlet-->`, appHtml)

			res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
		} catch (e:any) {
			vite && vite.ssrFixStacktrace(e)
			console.log(e.stack)
			res.status(500).end(e.stack)
		}
	})

	return { app, vite }
}

createServer().then(({ app, vite }) => {
	const logger = createLogger(vite.config.logLevel)
	let host = vite.config.server.host
	let port = 3000

	function onError(e:NodeJS.ErrnoException) {
		if (e.code === 'EADDRINUSE') {
			logger.info(`Port ${port} is in use, trying another one...`)
			app.listen(++port, host, () => {
				app.removeListener('error', onError)
				listenSuccess()
			})
		} else {
			app.removeListener('error', onError)
			logger.error(`server error:`)
			console.error(e)
		}
	}

	async function listenSuccess() {
		const hostname = await resolveHostname(host)
    const protocol = vite.config.server.https ? 'https' : 'http'
    const base = vite.config.base === './' || vite.config.base === '' ? '/' : vite.config.base
    printServerUrls(hostname, protocol, port, base, logger.info)
	}

	// @ts-ignore
	const vite_start_time = global.__vite_start_time ?? false
	const startup_duration = vite_start_time
		? dim(
				`ready in ${white(
					bold(Math.ceil(performance.now() - vite_start_time))
				)} ms`
			)
		: ''

	logger.info(
		`\n  ${green(
			`${bold('VITE')} - SSR Dev Server`
		)}  ${startup_duration}\n`,
		{ clear: !logger.hasWarned }
	)

	app.on('error', onError)
	app.listen(port, host, () => {
		app.removeListener('error', onError)
		listenSuccess()
	})
})
