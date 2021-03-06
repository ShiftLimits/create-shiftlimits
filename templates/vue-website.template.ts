import {  emptyDirSync, ensureDirSync, existsSync, writeFileSync } from 'fs-extra'
import { resolve } from 'path'
import { defineTemplate, renderTemplate } from '../utils'

const SLUIPresets = {
	'minimal': {
		description: 'The library is only installed and configured. You pull in features as needed.'
	},
	'basics': {
		description: 'Commonly used UI components are registered globally.'
	},
	'recommended': {
		description: 'Recommended UI components are registered globally and recommended plugins are installed.'
	},
	'everything': {
		description: 'All components are registered globally and all plugins are installed.'
	},
	'custom': {
		description: 'Manually select the features you would like to use.'
	}
}

const SLUIFeatures = {
	'TextLink': {
		description: 'Basic styled inline text link.'
	},
	'SvgIcon': {
		description: 'Displays SVG icons from the assets folder.'
	},
}

interface TemplatePrompts {
	useSSR:boolean
	useAppCore:boolean
	useRouter:boolean
	useMarkdown:boolean
	useSLUI:boolean
	sluiPreset:keyof typeof SLUIPresets
	sluiFeatures:(keyof typeof SLUIFeatures)[]
	sluiColorSuite:boolean
	useColorSuite:boolean
	useVitest:boolean
	useYorkie:boolean
}

