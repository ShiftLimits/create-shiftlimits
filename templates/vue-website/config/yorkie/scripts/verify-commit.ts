// Invoked on the commit-msg git hook by yorkie.

import { bgRed, white, red, green } from 'kolorist'
import { readFileSync } from 'fs'
const msgPath = process.env.GIT_PARAMS
if (!msgPath) {
  console.log()
  console.error(
    `  ${bgRed(white(' ERROR '))} ${red(
      `unable to get message path.`
    )}`
  )
  process.exit(1)
}

const msg = readFileSync(msgPath, 'utf-8').trim()

const releaseRE = /^v\d/
const commitRE = /^(revert: )?(feat|fix|docs|dx|refactor|perf|test|workflow|build|ci|chore|types|wip|release|deps)(\(.+\))?: .{1,50}/

if (!releaseRE.test(msg) && !commitRE.test(msg)) {
  console.log()
  console.error(
    `  ${bgRed(white(' ERROR '))} ${red(
      `invalid commit message format.`
    )}\n\n` +
      red(
        `  Proper commit message format is required for automated changelog generation. Examples:\n\n`
      ) +
      `    ${green(`feat: add 'comments' option`)}\n` +
      `    ${green(`fix: handle events on blur (close #28)`)}\n\n` +
      red(`  See .github/commit-convention.md for more details.\n`)
  )
  process.exit(1)
}