---
title: Accessible members
---

# Accessible members

Some of what a mod needs from Minecraft is private, package-private or final.
`StairBlock`'s constructor is protected. `BlockSetType.register` is private.
Neither is a decision aimed at mods; they are simply not public.

Fenix widens them from the manifest:

```json
{
  "accessible": [
    "method net.minecraft.world.level.block.StairBlock <init>",
    "method net.minecraft.world.level.block.ButtonBlock <init>",
    "method net.minecraft.world.level.block.state.properties.BlockSetType register",
    "field net.minecraft.world.entity.Entity level",
    "class net.minecraft.world.inventory.MenuType$MenuSupplier"
  ]
}
```

## The format

```
<kind> <fully qualified class> <member>
```

| Kind | Member |
|------|--------|
| `class` | omitted — widens the type itself |
| `method` | the method name, or `<init>` for a constructor |
| `field` | the field name |

## Both sides, or neither

An entry is applied twice: the loader widens the class at run time, and the
Gradle plugin widens the copy your code compiles against. That is what makes
javac and the game agree.

The practical consequence is that removing an entry breaks the build, not the
launch:

```
error: register(BlockSetType) has private access in BlockSetType
```

which is the failure you want — at the moment you can still do something about
it.

## Prefer not to

Widening is a claim that no reasonable API exists for what you need. Often one
does: `BlockInteractions` opens the flammability and stripping tables,
`Brewing` opens the brewing builder, `BiomeModifications` opens spawn tables.
Reach for those first, and widen when the answer is genuinely "vanilla keeps
this to itself".
