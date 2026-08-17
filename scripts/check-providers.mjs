/**
 * Checks that the pages listing Ember's providers list all of them.
 *
 * The /ember page went from complete to seven-of-eighteen without anyone
 * noticing, because a table of names is prose to a reader and data to nobody.
 * Adding a provider means writing it, documenting it, and remembering two
 * separate tables — and the third of those is the one that stops happening.
 *
 * The source of truth is the loader's repository: the Ember source directory
 * itself, so a provider counts as documented only once it is named.
 *
 * Run by `npm run check`, and by the Pages workflow before every deploy.
 */
import { readFile } from 'node:fs/promises'

const CONTENTS =
  'https://api.github.com/repos/D4EMONDEV/Fenix/contents/ember/src/main/java/fr/d4emon/fenix/ember'

/** The pages that promise to list them, and how each one writes a name. */
const PAGES = [
  { path: 'ember.md', pattern: /^\| `(Ember[A-Za-z]+)`/gm },
  { path: 'docs/26.2/ember.md', pattern: /^\| `(Ember[A-Za-z]+)(?:\.[A-Za-z]+)?`/gm }
]

/**
 * The abstract base is not a provider a mod extends directly, so it is not
 * something a page should list.
 */
const NOT_A_PROVIDER = new Set(['EmberProvider'])

async function providers() {
  const response = await fetch(CONTENTS, {
    headers: { accept: 'application/vnd.github+json' }
  })
  if (!response.ok) {
    throw new Error(`could not read the Ember sources: HTTP ${response.status}`)
  }
  return new Set(
    (await response.json())
      .map(entry => entry.name)
      .filter(name => /^Ember[A-Za-z]+Provider\.java$/.test(name))
      .map(name => name.replace('.java', ''))
      .filter(name => !NOT_A_PROVIDER.has(name))
  )
}

const expected = await providers()
if (expected.size === 0) {
  console.error('no providers found; this check has stopped reading the sources')
  process.exitCode = 1
} else {
  const problems = []
  for (const page of PAGES) {
    const text = await readFile(page.path, 'utf8')
    const listed = new Set([...text.matchAll(page.pattern)].map(m => m[1]))
    for (const provider of expected) {
      if (!listed.has(provider)) {
        problems.push(`${page.path}: ${provider} is not listed`)
      }
    }
  }

  if (problems.length > 0) {
    console.error(`${problems.length} provider(s) missing from the pages:\n`)
    for (const problem of problems) console.error(`  ${problem}`)
    console.error('\nAdd them, or the reader cannot find what Ember can write.')
    process.exitCode = 1
  } else {
    console.log(
      `${expected.size} Ember providers, all listed on ${PAGES.length} pages`
    )
  }
}
