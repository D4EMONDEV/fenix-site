# The Fenix site

The home page and the documentation, as a VitePress site.

```
npm install
npm run dev      # http://localhost:5173/fenix-site/
npm run build
npm run check    # are the versions in the pages the ones Fenix released?
```

`npm run check` reads every Gradle snippet in every page and compares it to
`platforms.json` in the loader's repository. It runs before each deploy and once
a day — daily because the drift it catches happens in the *other* repository:
releasing Fenix does not touch this one, so nothing here would otherwise
rebuild and nothing would notice.

## Where this belongs

This directory is the whole content of a repository of its own,
`D4EMONDEV/fenix-site`, served at `https://d4emondev.github.io/fenix-site/`.

It is separate from the loader's repository for one reason: a GitHub repository
has one Pages site, and `D4EMONDEV/Fenix` already spends its on the Maven
repository that mods resolve from. Putting the site there would mean either
breaking every `fenixApi` coordinate in every build file that names it, or
mixing a documentation site into the branch whose whole job is to be a durable
artifact store.

The two repositories stay in step by hand, which is the honest trade: the
documentation describes a released version, so it should not move every time
the loader's source does.

## Adding a Minecraft version

Three steps, and the first two are mechanical:

1. `cp -r docs/26.2 docs/26.3`
2. In `.vitepress/versions.ts`, add `{ id: '26.3', current: true }` at the top
   of the list and set `26.2` to `current: false`.
3. Read the copied pages and fix what the game changed.

Everything else — the version menu, the sidebar for the new version, where a
bare `/docs/` link goes, what the editor offers — is built from that list, so a
version cannot end up half-added: in the menu and missing from the sidebar, or
the reverse.

Old versions stay. Somebody is still running 26.2 and their documentation
should not disappear because a newer game exists.

## Writing pages

Pages are Markdown under `docs/<version>/`. Each carries three fields that
decide where it appears:

```yaml
---
title: The Registrar
section: Content
order: 0
---
```

The sidebar is built from the files themselves, at build time, by
`.vitepress/sidebar.ts`. There is no list to keep beside them, and that is the
point: a list gets out of step in two ways, and only one of them is loud. An
entry with no file is a dead link, which fails the build. A file with no entry
is a page that exists, is linked from nowhere, and is read by nobody — no
error, no warning. The second is exactly what the in-browser editor would
produce on every new page.

`section` may be anything. Names in the `sections` list in `versions.ts` appear
in that order; anything else gets a heading of its own at the end, rather than
the page vanishing because somebody typed a name that was not on a list.

Documentation here is written by hand. It is not generated from Javadoc, and it
should not be: the Javadoc says what a method takes, and these pages exist to
say what goes wrong when you get it right and it still does not work.

## The editor

`/admin` lets somebody with push access to this repository edit a page in the
browser and commit it, or create one — the new-page form writes the front
matter above, which is what puts it in the sidebar. There is no server and no account system of its own —
the token is GitHub's, the permission check is GitHub's, and a save is an
ordinary commit on `main` that this repository's Pages workflow then builds.

See `.vitepress/theme/github.ts`.
