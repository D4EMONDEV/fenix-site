import fs from 'node:fs'
import path from 'node:path'
import { versions, sections } from './versions'

/**
 * Builds each version's sidebar from the pages that are actually on disk.
 *
 * Imported only by `config.mts`, which runs in node. Keeping it out of
 * `versions.ts` is what stops `node:fs` being handed to the browser bundle,
 * where Vite externalises it and the failure waits for somebody to call the
 * wrong function.
 *
 * Deliberately not a list kept beside the files. A list gets out of step in
 * two ways and they fail differently: an entry with no file is a dead link,
 * which fails the build and is therefore fine, and a file with no entry is a
 * page that exists and is linked from nowhere — no error, no warning, and
 * nobody reads it. The second is what the in-browser editor would produce on
 * every new page, so there is no list.
 */

interface Page {
  file: string
  title: string
  section: string
  order: number
}

/**
 * Reads the front matter of one page.
 *
 * By hand rather than with a parser: three scalar fields, read at build time,
 * from files this repository writes. A dependency for that is a dependency to
 * keep.
 */
function read(file: string): Page {
  const text = fs.readFileSync(file, 'utf-8')
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? ''
  const field = (name: string) =>
    new RegExp(`^${name}:\\s*(.+)$`, 'm').exec(block)?.[1].trim().replace(/^["']|["']$/g, '')

  const stem = path.basename(file, '.md')
  return {
    // A page with no title is still a page: showing its filename beats showing
    // nothing, and beats refusing to build.
    file: stem,
    title: field('title') ?? stem,
    section: field('section') ?? 'Other',
    order: Number(field('order') ?? 500)
  }
}

/** The sidebar for one version. */
export function sidebarFor(version: string) {
  const directory = path.resolve(__dirname, '..', 'docs', version)
  if (!fs.existsSync(directory)) return []

  const pages = fs
    .readdirSync(directory)
    .filter(name => name.endsWith('.md'))
    .map(name => read(path.join(directory, name)))

  const grouped = new Map<string, Page[]>()
  for (const page of pages) {
    const list = grouped.get(page.section) ?? []
    list.push(page)
    grouped.set(page.section, list)
  }

  const ordered = [
    ...sections.filter(s => grouped.has(s)),
    ...[...grouped.keys()].filter(s => !sections.includes(s)).sort()
  ]

  return ordered.map(section => ({
    text: section,
    collapsed: false,
    items: grouped
      .get(section)!
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
      .map(page => ({
        text: page.title,
        link: `/docs/${version}/${page.file === 'index' ? '' : page.file}`
      }))
  }))
}

/** Every version's sidebar, keyed by the path it applies under. */
export function sidebars() {
  return Object.fromEntries(
    versions.map(v => [`/docs/${v.id}/`, sidebarFor(v.id)])
  )
}
