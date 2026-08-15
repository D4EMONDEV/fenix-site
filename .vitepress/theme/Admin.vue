<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  identify, storedToken, listDocs, readDoc, saveDoc, createDoc, frontMatter,
  SITE_REPO, type Identity, type DocFile
} from './github'
import { versions, currentVersion, sections } from '../versions'

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

const creating = ref(false)
const draft = ref({ slug: '', title: '', section: sections[0], order: 500 })

/** Lowercase, digits and hyphens: what the URL will be, so say so up front. */
const slugLooksRight = computed(() =>
  /^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.value.slug))

async function create() {
  status.value = null
  busy.value = true
  try {
    const path = `docs/${version.value}/${draft.value.slug}.md`
    const text =
      frontMatter(draft.value.title, draft.value.section, Number(draft.value.order)) +
      `\n# ${draft.value.title}\n\nWrite the page here.\n`

    const sha = await createDoc(storedToken(), path, text,
      `docs(${version.value}): add ${draft.value.slug}.md`)

    // Straight into the editor, so writing the page is the same visit as
    // creating it.
    file.value = { path, sha, text }
    message.value = `docs(${version.value}): edit ${draft.value.slug}.md`
    creating.value = false
    draft.value = { slug: '', title: '', section: sections[0], order: 500 }
    await loadList()
    status.value = {
      text: 'Created. It joins the sidebar on the next build, from its own front matter.',
      ok: true
    }
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

      <p style="margin-top: 0.5rem">
        <button class="fenix-button secondary" @click="creating = !creating">
          {{ creating ? 'Cancel' : 'New page' }}
        </button>
      </p>
    </div>

    <div v-if="creating" class="fenix-panel">
      <h3>New page in {{ version }}</h3>
      <p class="fenix-note">
        The sidebar is built from the pages themselves, so these three fields
        are what decide where it appears. There is no list to add it to.
      </p>

      <label class="fenix-field" style="max-width: 22rem">
        <span>File name — this becomes the address</span>
        <input v-model="draft.slug" type="text" spellcheck="false" placeholder="block-entities" />
      </label>
      <p v-if="draft.slug && !slugLooksRight" class="fenix-note" style="color: var(--vp-c-danger-1)">
        Lowercase letters, digits and single hyphens only.
      </p>
      <p v-else-if="draft.slug" class="fenix-note">
        /docs/{{ version }}/{{ draft.slug }}
      </p>

      <label class="fenix-field" style="max-width: 22rem">
        <span>Title — the heading, and the sidebar entry</span>
        <input v-model="draft.title" type="text" />
      </label>

      <label class="fenix-field" style="max-width: 22rem">
        <span>Section</span>
        <input v-model="draft.section" list="fenix-sections" type="text" />
        <datalist id="fenix-sections">
          <option v-for="name in sections" :key="name" :value="name" />
        </datalist>
      </label>
      <p class="fenix-note">
        A section that is not one of the usual ones still works — the page gets
        a heading of its own, at the end.
      </p>

      <label class="fenix-field" style="max-width: 10rem">
        <span>Order in the section</span>
        <input v-model="draft.order" type="number" step="10" />
      </label>
      <p class="fenix-note">Lower comes first. Leave gaps of ten.</p>

      <p style="margin-top: 1rem">
        <button
          class="fenix-button"
          :disabled="busy || !slugLooksRight || !draft.title || !draft.section"
          @click="create"
        >
          {{ busy ? 'Creating…' : 'Create' }}
        </button>
      </p>
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
