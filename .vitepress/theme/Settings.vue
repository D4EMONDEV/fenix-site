<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useData } from 'vitepress'
import { versions, currentVersion } from '../versions'

const { isDark } = useData()

const preferredVersion = ref(currentVersion.id)
const codeTheme = ref<'auto' | 'light' | 'dark'>('auto')

onMounted(() => {
  preferredVersion.value = localStorage.getItem('fenix.version') ?? currentVersion.id
  codeTheme.value = (localStorage.getItem('fenix.theme') as typeof codeTheme.value) ?? 'auto'
  apply()
})

watch(preferredVersion, v => localStorage.setItem('fenix.version', v))
watch(codeTheme, () => {
  localStorage.setItem('fenix.theme', codeTheme.value)
  apply()
})

/**
 * Forgets both choices and the token, if there is one.
 *
 * A method rather than an expression in the template: a Vue template can only
 * reach the component's own scope and a short allowlist of globals, and
 * `localStorage` is not on it. Written inline the button did nothing at all,
 * and said so only in the console.
 */
function clearEverything() {
  localStorage.clear()
  location.reload()
}

function apply() {
  // 'auto' hands the decision back to VitePress, which follows the operating
  // system. Only an explicit choice overrides it.
  if (codeTheme.value === 'auto') return
  isDark.value = codeTheme.value === 'dark'
}
</script>

<template>
  <div class="fenix-panel">
    <h3>Appearance</h3>
    <label class="fenix-field" style="max-width: 16rem">
      <span>Theme</span>
      <select v-model="codeTheme">
        <option value="auto">Follow the system</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    <p class="fenix-note">
      The toggle in the header does the same thing for this visit. This one is
      remembered.
    </p>
  </div>

  <div class="fenix-panel">
    <h3>Documentation version</h3>
    <label class="fenix-field" style="max-width: 16rem">
      <span>Open the docs at</span>
      <select v-model="preferredVersion">
        <option v-for="v in versions" :key="v.id" :value="v.id">
          Minecraft {{ v.id }}{{ v.current ? ' (current)' : '' }}
        </option>
      </select>
    </label>
    <p class="fenix-note">
      Fenix documents each Minecraft version separately, because the API
      changes with the game and a page that hedged between two versions would
      be wrong for both. Today there is one.
    </p>
    <p style="margin-top: 0.75rem">
      <a class="fenix-button" :href="`/fenix-site/docs/${preferredVersion}/`">
        Open {{ preferredVersion }}
      </a>
    </p>
  </div>

  <div class="fenix-panel">
    <h3>Stored on this machine</h3>
    <p class="fenix-note">
      This site keeps three things in your browser and sends none of them
      anywhere: the two choices above, and — if you signed in — a GitHub token.
      There are no analytics, no cookies and no account on any server, because
      there is no server.
    </p>
    <p style="margin-top: 0.75rem">
      <button class="fenix-button secondary" @click="clearEverything">
        Clear everything
      </button>
    </p>
  </div>
</template>
