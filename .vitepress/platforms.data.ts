/**
 * The platform table, read once while the site is built.
 *
 * A VitePress data loader: `load()` runs in Node during the build, and what it
 * returns is baked into the bundle. The template generator then needs no
 * network at all to know which versions to write.
 *
 * It used to fetch this from the browser on every page load, with
 * `cache: 'no-cache'` so the copy was always fresh. That is one request to
 * raw.githubusercontent per visitor, which is how the page started answering
 * "HTTP 429" — GitHub rate-limits by address, and the generator refused to
 * generate rather than guess a version.
 *
 * Baking it keeps that promise and drops the request. The numbers still come
 * from the real file rather than from anybody's memory: a copy of it is
 * committed beside this loader, refreshed from upstream when the network
 * allows, and `check-coordinates` fails the build when the copy and the pages
 * have fallen behind what was released.
 */
import { readFile } from 'node:fs/promises'
import type { SiteConfig } from 'vitepress'

const PLATFORMS =
  'https://raw.githubusercontent.com/D4EMONDEV/Fenix/main/platforms.json'

export interface Platform {
  minecraft: string
  branch: string
  status: string
  java: number
  loader: string
  api: string
  ember: string
  processor: string
}

export interface PlatformTable {
  schema: number
  plugin: string
  platforms: Platform[]
}

declare const data: PlatformTable
export { data }

export default {
  /** Re-read whenever the build runs, rather than being cached across builds. */
  watch: null as SiteConfig['userConfig'] | null,

  async load(): Promise<PlatformTable> {
    // The committed copy first, so a build never depends on a network that may
    // be down, offline, or — as happened — rate-limiting this address. It is a
    // copy of the real file, not a guess: `npm run check` compares it to
    // upstream and fails when the two disagree.
    const local = JSON.parse(
      await readFile(new URL('../platforms.json', import.meta.url), 'utf8')
    ) as PlatformTable

    let table = local
    try {
      const response = await fetch(PLATFORMS, { headers: { accept: 'application/json' } })
      if (response.ok) {
        table = (await response.json()) as PlatformTable
      } else {
        console.warn(
          `[platforms] upstream answered HTTP ${response.status}; using the ` +
            'committed copy. `npm run check` will say if it has fallen behind.'
        )
      }
    } catch (error) {
      console.warn(`[platforms] upstream unreachable (${error}); using the committed copy.`)
    }

    if (!table.platforms?.length || !table.plugin) {
      throw new Error('platforms.json has no platforms or no plugin version')
    }
    return table
  }
}
