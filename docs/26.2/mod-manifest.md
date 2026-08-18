---
title: The mod manifest
section: Getting started
order: 20
---

# The mod manifest

`fenix.mod.json` sits at the root of a mod's resources.

```json
{
  "schema": 1,
  "id": "mymod",
  "version": "1.0.0",
  "name": "My Mod",
  "authors": ["You"],
  "license": "MIT",
  "icon": "assets/mymod/icon.png",
  "depends": {
    "fenix": ">=0.1.0",
    "fenix-api-registry": ">=0.4.0"
  },
  "mixins": ["mymod.mixins.json"],
  "accessible": [
    "method net.minecraft.world.level.block.ButtonBlock <init>"
  ]
}
```

## Fields

| Field | Required | What it is |
|-------|----------|------------|
| `schema` | yes | always `1` for now |
| `id` | yes | the namespace everything the mod registers lives under |
| `version` | yes | semantic version |
| `name` | no | shown in logs and errors; defaults to the id |
| `depends` | no | ids to version ranges; a missing or too-old dependency stops the launch with a readable message |
| `mixins` | no | mixin configuration files to apply |
| `accessible` | no | members of the game to widen — see [accessible members](accessible) |
| `description` | no | a sentence about the mod |
| `authors` | no | a list of names |
| `license` | no | an SPDX identifier, such as `MIT` |
| `icon` | no | a path inside the jar, such as `assets/mymod/icon.png` |
| `contact` | no | names to URLs — homepage, issues, sources |
| `side` | no | `client`, `server` or `both`; `both` unless you say otherwise — see [client and server](./sides) |
| `breaks` | no | ids this mod cannot run alongside |
| `after` | no | ids to load before this one, without depending on them |

## The icon

A path inside the jar, resolved from its root — so `assets/mymod/icon.png` sits
with the rest of your resources rather than in a directory invented for it.

An absolute path, or one climbing out of the jar with `..`, is refused when the
manifest is read rather than resolved. This is the one field in a manifest that
names a file, and a manifest is data a mod ships.

::: warning
**Fenix does not draw it.** There is no mod list screen yet. This is the
declaration, so that whatever comes to display mods — Fenix's own screen, or a
tool outside the game — can find it without every mod inventing a convention.
Declaring one today costs nothing and is read correctly; expecting to see it
somewhere today is expecting a screen that does not exist.
:::

## What is not here

The entry point. Fenix reads it from `fenix.index.json`, which the annotation
processor writes from the `@Mod` annotation while the mod compiles.

That is a deliberate difference from `fabric.mod.json` and `mods.toml`, where
the class is named as a string. A string is checked when the game launches, by
which point a typo costs a restart; an annotation is checked by javac, which is
already reading the file.
