---
title: What Fenix is
---

# What Fenix is

Fenix is a mod loader for Minecraft 26.2, running on Java 25.

Since 26.1 the game ships unobfuscated. There are no mappings to install and no
names to remap: `net.minecraft.world.level.block.Block` is what the class is
called in the jar you downloaded. Fenix assumes that throughout — every mixin
it applies is written against real names, and `remap = false` is not an option
you set, it is the only thing that would make sense.

## What a mod is made of

| Piece | What it does |
|-------|--------------|
| `fenix.mod.json` | id, version, dependencies, and any members to widen |
| A class with `@Mod` | the entry point; the annotation processor indexes it at compile time |
| `Registrar` | declares content, and hands back the handles you keep |
| Generators | write the mod's assets and data at build time |
| Mixins, if needed | change the game where no event reaches |

## The lifecycle

Three moments, in this order:

```java
@Mod("mymod")
public final class MyMod implements FenixMod {

    @Override
    public void onPreLaunch(Fenix fenix) {
        // Before the game exists. Almost nothing belongs here.
    }

    @Override
    public void onRegister(Fenix fenix) {
        // The registries are open. Content is created now, and only now.
        ModContent.REGISTRAR.apply();
    }

    @Override
    public void onInit(Fenix fenix) {
        // The game is built. Listeners, config, commands.
    }
}
```

`onRegister` is the one with a hard rule attached: reading a `Holder` before it
fires throws, with a message saying so. That is deliberate — a handle read too
early would otherwise be `null` somewhere far away from the line that caused
it.

## Where to go next

- [Your first mod](first-mod) — a build file, an entry point, and a block.
- [The registrar](registrar) — how content is declared.
- [What Ember writes](ember) — the generator.
