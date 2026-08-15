// Without fonts: the default theme bundles Inter and preloads it, and this
// site sets --vp-font-family-base to the reader's own system font. Left as
// the plain import, every visitor downloads a typeface that the CSS then
// prevents from ever being drawn.
import DefaultTheme from 'vitepress/theme-without-fonts'
import type { Theme } from 'vitepress'
import './custom.css'

/**
 * The default theme, with three pages of our own registered as components.
 *
 * Settings, the account page and the documentation editor are the only parts
 * of this site that do anything at run time. Everything else is Markdown that
 * became HTML at build time and stays that way.
 */
import Settings from './Settings.vue'
import Account from './Account.vue'
import Admin from './Admin.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('Settings', Settings)
    app.component('Account', Account)
    app.component('Admin', Admin)
  }
} satisfies Theme
