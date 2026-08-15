/**
 * The Minecraft versions the documentation covers.
 *
 * This is the only file to touch when a new one lands. Everything else — the
 * version dropdown, the sidebar for each version, which one `/docs/` redirects
 * to — is built from here, so a version cannot be half-added: present in the
 * menu and missing from the sidebar, or the reverse.
 *
 * Adding 26.3: copy `docs/26.2` to `docs/26.3`, add an entry at the top of the
 * list below, and mark the old one `current: false`.
 */

export interface Version {
  /** The Minecraft version, and the directory name under docs/. */
  readonly id: string
  /** The one the version menu opens on, and where a bare /docs/ link goes. */
  readonly current: boolean
  /** Shown beside the number in the menu. */
  readonly note?: string
}

export const versions: readonly Version[] = [
  { id: '26.2', current: true }
]

export const currentVersion = versions.find(v => v.current) ?? versions[0]

/**
 * The pages of one version's documentation, in reading order.
 *
 * Shared by every version: a page that exists for one and not another would be
 * a dead sidebar entry, so the list is the same and the files are what differ.
 */
export const pages = [
  {
    text: 'Getting started',
    items: [
      { text: 'What Fenix is', link: 'index' },
      { text: 'Your first mod', link: 'first-mod' },
      { text: 'The mod manifest', link: 'mod-manifest' }
    ]
  },
  {
    text: 'Content',
    items: [
      { text: 'The registrar', link: 'registrar' },
      { text: 'Blocks and items', link: 'blocks-and-items' },
      { text: 'Entities', link: 'entities' },
      { text: 'Creative tabs', link: 'creative-tabs' }
    ]
  },
  {
    text: 'Ember',
    items: [
      { text: 'What Ember writes', link: 'ember' },
      { text: 'Models and blockstates', link: 'ember-models' },
      { text: 'Loot, recipes and tags', link: 'ember-data' }
    ]
  },
  {
    text: 'Behaviour',
    items: [
      { text: 'Events', link: 'events' },
      { text: 'Networking', link: 'networking' },
      { text: 'Commands', link: 'commands' },
      { text: 'Configuration', link: 'config' }
    ]
  },
  {
    text: 'Reaching into the game',
    items: [
      { text: 'Accessible members', link: 'accessible' },
      { text: 'Mixins', link: 'mixins' }
    ]
  }
]

/** The sidebar for one version, as VitePress wants it. */
export function sidebarFor(version: string) {
  return pages.map(section => ({
    text: section.text,
    collapsed: false,
    items: section.items.map(page => ({
      text: page.text,
      link: `/docs/${version}/${page.link === 'index' ? '' : page.link}`
    }))
  }))
}

/** Every version's sidebar, keyed by the path it applies under. */
export function sidebars() {
  return Object.fromEntries(
    versions.map(v => [`/docs/${v.id}/`, sidebarFor(v.id)])
  )
}
