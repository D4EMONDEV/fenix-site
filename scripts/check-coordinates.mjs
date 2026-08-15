/**
 * Checks that the versions written in these pages are the ones Fenix released.
 *
 * The documentation is written by hand, which is the point of it — but a
 * Gradle snippet is not prose, it is something a reader copies. A coordinate
 * that has fallen behind does not read as out of date; it reads as correct and
 * fails in the reader's build, with an error naming a version they never chose.
 *
 * The source of truth is platforms.json in the loader's repository: it is the
 * file the Gradle plugin ships and the one `checkPlatforms` already keeps in
 * step with gradle.properties, so there is no third place for a number to hide.
 *
 * Run by `npm run check`, and by the Pages workflow before every deploy.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const PLATFORMS =
  'https://raw.githubusercontent.com/D4EMONDEV/Fenix/main/platforms.json'

/** What a snippet can name, and where the real answer lives in platforms.json. */
const COORDINATES = [
  {
    what: 'the Gradle plugin',
    // id 'fr.d4emon.fenix.dev' version '0.2.2'
    pattern: /fr\.d4emon\.fenix\.dev'\s+version\s+'([^']+)'/g,
    expected: platforms => platforms.plugin
  },
  {
    what: 'the API bundle',
    // fenixApi 'fr.d4emon.fenix:fenix-api:0.6.0+mc26.2'
    pattern: /fr\.d4emon\.fenix:fenix-api:([0-9][^'"\s]*)/g,
    expected: (platforms, mc) => `${current(platforms, mc).api}+mc${mc}`
  },
  {
    what: 'Ember',
    pattern: /fr\.d4emon\.fenix:ember:([0-9][^'"\s]*)/g,
    expected: (platforms, mc) => `${current(platforms, mc).ember}+mc${mc}`
  },
  {
    what: 'the loader',
    pattern: /fr\.d4emon\.fenix:fenix-loader:([0-9][^'"\s]*)/g,
    expected: (platforms, mc) => `${current(platforms, mc).loader}+mc${mc}`
  }
]

function current(platforms, mc) {
  const found = platforms.platforms.find(p => p.minecraft === mc)
  if (!found) {
    throw new Error(
      `platforms.json says nothing about Minecraft ${mc}, but docs/${mc} exists`
    )
  }
  return found
}

/** Every markdown file, and the documentation version it belongs to. */
async function pages(directory, version = null, found = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      // docs/26.2/… belongs to 26.2; anything else inherits, and pages outside
      // a version directory are checked against the current one.
      const next = /^\d+\.\d+$/.test(entry.name) ? entry.name : version
      await pages(path, next, found)
    } else if (entry.name.endsWith('.md')) {
      found.push({ path, version })
    }
  }
  return found
}

const response = await fetch(PLATFORMS)
if (!response.ok) {
  console.error(`could not read platforms.json: ${response.status}`)
  // exitCode rather than exit(): on Windows, exiting while stdout is still
  // draining aborts the process with a libuv assertion and reports 127, which
  // a CI step reads as "command not found" rather than "the check failed".
  process.exitCode = 2
}
const platforms = await response.json()
const currentMc = platforms.platforms.find(p => p.status === 'current').minecraft

const problems = []
let checked = 0

for (const page of await pages(process.cwd())) {
  const text = await readFile(page.path, 'utf-8')
  const mc = page.version ?? currentMc

  for (const coordinate of COORDINATES) {
    for (const match of text.matchAll(coordinate.pattern)) {
      checked++
      const expected = coordinate.expected(platforms, mc)
      if (match[1] !== expected) {
        problems.push(
          `${relative(process.cwd(), page.path)}: ${coordinate.what} is ` +
          `${match[1]}, and ${expected} was released`
        )
      }
    }
  }
}

if (checked === 0) {
  console.error(
    'no coordinates found in any page. Either the snippets changed shape, ' +
    'in which case this check now proves nothing, or the docs stopped ' +
    'telling anybody how to depend on Fenix.'
  )
  process.exitCode = 2
}

if (problems.length > 0) {
  console.error(`${problems.length} coordinate(s) behind the release:\n`)
  for (const problem of problems) console.error(`  ${problem}`)
  console.error('\nUpdate the pages, or the release did not happen.')
  process.exitCode = 1
}

if (!process.exitCode) {
  console.log(`${checked} coordinates checked against platforms.json, all current`)
}
