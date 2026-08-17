<script setup lang="ts">
/**
 * A mod template generator that runs entirely in the reader's browser.
 *
 * The versions it writes are fetched from platforms.json in the loader's
 * repository — the same file `check-coordinates` reads and the Gradle plugin
 * ships. Nothing here is typed by hand, on purpose: this site once shipped a
 * "Your first mod" page whose build file could not build, and the version
 * check passed the whole time because it was reading a version out of a line
 * that never worked. A generator with its own copy of the numbers is that
 * mistake with a download button on it.
 *
 * If the fetch fails, generation is refused rather than falling back to
 * remembered numbers.
 */
import { computed, onMounted, ref } from 'vue'

const PLATFORMS =
  'https://raw.githubusercontent.com/D4EMONDEV/Fenix/main/platforms.json'

interface Platform {
  minecraft: string
  java: number
  api: string
  loader: string
  ember: string
  status: string
}

const platforms = ref<Platform[]>([])
const plugin = ref('')
const loadError = ref('')

onMounted(async () => {
  try {
    // With a timeout, because a fetch that never settles leaves this page on
    // "Reading the version table…" for ever, which says nothing about why.
    const response = await fetch(PLATFORMS, {
      cache: 'no-cache',
      signal: AbortSignal.timeout(8000)
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const table = await response.json()
    platforms.value = table.platforms
    plugin.value = table.plugin
    minecraft.value = table.platforms[0].minecraft
  } catch (error) {
    loadError.value = String(error)
  }
})

// ------------------------------------------------------------------ the form
const modName = ref('My Mod')
const idFromName = ref(true)
const manualId = ref('')
const packageName = ref('com.example.mymod')
const modVersion = ref('1.0.0')
const authors = ref('')
const license = ref('MIT')
const minecraft = ref('')
const exampleContent = ref(true)
const withEmber = ref(true)
const splitClient = ref(false)
const kotlinScript = ref(true)

/**
 * A mod id is lowercase with hyphens — not underscores.
 *
 * The annotation processor is the authority here and it rejects the rest:
 * "'my_mod' is not a valid mod id (expected 2 to 64 characters: lowercase
 * letters, digits and hyphens, starting with a letter)". Worth having found by
 * building what this page writes rather than by a reader hitting it.
 */
const derivedId = computed(() =>
  modName.value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'mymod'
)
const modId = computed(() => (idFromName.value ? derivedId.value : manualId.value.trim()))

/** The entry point's class name, from the mod's name. */
const className = computed(() => {
  const words = modName.value.replace(/[^A-Za-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean)
  const name = words.map(w => w[0].toUpperCase() + w.slice(1)).join('')
  return /^[A-Za-z]/.test(name) ? name : 'MyMod'
})

const platform = computed(() =>
  platforms.value.find(p => p.minecraft === minecraft.value) ?? platforms.value[0])

const problems = computed(() => {
  const found: string[] = []
  if (!/^[a-z][a-z0-9-]{1,63}$/.test(modId.value)) {
    found.push('The mod id must be 2 to 64 characters, start with a letter, and hold ' +
      'only lowercase letters, digits and hyphens. Underscores are not allowed — the ' +
      'annotation processor rejects them while the mod compiles.')
  }
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName.value)) {
    found.push('The package name must be lowercase words separated by dots, with at ' +
      'least two parts, like com.example.mymod.')
  }
  if (!/^\d+\.\d+\.\d+/.test(modVersion.value)) {
    found.push('The version should be semantic — 1.0.0 — because the loader compares ' +
      'versions when another mod depends on yours.')
  }
  return found
})

const authorList = computed(() =>
  authors.value.split(',').map(a => a.trim()).filter(Boolean))

// ------------------------------------------------------------------- licences
/** Only the ones short enough to write in full and still be the real text. */
const FULL_TEXT: Record<string, (holder: string, year: string) => string> = {
  MIT: (holder, year) => `MIT License

Copyright (c) ${year} ${holder}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
  Unlicense: () => `This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or distribute this
software, either in source code form or as a compiled binary, for any purpose,
commercial or non-commercial, and by any means.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED. For more information, please refer to <https://unlicense.org/>
`,
  'All rights reserved': (holder, year) =>
    `Copyright (c) ${year} ${holder}\n\nAll rights reserved.\n`
}

const LINKS: Record<string, string> = {
  'Apache-2.0': 'https://www.apache.org/licenses/LICENSE-2.0.txt',
  'GPL-3.0-only': 'https://www.gnu.org/licenses/gpl-3.0.txt',
  'LGPL-3.0-only': 'https://www.gnu.org/licenses/lgpl-3.0.txt',
  'MPL-2.0': 'https://www.mozilla.org/media/MPL/2.0/index.txt'
}

const licenseNeedsFetching = computed(() => license.value in LINKS)

function licenseFile(): string {
  const holder = authorList.value.join(', ') || modName.value
  const year = String(new Date().getFullYear())
  const full = FULL_TEXT[license.value]
  if (full) return full(holder, year)
  // Writing a truncated Apache or GPL would be worse than writing none: it
  // would look like the licence and not be it.
  return `${license.value}

Copyright (c) ${year} ${holder}

This project is licensed under ${license.value}. The full text is NOT included
here — paste it in from ${LINKS[license.value]} before you publish, or the
project ships naming a licence it does not carry.
`
}

// ------------------------------------------------------------------ the icon
/**
 * The mod's icon: its name in black on white, drawn in the browser.
 *
 * <p>128 square, which is what a mod list has room for. Drawn rather than
 * shipped so it carries the name you typed — a placeholder that says which mod
 * it belongs to is worth more than a generic mark, and it is meant to be
 * replaced.
 */
function drawIcon(): Uint8Array {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')!

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, size)

  // Wrapped by words, because a mod name is usually two or three of them and
  // one long line scaled to fit would be unreadable at this size.
  const words = modName.value.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    context.font = 'bold 20px sans-serif'
    if (context.measureText(next).width > size - 16 && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)

  // Shrink until the longest line fits, rather than clipping it.
  let fontSize = 22
  do {
    context.font = `bold ${fontSize}px sans-serif`
    fontSize -= 1
  } while (
    fontSize > 8 &&
    lines.some(text => context.measureText(text).width > size - 16)
  )

  context.fillStyle = '#000000'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const step = fontSize + 4
  const top = size / 2 - ((lines.length - 1) * step) / 2
  lines.forEach((text, i) => context.fillText(text, size / 2, top + i * step))

  const url = canvas.toDataURL('image/png')
  const binary = atob(url.slice(url.indexOf(',') + 1))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// ---------------------------------------------------------------- the files
function buildScript(): string {
  const p = platform.value
  if (kotlinScript.value) {
    return `plugins {
    id("java")
    id("fr.d4emon.fenix.dev") version "${plugin.value}"
}

group = "${packageName.value.split('.').slice(0, -1).join('.') || packageName.value}"
version = "${modVersion.value}"

fenix {
    minecraft = "${p.minecraft}"
}
`
  }
  return `plugins {
    id 'java'
    id 'fr.d4emon.fenix.dev' version '${plugin.value}'
}

group = '${packageName.value.split('.').slice(0, -1).join('.') || packageName.value}'
version = '${modVersion.value}'

fenix {
    minecraft = '${p.minecraft}'
}
`
}

function settingsScript(): string {
  const repo = 'https://d4emondev.github.io/Fenix/'
  if (kotlinScript.value) {
    return `// Fenix is not on the Gradle Plugin Portal, so this is where Gradle is told
// where to find the plugin. Without it the build stops before it starts.
pluginManagement {
    repositories {
        maven("${repo}")
        gradlePluginPortal()
    }
}

rootProject.name = "${modId.value}"
`
  }
  return `// Fenix is not on the Gradle Plugin Portal, so this is where Gradle is told
// where to find the plugin. Without it the build stops before it starts.
pluginManagement {
    repositories {
        maven { url = '${repo}' }
        gradlePluginPortal()
    }
}

rootProject.name = '${modId.value}'
`
}

function manifest(): string {
  const p = platform.value
  const fields: string[] = [
    '  "schema": 1',
    `  "id": ${JSON.stringify(modId.value)}`,
    `  "version": ${JSON.stringify(modVersion.value)}`,
    `  "name": ${JSON.stringify(modName.value)}`
  ]
  if (authorList.value.length) {
    fields.push(`  "authors": ${JSON.stringify(authorList.value)}`)
  }
  fields.push(`  "license": ${JSON.stringify(license.value)}`)
  // A path inside the jar, which is where the loader resolves it from. Nothing
  // in Fenix draws it yet — this is the declaration, so whatever displays a
  // list of mods can find it without every mod inventing a convention.
  fields.push(`  "icon": "assets/${modId.value}/icon.png"`)
  // The bundle, not one of its modules. platforms.json carries the bundle's
  // version and not the per-module ones, so naming fenix-api-registry here
  // would mean inventing a number — and the one that looks obvious is the
  // bundle's, which is ahead of the module's and refuses to launch.
  fields.push(`  "depends": {
    "fenix": ">=${p.loader}",
    "fenix-api": ">=${p.api}"
  }`)
  return `{\n${fields.join(',\n')}\n}\n`
}

function entryPoint(): string {
  return `package ${packageName.value};

import fr.d4emon.fenix.api.Fenix;
import fr.d4emon.fenix.api.FenixMod;
import fr.d4emon.fenix.api.Mod;

/**
 * ${modName.value}.
 *
 * <p>Nothing points at this class by name. The annotation is the declaration,
 * and the annotation processor records it while the mod compiles — so renaming
 * it fails the build rather than the launch.
 */
@Mod(${className.value}.MODID)
public final class ${className.value} implements FenixMod {

    /**
     * The mod's id, written once.
     *
     * <p>It is the namespace every block, item, tag and file of yours lives
     * under, so it is repeated a great many times — and a typo in one of them
     * is content registered under a namespace nothing else uses, which loads
     * without complaint.
     *
     * <p>{@code static final}, not just {@code static}: an annotation's value
     * has to be a compile-time constant, and {@code @Mod(MODID)} does not
     * compile without the {@code final}.
     */
    public static final String MODID = "${modId.value}";

    public ${className.value}() {
    }

    @Override
    public void onRegister(Fenix fenix) {
${exampleContent.value
        ? `        // Binds everything ModContent declared. Until this runs, its holders
        // are unbound and calling get() on one throws.
        ModContent.REGISTRAR.apply();`
        : `        // Declare content in a class of its own, then bind it here:
        //
        //     public static final Registrar REGISTRAR = Registrar.of(${className.value}.MODID);
        //     public static final Holder<Block> MY_BLOCK = REGISTRAR.newBlock("my_block")
        //             .strength(3f, 6f).withItem().register();
        //
        //     REGISTRAR.apply();
        //
        // Nothing a registrar declared exists until apply() has run.`}
    }

    @Override
    public void onInit(Fenix fenix) {
        fenix.logger().info("${modId.value} is up");
    }
}
`
}

function content(): string {
  return `package ${packageName.value};

import fr.d4emon.fenix.registry.CreativeTabs;
import fr.d4emon.fenix.registry.Holder;
import fr.d4emon.fenix.registry.Registrar;
import net.minecraft.world.level.block.Block;

/**
 * Everything ${modName.value} adds to the game.
 *
 * <p>Declared here and bound in {@code onRegister}. A holder is a promise: the
 * block does not exist yet when this class is initialised, which is what lets
 * a mod declare its content as static fields at all.
 */
public final class ModContent {

    public static final Registrar REGISTRAR = Registrar.of(${className.value}.MODID);

    public static final Holder<Block> EXAMPLE_BLOCK = REGISTRAR.newBlock("example_block")
            .strength(3f, 6f)
            .requiresTool()
            .withItem()
            .register();

    static {
        // Without this the block exists and is in no creative tab, which is
        // the most common way a first mod looks like it did nothing.
        CreativeTabs.addTo(CreativeTabs.BUILDING_BLOCKS, EXAMPLE_BLOCK);
    }

    private ModContent() {
    }
}
`
}

function emberGenerator(): string {
  return `package ${packageName.value}.data;

import fr.d4emon.fenix.ember.EmberLanguageProvider;
import fr.d4emon.fenix.ember.Generator;${exampleContent.value ? `
import ${packageName.value}.ModContent;` : ''}

/**
 * The English names for what this mod adds.
 *
 * <p>Run {@code ./gradlew ember} to write it. The output lands in
 * {@code src/main/generated} and is meant to be committed: it is what the game
 * actually reads, so it should be reviewable in a diff like anything else.
 *
 * <p>A block with no name here is not an error. It renders with its
 * translation key showing, which reads as a missing font before it reads as a
 * missing translation.
 */
@Generator
public final class ModLanguage extends EmberLanguageProvider {

    /** Instantiated by Ember from the compile-time index. */
    public ModLanguage() {
        super("en_us");
    }

    @Override
    protected void translations() {
${exampleContent.value
        ? '        add(ModContent.EXAMPLE_BLOCK, "Example Block");'
        : `        // add(ModContent.MY_BLOCK, "My Block");`}
    }
}
`
}

function clientEntry(): string {
  return `package ${packageName.value}.client;

import fr.d4emon.fenix.api.Fenix;
import fr.d4emon.fenix.api.FenixMod;
import fr.d4emon.fenix.api.Mod;
import ${packageName.value}.${className.value};

/**
 * The client half of ${modName.value}.
 *
 * <p>This source set exists because {@code src/client/java} does — the Gradle
 * plugin looks for that directory and configures the source set if it is
 * there. Code here can touch client-only classes; code in {@code src/main}
 * cannot, and a dedicated server will not load this.
 *
 * <p>The same mod id as the main entry point, deliberately. One jar carries
 * one manifest and one id; a client class declaring an id of its own makes a
 * jar whose index and manifest disagree, and the loader refuses it.
 */
@Mod(${className.value}.MODID)
public final class ${className.value}Client implements FenixMod {

    public ${className.value}Client() {
    }

    @Override
    public void onInit(Fenix fenix) {
        fenix.logger().info("${modId.value}-client is up");
    }
}
`
}

function readme(): string {
  const p = platform.value
  const by = authorList.value.length ? `\n\nBy ${authorList.value.join(', ')}.` : ''
  return `# ${modName.value}${by}

A Minecraft ${p.minecraft} mod for [Fenix](https://d4emondev.github.io/fenix-site/),
on Java ${p.java}.

## Running it

\`\`\`
gradle wrapper
./gradlew runClient
\`\`\`

The wrapper is not in this archive — Gradle writes it, and a wrapper jar
downloaded from a web page is not something you should run without looking.

## The tasks

| Task | What it does |
|------|--------------|
| \`runClient\` | the game, with this mod installed |
| \`runServer\` | a dedicated server, same |
| \`runGameTest\` | this mod's game tests, headless, with a JUnit report |
| \`ember\` | writes the generated files under \`src/main/generated\` |

## Layout

- \`src/main/java\` — the mod
${splitClient.value ? '- `src/client/java` — the client half, which a server never loads\n' : ''}\
${withEmber.value ? '- `src/main/generated` — what Ember writes; commit it\n' : ''}\
- \`src/main/resources/fenix.mod.json\` — the manifest
${exampleContent.value
  ? '\nIt comes with one block, in the Building Blocks tab, so there is something to see the first time you run it.'
  : '\nIt comes with nothing but the entry point. Declare content in a registrar and bind it in `onRegister`.'}

Licensed under ${license.value}.
`
}

function gitignore(): string {
  return `build/
.gradle/
run/
run-server/
.idea/
*.iml
`
}

const files = computed<Record<string, string>>(() => {
  if (!platform.value) return {}
  const dir = packageName.value.replace(/\./g, '/')
  const ext = kotlinScript.value ? '.kts' : ''
  const out: Record<string, string> = {
    [`settings.gradle${ext}`]: settingsScript(),
    [`build.gradle${ext}`]: buildScript(),
    'README.md': readme(),
    'LICENSE': licenseFile(),
    '.gitignore': gitignore(),
    'src/main/resources/fenix.mod.json': manifest(),
    [`src/main/java/${dir}/${className.value}.java`]: entryPoint()
  }
  if (exampleContent.value) {
    out[`src/main/java/${dir}/ModContent.java`] = content()
  }
  if (withEmber.value) {
    out[`src/main/java/${dir}/data/ModLanguage.java`] = emberGenerator()
  }
  if (splitClient.value) {
    out[`src/client/java/${dir}/client/${className.value}Client.java`] = clientEntry()
  }
  return out
})

/**
 * The directories a mod's resources go in, created empty.
 *
 * <p>An empty directory is not nothing here: assets/<id> and data/<id> are
 * where every texture, model, loot table and tag has to live, and a reader who
 * has to guess the layout guesses wrong — usually by putting files a level too
 * high, where the game never looks for them.
 */
const directories = computed(() => [
  `src/main/resources/assets/${modId.value}/`,
  `src/main/resources/data/${modId.value}/`
])

/**
 * Files that are bytes rather than text, by path.
 *
 * <p>The path is a value; the bytes need a canvas. They are kept apart because
 * this page is also rendered at build time, where there is no document to draw
 * on — a computed that called {@code drawIcon} would be evaluated during that
 * render and fail it.
 */
const binaryPaths = computed(() => [`src/main/resources/assets/${modId.value}/icon.png`])

function binaries(): Record<string, Uint8Array> {
  return { [binaryPaths.value[0]]: drawIcon() }
}

/**
 * The files as a tree, the way the project looks on disk.
 *
 * <p>Directories first and then files, each side sorted, so the shape is the
 * one an editor's sidebar shows. A flat list of full paths reads as noise as
 * soon as there are packages, which is immediately.
 */
interface Node {
  name: string
  path?: string
  depth: number
  directory: boolean
}

const tree = computed<Node[]>(() => {
  // Directories end in a slash so they sort beside their contents and are
  // drawn as folders rather than as files with no extension.
  const paths = [
    ...Object.keys(files.value),
    ...binaryPaths.value,
    ...directories.value
  ].sort()
  const out: Node[] = []
  const seen = new Set<string>()

  for (const path of paths) {
    const parts = path.split('/')
    for (let i = 0; i < parts.length - 1; i++) {
      const prefix = parts.slice(0, i + 1).join('/')
      if (!seen.has(prefix)) {
        seen.add(prefix)
        out.push({ name: parts[i], depth: i, directory: true })
      }
    }
    const leaf = parts[parts.length - 1]
    if (leaf !== '') {
      out.push({ name: leaf, path, depth: parts.length - 1, directory: false })
    }
  }

  // Sorting the paths put every file of a directory together already; this
  // only lifts directories above the files that sit beside them.
  return out
})

const fileNames = computed(() => Object.keys(files.value).sort())
const preview = ref('')
const previewName = ref('')

function show(name: string) {
  previewName.value = name
  preview.value = files.value[name]
    ?? (binaryPaths.value.includes(name)
      ? '(a 128×128 PNG, drawn from the mod name — replace it with your own)'
      : '')
}

// -------------------------------------------------------------------- the zip
// Store-only, written by hand. A compressed archive would mean pulling a
// library onto a page whose whole point is that it has no dependencies.
const CRC = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/**
 * @param entries text files, by path
 * @param binaries files that are bytes already, by path
 * @param dirs directories to create even though they hold nothing yet
 * @param root the folder everything is unpacked into
 */
function zip(
  entries: Record<string, string>,
  binaries: Record<string, Uint8Array>,
  dirs: string[],
  root: string
): Blob {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  const u16 = (n: number) => [n & 0xff, (n >>> 8) & 0xff]
  const u32 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]

  // A directory is an entry whose name ends in a slash and whose content is
  // empty. Without one, unpacking a zip that only holds files silently drops
  // every folder that has nothing in it — which is exactly the two this
  // template wants to hand over.
  const all: Array<[string, Uint8Array]> = [
    ...dirs.map(dir => [dir.endsWith('/') ? dir : dir + '/', new Uint8Array(0)] as [string, Uint8Array]),
    ...Object.entries(entries).map(([path, text]) =>
      [path, encoder.encode(text)] as [string, Uint8Array]),
    ...Object.entries(binaries)
  ]

  for (const [path, data] of all) {
    const name = encoder.encode(`${root}/${path}`)
    const sum = crc32(data)

    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0x21), // a fixed timestamp, so the same form gives the same zip
      ...u32(sum), ...u32(data.length), ...u32(data.length),
      ...u16(name.length), ...u16(0), ...name
    ])
    chunks.push(local, data)

    central.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0x21),
      ...u32(sum), ...u32(data.length), ...u32(data.length),
      ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(0), ...u32(offset), ...name
    ]))
    offset += local.length + data.length
  }

  const directory = central.reduce((n, c) => n + c.length, 0)
  const end = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0),
    ...u16(central.length), ...u16(central.length),
    ...u32(directory), ...u32(offset), ...u16(0)
  ])
  return new Blob([...chunks, ...central, end], { type: 'application/zip' })
}

