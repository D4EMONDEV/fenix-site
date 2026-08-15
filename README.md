# The Fenix site

The home page and the documentation, as a VitePress site.

```
npm install
npm run dev      # http://localhost:5173/fenix-site/
npm run build
```

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

Pages are Markdown under `docs/<version>/`. The sidebar comes from the `pages`
list in `.vitepress/versions.ts`, not from the filenames — a page not in that
list is not linked, and an entry with no file is a dead link that fails the
build.

Documentation here is written by hand. It is not generated from Javadoc, and it
should not be: the Javadoc says what a method takes, and these pages exist to
say what goes wrong when you get it right and it still does not work.

## The editor

`/admin` lets somebody with push access to this repository edit a page in the
browser and commit it. There is no server and no account system of its own —
the token is GitHub's, the permission check is GitHub's, and a save is an
ordinary commit on `main` that this repository's Pages workflow then builds.

See `.vitepress/theme/github.ts`.
