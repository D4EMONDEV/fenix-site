import { defineConfig } from 'vitepress'
import { versions, currentVersion, sidebars } from './versions'

// Two repositories: the loader's, and this site's own. The site is a
// repository of its own because the Fenix repository already serves its
// Maven artifacts from Pages, and a repository has one Pages site.
const codeRepo = 'https://github.com/D4EMONDEV/Fenix'
const siteRepo = 'https://github.com/D4EMONDEV/fenix-site'

export default defineConfig({
  title: 'Fenix',
  description: 'A Minecraft mod loader for 26.2 on Java 25.',
  lang: 'en',

  // The site is served from a repository of its own, beside the Maven one.
  base: '/fenix-site/',

  // A missing link is a build failure rather than a 404 somebody finds later.
  ignoreDeadLinks: false,

  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/fenix-site/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/fenix-site/favicon.png' }]
  ],

  themeConfig: {
    logo: '/favicon.svg',

    nav: [
      { text: 'Documentation', link: `/docs/${currentVersion.id}/`, activeMatch: '/docs/' },
      { text: 'Ember', link: '/ember' },
      {
        // The version menu. Built from versions.ts, so it cannot disagree with
        // the sidebars.
        text: currentVersion.id,
        items: versions.map(v => ({
          text: v.note ? `${v.id} — ${v.note}` : v.id,
          link: `/docs/${v.id}/`
        }))
      },
      {
        text: 'More',
        items: [
          { text: 'Settings', link: '/settings' },
          { text: 'Account', link: '/account' },
          { text: 'Edit the docs', link: '/admin' },
          { text: 'Changelog', link: `${codeRepo}/blob/main/CHANGELOG.md` }
        ]
      }
    ],

    sidebar: sidebars(),

    socialLinks: [{ icon: 'github', link: codeRepo }],

    search: { provider: 'local' },

    editLink: {
      // The site's own repository: that is where these pages live, and what
      // the in-browser editor commits to.
      pattern: `${siteRepo}/edit/main/:path`,
      text: 'Edit this page on GitHub'
    },

    outline: { level: [2, 3], label: 'On this page' },

    docFooter: { prev: 'Previous', next: 'Next' },

    footer: {
      message: 'Not an official Minecraft product. Not approved by or associated with Mojang.',
      copyright: `MIT licensed · <a href="${codeRepo}">D4EMONDEV/Fenix</a>`
    }
  }
})
