/**
 * The Minecraft versions the documentation covers, and the order its sections
 * appear in.
 *
 * Data only, and deliberately so: this file is read by the build *and* by the
 * pages that run in a browser — the version menu, the settings page, the
 * editor. Anything reaching for the filesystem belongs in `sidebar.ts`, which
 * only the build imports. Put together, Vite externalises `node:fs` for the
 * browser bundle and the failure waits until somebody calls the wrong
 * function.
 *
 * This is the only file to touch when a new version lands. Everything else is
 * built from it, so a version cannot be half-added.
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
 * The order sections appear in, top to bottom.
 *
 * A page whose `section` is not named here still appears — under its own
 * heading, at the end. Better a section in the wrong place than a page nobody
 * can reach because somebody typed a name that is not on a list.
 */
export const sections: readonly string[] = [
  'Getting started',
  'Content',
  'Ember',
  'Behaviour',
  'Reaching into the game'
]