export default defineTemplate<TemplatePrompts>({
	name: 'vue-website',
	description: 'Website template made with Vue and TailwindCSS.',
	prompts({ argv }) {
		const isFeatureFlagsUsed = typeof (
			argv.default ??
			argv.slui ??
			argv.colorSuite
		) == 'boolean'

		return [
			{
				name: 'useSSR',
				type: () => (isFeatureFlagsUsed ? null : 'toggle'),
				message: 'Add Server Side Rendering and Static Site Generation?',
				initial: true,
				active: 'Yes',
				inactive: 'No'
			},
			{
				name: 'useAppCore',
				type: () => (isFeatureFlagsUsed ? null : 'toggle'),
				message: 'Add simple application core? Includes layouts, pages, and routing.',
				initial: true,
				active: 'Yes',
				inactive: 'No'
			},
			{
				name: 'useRouter',
				type: (prev, answers) => (answers.useAppCore || isFeatureFlagsUsed ? null : 'toggle'),
				message: 'Add router?',
				initial: true,
				active: 'Yes',
				inactive: 'No'
			},
			{
				name: 'useMarkdown',
				type: (prev, answers) => (isFeatureFlagsUsed ? null : 'toggle'),
				message: 'Add support for Markdown pages and components?',
				initial: true,
				active: 'Yes',
				inactive: 'No'
			},
			{
				name: 'useSLUI',
				type: () => (isFeatureFlagsUsed ? null : 'toggle'),
				message: 'Add ShiftLimits UI library?',
				initial: true,
				active: 'Yes',
				inactive: 'No'
			},
			{
				name: 'sluiPreset',
				type: (prev, answers) => (answers.useSLUI && !isFeatureFlagsUsed ? 'select' : null),
				message: 'Select a preset for ShiftLimits UI library:',
				initial: 2,
				choices: Object.entries(SLUIPresets).map(([key, { description }]) =>({ title: key, value: key, description, selected: key == 'recommended' }))
			},
			{
				name: 'sluiFeatures',
				type: (prev, answers) => (answers.useSLUI && answers.sluiPreset == 'custom' && !isFeatureFlagsUsed ? 'multiselect' : null),
				message: 'Select the features to install from ShiftLimits UI library:',
				initial: 2,
				choices: Object.entries(SLUIFeatures).map(([key, { description }]) =>({ title: key, value: key, description, selected: key == 'recommended' }))
			},
			{
				name: 'sluiColorSuite',
				type: (prev, answers) => (answers.useSLUI && !isFeatureFlagsUsed ? 'toggle' : null),
				message: 'Use your own color palette? Adds Color Suite editor.',
				initial: false,
				active: 'Yes',
				inactive: 'No'
			},
			{
				name: 'useColorSuite',
				type: (prev, answers) => (answers.useSLUI || isFeatureFlagsUsed ? null : 'toggle'),
				message: 'Add Color Suite?',
				initial: true,
				active: 'Yes',
				inactive: 'No'
			},
			{
				name: 'useVitest',
				type: () => (isFeatureFlagsUsed ? null : 'toggle'),
				message: 'Add Vitest for Unit Testing?',
				initial: true,
				active: 'Yes',
				inactive: 'No'
			},
			{
				name: 'useYorkie',
				type: () => (isFeatureFlagsUsed ? null : 'toggle'),
				message: 'Verify that git commits adhere to conventional commit format?',
				initial: true,
				active: 'Yes',
				inactive: 'No'
			},
		]
	},
	async render({ result, root, packageName, shouldOverwrite, argv }) {
		const {
			useSSR = argv.ssr ?? true,
			useAppCore = argv.core ?? true,
			useRouter = useAppCore ?? argv.router ?? true,
			useMarkdown = argv.markdown ?? false,
			useSLUI = argv.slui ?? true,
			sluiPreset = argv.slui ? 'recommended' : undefined,
			sluiFeatures = [],
			sluiColorSuite = argv.slui ? false : undefined,
			useColorSuite = useSLUI ?? argv.colorSuite,
			useVitest = argv.vitest ?? true,
			useYorkie = argv.verifyCommits ?? true,
		} = result

		if (useSLUI && sluiPreset != 'custom') {
			switch (sluiPreset) {
				case 'basics':
					sluiFeatures.push(...['TextLink'])
					break
				case 'recommended':
					sluiFeatures.push(...['TextLink', 'SvgIcon'])
					break
				case 'everything':
					sluiFeatures.push(...Object.keys(SLUIFeatures))
					break
			}
		}

		console.log(`\nScaffolding project in \`${root}\`...`)
		if (existsSync(root) && shouldOverwrite) emptyDirSync(root)
		else ensureDirSync(root)

		const pkg = { name: packageName, version: '0.0.0' }
		writeFileSync(resolve(root, 'package.json'), JSON.stringify(pkg, null, '\t'))

		const templateRoot = resolve(__dirname, '../templates/vue-website')
		const render = function render(templateName:string) {
			const templateDir = resolve(templateRoot, templateName)
			renderTemplate(templateDir, root)
		}

		// Render base
		render('base')

		// Add configs
		if (useSSR) render('config/ssr')
		if (useRouter) render('config/router')
		if (useMarkdown) render('config/markdown')
		if (useSLUI) render('config/slui')
		if ((useColorSuite && !useSLUI) || (useSLUI && sluiColorSuite)) render('config/color-suite')
		if (useVitest) render('config/vitest')
		if (useYorkie) render('config/yorkie')

		// Render tsconfigs
		render('tsconfig/base')
		if (useVitest) render('tsconfig/vitest')

		// Code
		render('code/base')
		if (useSSR) render('code/ssr')
		if (useRouter) render('code/router')
		if (useAppCore) render('code/core')

		// Write config files
		// Tailwind config
		const tailwind_config_content_files = ["./index.html", "./src/**/*.{js,ts,vue}"]
		if (useSLUI) tailwind_config_content_files.push("./node_modules/@shiftlimits/ui/dist/**/*.{js,ts,vue}")

		const tailwind_config_file = ((useColorSuite && !useSLUI) ? `const { tailwindColors } = require('tailwindcss-color-suite')

` : '') +
`module.exports = {
	content: [${tailwind_config_content_files.map(content_file => `"${content_file}"`).join(', ')}],
	theme: {${
		(useColorSuite && !useSLUI) ? `
		colors: tailwindColors(require('./colors.config.js')),` : ''
	}
		extend: {}
	},
	plugins: [${
		useSLUI ? `\n\t\trequire('@shiftlimits/ui/tailwind')${sluiColorSuite?`({ colors: require('./colors.config.js') })`:''}\n\t` : ''
	}]
}`
		writeFileSync(resolve(root, 'tailwind.config.js'), tailwind_config_file)

		// Vite config
		const vite_config_imports:{from:string, main?:string, imports?:string[]}[] = [{ from: '@vitejs/plugin-vue', main: 'vue' }]
		const vite_config_plugins = ['vue()']

		if (useMarkdown) {
			vite_config_imports.push({ from: 'vite-plugin-vue-markdown', main: 'markdown' })
			vite_config_plugins.push(
		`markdown({
			include: ['./src/pages/**/*.md'],
			headEnabled: true
		})`)
			vite_config_plugins[0] =
		`vue({
			include: [/\.vue$/, /\.md$/]
		})`
		}

		if (useColorSuite && !useSLUI) {
			vite_config_imports.push({ from: 'tailwindcss-color-suite', imports: ['colorSuitePlugin'] })
			vite_config_plugins.push('colorSuitePlugin()')
		} else if (useSLUI) {
			vite_config_imports.push({ from: '@shiftlimits/ui/vite', main: 'slui' })
			vite_config_plugins.push(`slui(${sluiColorSuite ? `{ colorSuite: true }` : ''})`)
		}

		const vite_config_file =
`import { defineConfig } from 'vite'

${vite_config_imports.map(({from, main, imports}) => `import ${main ? main + ' ' : ''}${ imports ? `{ ${imports.join(', ')} }` : ''} from '${from}'`).join('\n')}

export default defineConfig({
	plugins: [
		${vite_config_plugins.join(',\n\t\t')}
	]
})`
		writeFileSync(resolve(root, 'vite.config.ts'), vite_config_file)

		// Write main file
		const main_file_imports = [{ from: '@vueuse/head', imports: ['createHead'] }]
		const main_file_content = [
`	const head = createHead()
	app.use(head)`
		]
		const main_file_returns = ['app', 'head']

		if (useRouter) {
			main_file_imports.push({ from: './router', imports: ['createAppRouter'] })
			main_file_content.push(
`	const router = createAppRouter()
	app.use(router)`
			)
			main_file_returns.push('router')
		}

		const main_file_component_imports:string[] = []
		if (useSLUI) {
			for (let feature of sluiFeatures) {
				if (feature == 'TextLink') main_file_component_imports.push('TextLink')
				if (feature == 'SvgIcon') main_file_component_imports.push('SvgIcon')
			}

			if (main_file_component_imports.length) main_file_imports.push({ from: '@shiftlimits/ui', imports: main_file_component_imports })
		}

		const main_file =
`import { ${ useSSR ? 'createSSRApp' : 'createApp' } as createVueApp } from 'vue'
import App from './App.vue'

${main_file_imports.map(({from, imports}) => `import { ${imports.join(', ')} } from '${from}'`).join('\n')}

export async function createApp() {
	const app = createVueApp(App)

${main_file_content.join('\n\n')}${main_file_component_imports.length ? '\n\n' + main_file_component_imports.map(component => `	app.component('${component}', ${component})`).join('\n') : ''}

	return { ${main_file_returns.join(', ')} }
}`
		writeFileSync(resolve(root, 'src/main.ts'), main_file)

		// Write entry files
		const client_entry_file =
`import { createApp } from './main'

createApp().then(({ ${main_file_returns.join(', ')} }) => {
	${ useRouter ? `router.isReady().then(() => {
		app.mount('#app')
	})` :`app.mount('#app')` }
})`
		writeFileSync(resolve(root, 'src/entry-client.ts'), client_entry_file)

		if (useSSR) {
			const node_entry_file =
`import { renderToString } from '@vue/server-renderer'
import { renderHeadToString } from '@vueuse/head'
import { basename } from 'path'
import { createApp } from './main'

export async function render(url:string, manifest:any) {
	const { ${main_file_returns.join(', ')} } = await createApp()
${ useRouter ? `
	router.push(url)
	await router.isReady()\n` : '' }
	let ctx:{ modules?:any } = {}

	const html = await renderToString(app, ctx)
	const { headTags, htmlAttrs, bodyAttrs } = renderHeadToString(head)

	if (manifest) {
		const preloadLinks = renderPreloadLinks(ctx.modules, manifest)
		return [headTags, htmlAttrs, bodyAttrs, html, preloadLinks]
	}

	return [headTags, htmlAttrs, bodyAttrs, html]
}

function renderPreloadLinks(modules, manifest) {
	let links = ''
	const seen = new Set()
	modules.forEach((id) => {
		const files = manifest[id]
		if (files) {
			files.forEach((file) => {
				if (!seen.has(file)) {
					seen.add(file)
					const filename = basename(file)
					if (manifest[filename]) {
						for (const depFile of manifest[filename]) {
							links += renderPreloadLink(depFile)
							seen.add(depFile)
						}
					}
					links += renderPreloadLink(file)
				}
			})
		}
	})
	return links
}

function renderPreloadLink(file:string) {
	if (file.endsWith('.js')) {
		return \`<link rel="modulepreload" crossorigin href="\${file}">\`
	} else if (file.endsWith('.css')) {
		return \`<link rel="stylesheet" href="\${file}">\`
	} else if (file.endsWith('.woff')) {
		return \` <link rel="preload" href="\${file}" as="font" type="font/woff" crossorigin>\`
	} else if (file.endsWith('.woff2')) {
		return \` <link rel="preload" href="\${file}" as="font" type="font/woff2" crossorigin>\`
	} else if (file.endsWith('.gif')) {
		return \` <link rel="preload" href="\${file}" as="image" type="image/gif">\`
	} else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
		return \` <link rel="preload" href="\${file}" as="image" type="image/jpeg">\`
	} else if (file.endsWith('.png')) {
		return \` <link rel="preload" href="\${file}" as="image" type="image/png">\`
	} else {
		// TODO
		return ''
	}
}`
			writeFileSync(resolve(root, 'src/entry-node.ts'), node_entry_file)
		}
	}
})