function download() {
  const blob = zip(files.value, binaries(), directories.value, modId.value)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${modId.value}.zip`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="tpl">
    <p v-if="loadError" class="tpl-error">
      The version table could not be read from the loader's repository
      ({{ loadError }}), so this page will not generate a project. Every version
      it would write comes from that file, and guessing one is how a template
      hands you a build that cannot resolve.
    </p>

    <template v-else-if="platform">
      <div class="tpl-grid">
        <label>
          <span>Mod name</span>
          <input v-model="modName" type="text" placeholder="My Mod" />
        </label>

        <label>
          <span>Mod id</span>
          <input v-model="manualId" type="text" :disabled="idFromName"
                 :placeholder="derivedId" />
          <em class="tpl-check">
            <input v-model="idFromName" type="checkbox" id="derive" />
            <label for="derive">from the mod name</label>
          </em>
        </label>

        <label>
          <span>Package</span>
          <input v-model="packageName" type="text" placeholder="com.example.mymod" />
        </label>

        <label>
          <span>Version</span>
          <input v-model="modVersion" type="text" placeholder="1.0.0" />
        </label>

        <label>
          <span>Authors</span>
          <input v-model="authors" type="text" placeholder="separated by commas" />
        </label>

        <label>
          <span>Licence</span>
          <select v-model="license">
            <option>MIT</option>
            <option>Apache-2.0</option>
            <option>GPL-3.0-only</option>
            <option>LGPL-3.0-only</option>
            <option>MPL-2.0</option>
            <option>Unlicense</option>
            <option>All rights reserved</option>
          </select>
        </label>

        <label>
          <span>Minecraft</span>
          <select v-model="minecraft">
            <option v-for="p in platforms" :key="p.minecraft" :value="p.minecraft">
              {{ p.minecraft }} — Java {{ p.java }}
            </option>
          </select>
        </label>

        <label>
          <span>Build script</span>
          <select v-model="kotlinScript">
            <option :value="true">Kotlin (.gradle.kts)</option>
            <option :value="false">Groovy (.gradle)</option>
          </select>
        </label>
      </div>

      <div class="tpl-toggles">
        <label><input v-model="exampleContent" type="checkbox" /> Example content</label>
        <label><input v-model="withEmber" type="checkbox" /> Ember generator</label>
        <label><input v-model="splitClient" type="checkbox" /> Split client and main</label>
      </div>

      <p class="tpl-note">
        <strong>Example content</strong> is a block, its creative tab entry and
        its name — enough that the first <code>runClient</code> shows something.
        Without it you get the entry point and nothing else.
      </p>

      <p class="tpl-note">
        The other two toggles do not change the build file, because neither can. The Gradle
        plugin always brings Ember and always creates the client source set when
        <code>src/client/java</code> exists — so these decide which
        <em>files</em> you start with, and nothing else. Adding either later is
        adding a directory.
      </p>

      <ul v-if="problems.length" class="tpl-error">
        <li v-for="problem in problems" :key="problem">{{ problem }}</li>
      </ul>

      <template v-else>
        <p class="tpl-summary">
          <strong>{{ modId }}</strong> for Minecraft {{ platform.minecraft }} on Java
          {{ platform.java }} — plugin {{ plugin }}, which brings
          <code>fenix-api {{ platform.api }}+mc{{ platform.minecraft }}</code>.
        </p>

        <p v-if="licenseNeedsFetching" class="tpl-warn">
          {{ license }} is too long to include in full and still be the real
          text, so <code>LICENSE</code> names it and links to the canonical copy.
          Paste that in before you publish.
        </p>

        <div class="tpl-tree">
          <p class="tpl-tree-root">{{ modId }}/</p>
          <template v-for="node in tree" :key="(node.path ?? node.name) + node.depth">
            <p v-if="node.directory" class="tpl-dir"
               :style="{ paddingLeft: (node.depth + 1) * 1.1 + 'rem' }">
              {{ node.name }}/
            </p>
            <button v-else class="tpl-file"
                    :class="{ active: node.path === previewName }"
                    :style="{ paddingLeft: (node.depth + 1) * 1.1 + 'rem' }"
                    @click="show(node.path!)">
              {{ node.name }}
            </button>
          </template>
        </div>

        <pre v-if="preview" class="tpl-preview"><code>{{ preview }}</code></pre>

        <p class="tpl-actions">
          <button class="tpl-download" @click="download">Download {{ modId }}.zip</button>
        </p>

        <p class="tpl-note">
          The Gradle wrapper is not in the archive. Run <code>gradle wrapper</code>
          once in the unpacked directory — a wrapper jar handed to you by a web
          page is not something to run unexamined.
        </p>
      </template>
    </template>

    <p v-else class="tpl-note">Reading the version table…</p>
  </div>
</template>

<style scoped>
.tpl { margin: 1.5rem 0; }
.tpl-grid {
  display: grid; gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
}
.tpl-grid label { display: flex; flex-direction: column; gap: .35rem; }
.tpl-grid label > span { font-size: .85rem; color: var(--vp-c-text-2); }
.tpl-grid input[type='text'], .tpl-grid select {
  padding: .5rem .6rem; border: 1px solid var(--vp-c-divider);
  border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-1);
  font: inherit;
}
.tpl-grid input[disabled] { opacity: .55; }
.tpl-check { display: flex; align-items: center; gap: .4rem; font-size: .8rem; font-style: normal; }
.tpl-toggles { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 1rem; }
.tpl-toggles label { display: flex; align-items: center; gap: .45rem; }
.tpl-note, .tpl-summary { font-size: .9rem; color: var(--vp-c-text-2); margin-top: 1rem; }
.tpl-warn {
  font-size: .9rem; margin-top: 1rem; padding: .75rem .9rem; border-radius: 6px;
  border: 1px solid var(--vp-c-warning-1); background: var(--vp-c-warning-soft);
}
.tpl-error {
  margin-top: 1rem; padding: .75rem .9rem; border-radius: 6px;
  border: 1px solid var(--vp-c-danger-1); background: var(--vp-c-danger-soft);
}
.tpl-tree {
  margin-top: 1.25rem; padding: .6rem 0; border-radius: 8px;
  border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono); font-size: .8rem;
  max-height: 22rem; overflow: auto;
}
.tpl-tree-root {
  margin: 0 0 .2rem; padding: .15rem .8rem; color: var(--vp-c-text-1); font-weight: 600;
}
.tpl-dir {
  margin: 0; padding-top: .15rem; padding-bottom: .15rem;
  color: var(--vp-c-text-3);
}
.tpl-file {
  display: block; width: 100%; text-align: left; border: 0; border-radius: 0;
  padding-top: .15rem; padding-bottom: .15rem;
  background: none; color: var(--vp-c-text-2); font: inherit; cursor: pointer;
}
.tpl-file:hover { background: var(--vp-c-bg-alt); color: var(--vp-c-text-1); }
.tpl-file.active {
  background: var(--vp-c-bg-alt); color: var(--vp-c-text-1);
  box-shadow: inset 2px 0 0 var(--vp-c-brand-1);
}
.tpl-preview {
  margin-top: .75rem; max-height: 26rem; overflow: auto;
  background: var(--vp-c-bg-alt); border: 1px solid var(--vp-c-divider);
  border-radius: 8px; padding: 1rem; font-size: .8rem;
}
.tpl-actions { margin-top: 1.5rem; }
.tpl-download {
  padding: .6rem 1.1rem; border-radius: 6px; border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-1); color: var(--vp-c-bg); font: inherit; cursor: pointer;
}
</style>
