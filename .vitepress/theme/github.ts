/**
 * The little that this site does at run time.
 *
 * There is no server here — the site is files on GitHub Pages — so the
 * question "may this person edit the documentation?" is not one this code can
 * answer. It asks GitHub instead: the editor sends a token with every write,
 * and GitHub refuses anyone without push access to the repository. Nothing
 * here decides who is allowed, which is the point. A check written in the page
 * would be a check anybody can read past.
 *
 * The token is kept in localStorage, so it stays on the machine that typed it.
 * It is never sent anywhere except api.github.com.
 */

/** Where the documentation lives, and what a save commits to. */
export const SITE_REPO = { owner: 'D4EMONDEV', name: 'fenix-site', branch: 'main' }

/** Where the loader itself lives. */
export const CODE_REPO = 'https://github.com/D4EMONDEV/Fenix'

const TOKEN_KEY = 'fenix.github.token'

export interface Identity {
  login: string
  name: string | null
  avatar: string
  /** Whether GitHub says this account may push to the documentation repo. */
  mayEdit: boolean
}

export function storedToken(): string {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token.trim())
}

export function forgetToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

async function call(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers
    }
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    throw new Error(detail.message || `GitHub answered ${response.status}`)
  }
  return response.json()
}

/**
 * Who the token belongs to, and whether they may write here.
 *
 * The permission comes from GitHub's own answer about the repository rather
 * than from a list kept in this file. A list would have to be edited every
 * time somebody joins or leaves, and would be wrong in between.
 */
export async function identify(token: string): Promise<Identity> {
  const user = await call('/user', token)

  let mayEdit = false
  try {
    const repo = await call(`/repos/${SITE_REPO.owner}/${SITE_REPO.name}`, token)
    mayEdit = Boolean(repo.permissions?.push)
  } catch {
    // A token that cannot even see the repository certainly cannot write to
    // it. Not an error to report: signing in to read is a fair thing to do.
    mayEdit = false
  }

  return {
    login: user.login,
    name: user.name ?? null,
    avatar: user.avatar_url,
    mayEdit
  }
}

export interface DocFile {
  /** Path inside the repository, such as `docs/26.2/events.md`. */
  path: string
  /** GitHub's handle for the version being edited, needed to save safely. */
  sha: string
  text: string
}

/** Every Markdown file under a version's documentation directory. */
export async function listDocs(token: string, version: string): Promise<string[]> {
  // Relative to the repository root, which is also the site root: this
  // repository is the site. The path carried a `website/` prefix for as long
  // as the site lived inside the loader's repository, and kept it for one
  // commit after moving out — the listing came back 404 and the editor said
  // there were no pages.
  const directory = `docs/${version}`
  let entries
  try {
    entries = await call(
      `/repos/${SITE_REPO.owner}/${SITE_REPO.name}/contents/${directory}?ref=${SITE_REPO.branch}`,
      token
    )
  } catch (cause) {
    // GitHub answers a missing directory with "Not Found" and nothing else,
    // which says neither what was looked for nor where. Naming the path turns
    // the next wrong one into something readable rather than a shrug.
    throw new Error(
      `${(cause as Error).message} — looked for ${directory} in ` +
      `${SITE_REPO.owner}/${SITE_REPO.name} on ${SITE_REPO.branch}`
    )
  }
  return (entries as { name: string; type: string }[])
    .filter(entry => entry.type === 'file' && entry.name.endsWith('.md'))
    .map(entry => `${directory}/${entry.name}`)
    .sort()
}

export async function readDoc(token: string, path: string): Promise<DocFile> {
  const file = await call(
    `/repos/${SITE_REPO.owner}/${SITE_REPO.name}/contents/${path}?ref=${SITE_REPO.branch}`,
    token
  )
  // atob gives bytes, not characters; the docs contain accented text and the
  // difference shows as mojibake the moment somebody writes "générés".
  const bytes = Uint8Array.from(atob(file.content.replace(/\n/g, '')), c => c.charCodeAt(0))
  return { path, sha: file.sha, text: new TextDecoder().decode(bytes) }
}

/**
 * Commits an edited page.
 *
 * The sha read with the file goes back with the write, so GitHub refuses the
 * save if somebody else changed the page in between rather than quietly
 * dropping their work.
 */
export async function saveDoc(
  token: string,
  file: DocFile,
  message: string
): Promise<string> {
  const bytes = new TextEncoder().encode(file.text)
  const base64 = btoa(String.fromCharCode(...bytes))

  const result = await call(
    `/repos/${SITE_REPO.owner}/${SITE_REPO.name}/contents/${file.path}`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: base64,
        sha: file.sha,
        branch: SITE_REPO.branch
      })
    }
  )
  return result.content.sha as string
}
