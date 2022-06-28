import type prompts from 'prompts'
import { default as p } from 'prompts'
import { red } from 'kolorist'
import type minimist from 'minimist'

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs-extra'
import { basename, dirname, resolve } from 'path'
import deepMerge from './deepMerge'
import sortDependencies from './sortDependencies'

type PromptsContext = {
	root:string
	packageName:string
  shouldOverwrite:boolean
	argv:minimist.ParsedArgs
}

type RenderContext<R, T extends string> = PromptsContext&{
	result?:prompts.Answers<T>|R
}

interface Template<R extends Record<string, any>, T extends string> {
	name:string
	description?:string
	prompts?:
		(prompts.PromptObject<T> | Array<prompts.PromptObject<T>>) |
		((context:PromptsContext)=>prompts.PromptObject<T> | Array<prompts.PromptObject<T>>)
	render(context?:RenderContext<R, T>):Promise<void>
}

export function defineTemplate<R extends Record<string, any>, T extends string = string>(template:Template<R, T>) {
	return template
}

export async function executeTemplate<R extends Record<string, any>, T extends string = string>(template:Template<R, T>, context:PromptsContext) {
	let result:prompts.Answers<T>

	if (template.prompts) try {
		const questions = typeof template.prompts == 'function' ? template.prompts(context) : template.prompts
		result = await p(questions, {
			onCancel: () => {
				throw new Error(red('×') + ' Operation cancelled')
			}
		})
	} catch (cancelled) {
		if (cancelled instanceof Error) console.log(cancelled.message)
		process.exit(1)
	}

	await template.render({ result, ...context })
}

/**
 * Renders a template folder/file to the file system,
 * by recursively copying all files under the `src` directory,
 * with the following exception:
 *   - `_filename` should be renamed to `.filename`
 *   - Fields in `package.json` should be recursively merged
 * @param {string} src source filename to copy
 * @param {string} dest destination filename of the copy operation
 */
export function renderTemplate(src:string, dest:string) {
  const stats = statSync(src)

  if (stats.isDirectory()) {
    // skip node_module
    if (basename(src) === 'node_modules') {
      return
    }

    // if it's a directory, render its subdirectories and files recursively
    mkdirSync(dest, { recursive: true })
    for (const file of readdirSync(src)) {
      renderTemplate(resolve(src, file), resolve(dest, file))
    }
    return
  }

  const filename = basename(src)

  if (filename === 'package.json' && existsSync(dest)) {
    // merge instead of overwriting
    const existing = JSON.parse(readFileSync(dest, 'utf8'))
    const newPackage = JSON.parse(readFileSync(src, 'utf8'))
    const pkg = sortDependencies(deepMerge(existing, newPackage))
    writeFileSync(dest, JSON.stringify(pkg, null, 2) + '\n')
    return
  }

  if (filename.startsWith('_')) {
    // rename `_file` to `.file`
    dest = resolve(dirname(dest), filename.replace(/^_/, '.'))
  }

  copyFileSync(src, dest)
}
