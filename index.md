---
layout: page
title: Fenix
---

<div class="fenix-home">

<div class="fenix-masthead">
  <!-- No base prefix here: a root-absolute path is how VitePress is told this
       lives in public/, and it adds the base itself at build time. Written
       with the base, Rollup treats it as an import and fails to resolve it. -->
  <img src="/favicon.svg" alt="" />
  <h1>Fenix</h1>
</div>

<p class="fenix-lede">A Minecraft mod loader for 26.2, on Java 25.</p>

<p class="fenix-meta">
  <span>Minecraft 26.2</span>
  <span>Java 25</span>
  <span>No mappings</span>
  <span>MIT</span>
</p>

<p class="fenix-actions">
  <a href="/fenix-site/docs/26.2/">Read the documentation</a>
  <a class="secondary" href="https://github.com/D4EMONDEV/Fenix">Source on GitHub</a>
</p>

Minecraft has shipped unobfuscated since 26.1. There are no mappings to
install, no names to remap, and nothing between your code and the game's own.
Fenix is built for that game rather than ported to it.

## The centre is the Registrar

Every loader has a class it is known by. Forge and NeoForge have
`DeferredRegister`. Fabric has no equivalent — you call `Registry.register`
yourself, at a moment you are responsible for choosing.

Fenix's is `Registrar`. One per mod, and everything a mod adds to the game goes
through it:

```java
public static final Registrar REGISTRAR = Registrar.of("mymod");

public static final Holder<Block> RUBY_BLOCK = REGISTRAR.newBlock("ruby_block")
        .strength(3f)
        .requiresTool()
        .withItem()
        .register();
```

That declaration creates the block, creates its item, and registers both at the
moment the game opens its registries — not before, which is why reading it too
early throws instead of handing you a `null`.

## What makes it more than a DeferredRegister

The `Holder` it gives back is the only handle you ever need. It is not just how
you reach the block later; it is the currency every other part of the API takes.

<figure class="fenix-figure">
<svg viewBox="0 0 880 250" xmlns="http://www.w3.org/2000/svg" role="img"
     aria-label="One Holder, handed to the model, loot, tag and creative tab APIs">
  <g fill="none" stroke="currentColor" stroke-width="1.25">
    <rect x="1" y="88" width="206" height="66" rx="6" class="accent" stroke-width="1.75"/>
    <path d="M207 121 C 290 121, 290 30, 372 30"/>
    <path d="M207 121 C 290 121, 290 88, 372 88"/>
    <path d="M207 121 C 290 121, 290 154, 372 154"/>
    <path d="M207 121 C 290 121, 290 212, 372 212"/>
    <rect x="372" y="8" width="286" height="44" rx="6"/>
    <rect x="372" y="66" width="286" height="44" rx="6"/>
    <rect x="372" y="132" width="286" height="44" rx="6"/>
    <rect x="372" y="190" width="286" height="44" rx="6"/>
  </g>
  <g fill="currentColor" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12.5">
    <text x="18" y="114" class="accent" font-size="14">Holder&lt;Block&gt;</text>
    <text x="388" y="35">cubeAll(RUBY_BLOCK)</text>
    <text x="388" y="93">dropsSelf(RUBY_BLOCK)</text>
    <text x="388" y="159">tag(MINEABLE_WITH_PICKAXE)</text>
    <text x="388" y="217">CreativeTabs.addTo(TAB, …)</text>
  </g>
  <g fill="currentColor" font-size="11.5" opacity="0.7">
    <text x="18" y="136">what register() returns</text>
    <text x="676" y="35">its model</text>
    <text x="676" y="93">its loot table</text>
    <text x="676" y="159">its tags</text>
    <text x="676" y="217">where a player finds it</text>
  </g>
</svg>
<figcaption>
  One declaration, one handle, and four subsystems that all take it as it is.
</figcaption>
</figure>

Elsewhere those four do not know about each other. A `DeferredRegister`
registers; data generation is a separate world with its own providers, its own
lookup by id, and its own way of being wrong. Between them sits the gap where a
block exists but has no model, or has a model naming a texture nobody drew —
and nothing says so until you open the game and see magenta.

| | Registration | Assets and data |
|---|---|---|
| **Forge / NeoForge** | `DeferredRegister` | a separate datagen system, addressed by id |
| **Fabric** | you call the registry yourself | a separate datagen system, addressed by id |
| **Fenix** | `Registrar` | the same `Holder`, handed to Ember |

## Ember

Ember is the other half of that idea: the generator that writes a mod's assets
and data from those same handles.

```java
@Generator
public final class ModModels extends EmberModelProvider {
    @Override
    protected void models() {
        cubeAll(ModBlocks.RUBY_BLOCK);
        slab(ModBlocks.RUBY_SLAB, ModBlocks.RUBY_BLOCK);
        door(ModBlocks.RUBY_DOOR);
    }
}
```

Thirteen shapes, each writing what vanilla writes for its own equivalent —
right down to the rotations of a stairs blockstate and the sixteen variants of
a gate. It also writes loot tables for blocks, mobs and chests, recipes,
advancements, damage types, enchantments, villager trades, tags for seven
registries, and language files.

Every one of those is parsed with the game's own codec on each build. A
datapack file that is wrong loads without complaint and the thing it describes
never happens, so the codec is the only thing that ever says so.

<p class="fenix-actions" style="margin-top: 1.25rem">
  <a class="secondary" href="/fenix-site/ember">What Ember writes, and why it is committed</a>
</p>

## Starting

```groovy
// settings.gradle
pluginManagement {
    repositories {
        maven { url = 'https://d4emondev.github.io/Fenix/' }
        gradlePluginPortal()
    }
}

// build.gradle
plugins {
    id 'fr.d4emon.fenix.dev' version '0.3.0'
}

fenix {
    minecraft = '26.2'
}
```

The plugin brings `fr.d4emon.fenix:fenix-api:0.8.0+mc26.2` with it, so there is no
`dependencies` block to write.

`./gradlew runClient` downloads the game and launches it with your mod.

## Honest about what it is

Fenix is young. It runs one Minecraft version, it has one release line, and the
API is still moving. What it does have is a habit: every claim the loader makes
is covered by a check that fails when the claim stops being true, and each of
those checks was verified by breaking the thing it covers and watching it fail.

That is not a feature you can see. It is the reason these pages describe what
the code does rather than what it was meant to do.

<div class="fenix-doors">
  <a href="/fenix-site/docs/26.2/">
    <strong>Documentation</strong>
    <span>Written by hand, one set per Minecraft version. Start with your first mod.</span>
  </a>
  <a href="/fenix-site/ember">
    <strong>Ember</strong>
    <span>The generator, and what it writes for you.</span>
  </a>
  <a href="https://github.com/D4EMONDEV/Fenix">
    <strong>Source</strong>
    <span>The loader, the API, the Gradle plugin and the example mod.</span>
  </a>
</div>

</div>
