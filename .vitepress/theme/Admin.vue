<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  identify, storedToken, listDocs, readDoc, saveDoc,
  SITE_REPO, type Identity, type DocFile
} from './github'
import { versions, currentVersion } from '../versions'

const identity = ref<Identity | null>(null)
const version = ref(currentVersion.id)
const files = ref<string[]>([])
const file = ref<DocFile | null>(null)
const message = ref('')
const busy = ref(false)
const status = ref<{ text: string; ok: boolean } | null>(null)

onMounted(async () => {
  const token = storedToken()
  if (!token) return
  try {
    identity.value = await identify(token)
    await loadList()
  } catch {
    identity.value = null
  }
})

async function loadList() {
  status.value = null
  busy.value = true
  try {
    files.value = await listDocs(storedToken(), version.value)
    file.value = null
  } catch (e) {
    status.value = { text: (e as Error).message, ok: false }
  } finally {
    busy.value = false
  }
}

async function open(path: string) {
  status.value = null
  busy.value = true
  try {
    file.value = await readDoc(storedToken(), path)
    message.value = `docs(${version.value}): edit ${path.split('/').pop()}`
  } catch (e) {
    status.value = { text: (e as Error).message, ok: false }
  } finally {
    busy.value = false
  }
}

async function save() {
  if (!file.value) return
  status.value = null
  busy.value = true
  try {
    // The new sha comes back, so the editor stays usable for a second save
    // rather than failing on a version it no longer holds.
    file.value.sha = await saveDoc(storedToken(), file.value, message.value)
    status.value = {
      text: 'Committed. GitHub Pages rebuilds the site; the page updates in a minute or two.',
      ok: true
    }
  } catch (e) {
    status.value = { text: (e as Error).message, ok: false }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div v-if="!identity" class="fenix-panel">
    <h3>Sign in first</h3>
    <p class="fenix-note">
      Editing needs a GitHub token. Add one on
      <a href="/fenix-site/account">the account page</a>, then come back.
    </p>
  </div>

  <div v-else-if="!identity.mayEdit" class="fenix-panel">
    <h3>Read-only</h3>
    <p class="fenix-note">
      Signed in as <strong>@{{ identity.login }}</strong>, but GitHub does not
      give this account push access to
      <code>{{ SITE_REPO.owner }}/{{ SITE_REPO.name }}</code>. You can read the
      pages below; a save would be refused by GitHub.
    </p>
  </div>

  <template v-else>
    <div class="fenix-panel">
      <h3>Editing as @{{ identity.login }}</h3>
      <p class="fenix-note">
        A save is a commit on <code>{{ SITE_REPO.branch }}</code>, under your own
        name, with the full history that implies. Nothing is published that is
        not in the repository.
      </p>

      <label class="fenix-field" style="max-width: 14rem">
        <span>Minecraft version</span>
        <select v-model="version" @change="loadList">
          <option v-for="v in versions" :key="v.id" :value="v.id">{{ v.id }}</option>
        </select>
      </label>

      <p v-if="files.length" class="fenix-note" style="margin-top: 0.75rem">
        <button
          v-for="path in files"
          :key="path"
          class="fenix-button secondary"
          style="margin: 0 0.4rem 0.4rem 0"
          :disabled="busy"
          @click="open(path)"
        >
          {{ path.split('/').pop() }}
        </button>
      </p>
      <p v-else-if="!busy" class="fenix-note">No pages found for {{ version }}.</p>
    </div>

    <div v-if="file" class="fenix-panel">
      <h3>{{ file.path }}</h3>

      <label class="fenix-field">
        <span>Markdown</span>
        <textarea v-model="file.text" spellcheck="false"></textarea>
      </label>

      <label class="fenix-field">
        <span>Commit message</span>
        <input v-model="message" type="text" />
      </label>

      <p>
        <button class="fenix-button" :disabled="busy || !message" @click="save">
          {{ busy ? 'Saving…' : 'Commit' }}
        </button>
      </p>
    </div>

    <p v-if="status" class="fenix-status" :class="status.ok ? 'ok' : 'bad'">
      {{ status.text }}
    </p>
  </template>
</template>
