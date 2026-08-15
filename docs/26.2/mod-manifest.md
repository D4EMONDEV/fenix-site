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

## What is not here

The entry point. Fenix reads it from `fenix.index.json`, which the annotation
processor writes from the `@Mod` annotation while the mod compiles.

That is a deliberate difference from `fabric.mod.json` and `mods.toml`, where
the class is named as a string. A string is checked when the game launches, by
which point a typo costs a restart; an annotation is checked by javac, which is
already reading the file.
