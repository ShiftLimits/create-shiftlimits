import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { sync as globSync } from 'fast-glob'
import { render } from '../dist/server/entry-node.js'
import { green } from 'kolorist'

const toAbsolute = (p:string) => resolve(__dirname, '../', p)
const template = readFileSync(toAbsolute('dist/static/index.html'), 'utf-8')


async function init() {
	const manifest = require(toAbsolute('dist/static/ssr-manifest.json'))

	const routes = globSync('src/pages/**/*.{vue,md}').map((file) => {
		const path = file.replace(/^src\/pages|\.(vue|md)$/g, '')
		const [_, ...path_parts] = path.split('/')
		const name = path_parts.pop()
		return {
				path:  path_parts.concat(name === 'index' ? [] : [name]).join('/'),
				path_parts,
				name
		}
	})

	// pre-render each route...
	for (const route of routes) {
		const output_path = 'dist/static' + (route.path_parts.length > 0 ? `/${route.path_parts.join('/')}` : '')
		const file_path = `${output_path}/${route.name}.html`
		console.log('Rendering:', file_path)

		const [headTags, htmlAttrs, bodyAttrs, appHtml, preloadLinks] = await render(route.path, manifest)

		let html = template
		if (headTags.match(/<title>/)) html = html.replace(/<title>(.*)<\/title>/, '')

		html = html
				.replace(/<html/, `<html${htmlAttrs}`)
				.replace(/<body/, `<body${bodyAttrs}`)
				.replace(`<!--preload-links-->`, preloadLinks)
				.replace(`<!--head-tags-->`, headTags)
				.replace(`<!--ssr-outlet-->`, appHtml)

		// ensureDirSync(toAbsolute(output_path))
		writeFileSync(toAbsolute(file_path), html)
	}
	console.log(green('Generated successfully'))
}

init()
