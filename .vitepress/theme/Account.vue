<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { identify, storedToken, storeToken, forgetToken, SITE_REPO, type Identity } from './github'

const token = ref('')
const identity = ref<Identity | null>(null)
const busy = ref(false)
const error = ref('')

onMounted(async () => {
  const saved = storedToken()
  if (saved) {
    token.value = saved
    await signIn(true)
  }
})

async function signIn(quiet = false) {
  error.value = ''
  busy.value = true
  try {
    identity.value = await identify(token.value)
    storeToken(token.value)
  } catch (e) {
    identity.value = null
    // A token restored from a previous visit may simply have expired; saying
    // so on arrival, unprompted, reads as something being broken.
    if (!quiet) error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

function signOut() {
  forgetToken()
  token.value = ''
  identity.value = null
  error.value = ''
}
</script>

<template>
  <div v-if="identity" class="fenix-panel">
    <h3>Signed in</h3>
    <p class="fenix-note">
      <strong>{{ identity.name || identity.login }}</strong> (@{{ identity.login }})
    </p>
    <p class="fenix-note" style="margin-top: 0.5rem">
      <template v-if="identity.mayEdit">
        GitHub says you may push to
        <code>{{ SITE_REPO.owner }}/{{ SITE_REPO.name }}</code>, so
        <a href="/fenix-site/admin">the documentation editor</a> will let you save.
      </template>
      <template v-else>
        You are signed in, but GitHub does not give this account push access to
        <code>{{ SITE_REPO.owner }}/{{ SITE_REPO.name }}</code>. You can read
        everything; saving an edit will be refused by GitHub, not by this page.
      </template>
    </p>
    <p style="margin-top: 1rem">
      <button class="fenix-button secondary" @click="signOut">Sign out</button>
    </p>
  </div>

  <div v-else class="fenix-panel">
    <h3>Sign in with a GitHub token</h3>
    <p class="fenix-note">
      This site is static files, so there is no account of its own to create and
      no password for anybody here to lose. Editing rights are GitHub's answer
      about the documentation repository, asked each time you save.
    </p>

    <label class="fenix-field">
      <span>Personal access token</span>
      <input
        v-model="token"
        type="password"
        autocomplete="off"
        spellcheck="false"
        placeholder="github_pat_… or ghp_…"
        @keyup.enter="signIn()"
      />
    </label>

    <p style="margin-top: 0.75rem">
      <button class="fenix-button" :disabled="busy || !token" @click="signIn()">
        {{ busy ? 'Checking…' : 'Sign in' }}
      </button>
    </p>

    <p v-if="error" class="fenix-status bad">{{ error }}</p>

    <p class="fenix-note" style="margin-top: 1.25rem">
      Make one at
      <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noreferrer">
        github.com/settings/personal-access-tokens</a>.
      A fine-grained token limited to
      <code>{{ SITE_REPO.owner }}/{{ SITE_REPO.name }}</code>
      with <strong>Contents: read and write</strong> is enough — it can do
      nothing else with your account. The token is kept in this browser and sent
      only to <code>api.github.com</code>.
    </p>
  </div>
</template>
