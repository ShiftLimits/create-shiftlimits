#!/usr/bin/env node

import { existsSync, readdirSync } from 'fs-extra'
import minimist from 'minimist'
import prompts from 'prompts'
import { red } from 'kolorist'
import { join, relative } from 'path'

import { projectTemplates } from './templates'
import { executeTemplate, formatCommand } from './utils'
import { bold } from 'kolorist'
import { green } from 'kolorist'
const cwd = process.cwd()

function isValidPackageName(projectName:string) {
	return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName)
}

function toValidPackageName(projectName:string) {
	return projectName
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/^[._]/, '')
		.replace(/[^a-z0-9-~]+/g, '-')
}

function canSafelyOverwrite(dir:string) {
	return !existsSync(dir) || readdirSync(dir).length === 0
}

async function init() {
	const argv = minimist(process.argv.slice(2), {
    alias: {
    },
    // all arguments are treated as booleans
    boolean: true
	})

	const isFeatureFlagsUsed =
		typeof (
			argv.default
		) === 'boolean'

  let targetDir = argv._[0]
  const defaultProjectName = !targetDir ? 'sl-project' : targetDir

	let targetTemplate = argv._[1]
	const defaultProjectTemplate = !targetTemplate ? Object.keys(projectTemplates)[0] : targetTemplate

	const forceOverwrite = argv.force

	let result: {
    projectName?: string
    projectTemplate?: keyof typeof projectTemplates
		shouldOverwrite?: boolean
		packageName?: string
	} = {}

	try {
		result = await prompts(
			[
				{
					name: 'projectName',
					type: targetDir ? null : 'text',
					message: 'Project name:',
					initial: defaultProjectName,
					onState: (state) => (targetDir = String(state.value).trim() || defaultProjectName)
				},
				{
					name: 'projectTemplate',
					type: targetTemplate || argv.default ? null : 'select',
					message: 'Project template:',
          choices: Object.entries(projectTemplates).map(([key, { description }]) =>({ title: key, value: key, description, selected: key == defaultProjectTemplate }))
				},
				{
					name: 'shouldOverwrite',
					type: () => (canSafelyOverwrite(targetDir) || forceOverwrite ? null : 'confirm'),
					message: () => {
						const dirForPrompt =
							targetDir === '.' ? 'Current directory' : `Target directory "${targetDir}"`

						return `${dirForPrompt} is not empty. Remove existing files and continue?`
					}
				},
				{
					name: 'overwriteChecker',
					type: (prev, values) => {
						if (values.shouldOverwrite === false) {
							throw new Error(red('×') + ' Operation cancelled')
						}
						return null
					}
				},
				{
					name: 'packageName',
					type: () => (isValidPackageName(targetDir) ? null : 'text'),
					message: 'Package name:',
					initial: () => toValidPackageName(targetDir),
					validate: (dir) => isValidPackageName(dir) || 'Invalid package.json name'
				}
			],
			{
				onCancel: () => {
					throw new Error(red('×') + ' Operation cancelled')
				}
			}
		)
	} catch (cancelled) {
		if (cancelled instanceof Error) console.log(cancelled.message)
		process.exit(1)
	}

	const {
    projectName,
    projectTemplate = defaultProjectTemplate,
		packageName = projectName ?? defaultProjectName,
		shouldOverwrite = argv.force
	} = result
	const root = join(cwd, targetDir)

  const template = projectTemplates[projectTemplate]
  if (template) {
    await executeTemplate(template, { root, packageName, shouldOverwrite, argv })
  } else {
    console.log(`${red('×')} Unknown template ${projectTemplate}`)
    process.exit(1)
  }

  const userAgent = process.env.npm_config_user_agent ?? ''
  const packageManager = /pnpm/.test(userAgent) ? 'pnpm' : /yarn/.test(userAgent) ? 'yarn' : 'npm'

  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  ${bold(green(`cd ${relative(cwd, root)}`))}`)
  }
  console.log(`  ${bold(green(formatCommand(packageManager, 'install')))}`)
  console.log(`  ${bold(green(formatCommand(packageManager, 'dev')))}`)
  console.log()
}


init().catch((e) => {
	console.error(e)
})