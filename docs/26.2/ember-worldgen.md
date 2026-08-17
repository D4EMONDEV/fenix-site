---
title: Biomes, dimensions, structures and variants
section: Ember
order: 35
---

# Biomes, dimensions and structures

Worldgen is the part of a datapack that fails most quietly. A biome that no
file places, a structure that no set places, a template pool whose `.nbt` was
never shipped — all three load without complaint, and all three come out as a
world where nothing is there. There is no crash and no log line to search for.

Everything below is checked: Fenix parses each generated file with the game's
own codec, and follows the references between them.

## Biomes

```java
@Generator
public final class ModBiomes extends EmberBiomeProvider {

    @Override
    protected void biomes() {
        biome("ruby_caverns")
                .temperature(0.7f)
                .downfall(0.3f)
                .precipitation(false)
                .skyColor("#3a2129")
                .fogColor("#2b171d")
                .waterColor("#8a2846")
                .waterFogColor("#5c1a2e")
                .carver("minecraft:cave")
                .feature(Step.UNDERGROUND_ORES, "example-mod:ruby_ore")
                .spawn("creature", "example-mod:ruby_sprite", 20, 2, 4)
                .save();
    }
}
```

`feature` takes a **step**, not a number. A biome's features are eleven lists
in a fixed order, and the game decides what happens when by which list a
feature is in — ores in `UNDERGROUND_ORES`, trees in `VEGETAL_DECORATION`, and
so on. Naming the step means an ore cannot end up generating among the lakes
because a list was counted wrong.

::: tip
Writing a biome file is not the same as the world using it. A biome reaches
the overworld through the biome source, which vanilla builds from its own
parameter list. `/locate biome` is the quickest proof the file itself loaded.
:::

## Dimensions

Two files: the **type**, which is the physics, and the **dimension**, which is
what generates in it.

```java
@Generator
public final class ModDimensions extends EmberDimensionProvider {

    @Override
    protected void dimensions() {
        dimensionType("ruby_realm")
                .height(256)
                .minY(0)
                .skylight(false)
                .ceiling(true)
                .ambientLight(0.1f)
                .infiniburn("#minecraft:infiniburn_overworld")
                .save();

        dimension("ruby_realm", "example-mod:ruby_realm")
                .fixedBiome("example-mod:ruby_caverns")
                .noiseSettings("minecraft:caves")
                .save();
    }
}
```

`height` and `minY` are not free numbers: the height must be a multiple of 16
and `minY + height` must not exceed 2032. Ember checks both, because the game's
own message for getting it wrong arrives while a world is being created.

### Its own ground

`noiseSettings` borrowed from vanilla above — `minecraft:caves` is a real
answer and the right one until the dimension wants its own rock.

```java
noiseSettings("ruby_realm")
        .defaultBlock("example-mod:ruby_block")
        .shape(0, 256)
        .ground(96)
        .seaLevel(48)
        .oreVeins(false)
        .save();
```

`ground(y)` is where rock gives way to air. `shape` must agree with the
dimension type using it — where the two disagree the world generates to one
and is bounded by the other, which shows up as a floor you fall through or a
ceiling of void.

A noise router is **fifteen density functions and every one is required**. The
fourteen that describe the overworld's climate mean nothing to a dimension with
one biome, so Fenix writes them as constant zero and shapes only the one that
decides where the ground is. That is a real world, not a rich one — pass
`router(json)` for a rich one.

::: warning
A router missing a field produces a dimension that fails to load with a message
naming the field — but only when somebody travels there, which can be weeks
after the file was written. Fenix parses it with the game's codec at build
time; dropping one field gives `No key preliminary_surface_level`.
:::

Then `/execute in example-mod:ruby_realm run tp @s ~ ~ ~`.

## Structures

Three files, and a fourth that Ember does not write.

```java
@Generator
public final class ModStructures extends EmberStructureProvider {

    @Override
    protected void structures() {
        templatePool("shrine")
                .piece("example-mod:ruby_shrine", 1)
                .save();

        structure("ruby_shrine")
                .startPool("example-mod:shrine")
                .biomes("#minecraft:is_overworld")
                .size(1)
                .terrainAdaptation("beard_thin")
                .save();

        structureSet("ruby_shrines")
                .structure("example-mod:ruby_shrine")
                .spacing(24, 8)
                .salt(48213977)
                .save();
    }
}
```

The fourth is the `.nbt` template the pool points at, under
`data/<mod>/structure/`. Nothing generates one from Java — a template is made
in game with a structure block and saved. Ship it under `resources`.

::: warning
The **salt** has to be a number no other structure set uses. Two sets sharing
a salt do not collide once; they collide in every chunk, forever, and one of
the two effectively never generates.
:::

A structure with no set is the trap worth knowing: `/place` still works, so it
looks finished, and the world never generates it. Fenix's conformance check
fails on exactly that.

### Processor lists

A template is stamped into the world exactly as it was saved — every block
present, every block new. That is right for something just built and wrong for
anything the world is meant to have had for a while.

```java
processorList("weathered")
        .rot(0.9f)                     // one block in ten missing
        .mossy(0.2f)
        .replace("minecraft:stone_bricks", "minecraft:cracked_stone_bricks", 0.3f)
        .save();

templatePool("shrine")
        .piece("example-mod:ruby_shrine", 1, "example-mod:weathered")
        .save();
```

| Method | What it does |
|--------|--------------|
| `rot(integrity)` | leaves out a fraction of the blocks, at random |
| `mossy(mossiness)` | ages stone the way vanilla ages a ruin |
| `replace(block, with)` | swaps one block for another, every time |
| `replace(block, with, probability)` | swaps it some of the time |
| `dropScaffolding()` | drops structure voids so they do not reach the world |
| `processor(json)` | anything else, written out |

Order matters. Each processor sees what the one before it left, so rotting
away a tenth of the blocks and *then* cracking the stone bricks touches a
tenth fewer of them than the other way round.

Rules added in a row go into one `rule` processor, on purpose: a block a rule
has already changed is not offered to the rules after it, which is what stops
stone becoming cracked stone and then cracked stone becoming something else in
the same pass.

::: warning
Naming a processor list that was never written is not an error the game
reports. The structure generates unprocessed — which looks exactly like a
processor list that was written and does nothing. Fenix follows the reference
from every pool piece and fails the build if the file is not there.
:::

## Animal variants

Cows, pigs and chickens carry their looks as data now, so a mod can add one
that looks different without touching the entity.

```java
variant("cow", "ruby_cow")
        .model("normal")
        .texture("example-mod:entity/cow/ruby")
        .inBiome("example-mod:ruby_caverns", 1)
        .save();
```

`model` picks one of the animal's shapes — a cow is `normal`, `cold` or `warm`,
and those are three different models, not three textures. A texture drawn for
one is unwrapped wrongly on the others.

`inBiome` takes a biome id or a `#tag`, and a priority: where two variants both
apply, the higher number wins.

::: warning
A variant with no spawn conditions is legal. It loads, it is never chosen, and
it is only ever seen by something that asks for it by name.

And a caveat Fenix is honest about: the conformance check parses these files
with the game's codec, which catches an unknown model type or a malformed
condition — but **not** a biome tag that does not exist. Tags are resolved long
after parsing, so a misspelled one produces a variant nothing ever spawns and
no check here will say so.
:::
