---
title: Ember
---

# Ember

Ember writes a mod's assets and data from the same handles the mod registers
its content with. It is a program that runs at build time, inside a real
Minecraft, and leaves JSON files behind.

## The problem it solves

A block in Minecraft is not one thing. It is a registration, a blockstate file,
one or more model files, a texture, a loot table, an entry in a `mineable` tag,
a line in a language file, and a recipe. Miss any of them and the block still
registers — the game does not mind. What you get instead is a symptom that
names nothing:

| What you see | What is actually missing |
|--------------|--------------------------|
| Magenta and black checker | a texture, a model, or the item definition that picks a model |
| The block drops nothing | a loot table, or a `mineable` tag on a block that requires a tool |
| `block.mymod.thing` shown as the name | a line in the language file |
| The block is nowhere in creative | it was never added to a tab |

None of these logs anything. All of them look identical to a block that was
never added.

## What it looks like

A generator is a class with an annotation. The annotation processor indexes it
at compile time, so a misspelled class name fails the build rather than being
quietly skipped.

```java
@Generator
public final class ModModels extends EmberModelProvider {

    @Override
    protected void models() {
        cubeAll(ModBlocks.RUBY_BLOCK);
        cubeColumn(ModBlocks.RUBY_LOG);

        // Cut shapes borrow the texture of the block they came from.
        slab(ModBlocks.RUBY_SLAB, ModBlocks.RUBY_BLOCK);
        stairs(ModBlocks.RUBY_STAIRS, ModBlocks.RUBY_BLOCK);
        fence(ModBlocks.RUBY_FENCE, ModBlocks.RUBY_BLOCK);
        door(ModBlocks.RUBY_DOOR);

        flatItem(ModItems.RUBY);
        handheldItem(ModItems.RUBY_HAMMER);
    }
}
```

Thirteen shapes are covered, and each writes exactly what vanilla writes for
its own equivalent — the rotations of a stairs blockstate, the four sides of a
fence's multipart, the sixteen variants of a gate. Nine of them are compared
against vanilla's own files by a check that runs on every build.

## The providers

Eighteen, and each one writes the files for one part of the game.

| Provider | Writes |
|----------|--------|
| `EmberModelProvider` | blockstates, block models, item models and definitions |
| `EmberLootTableProvider` | what a block drops, including the two cases that are not `dropsSelf`: a slab pays twice, a door pays once |
| `EmberRecipeProvider` | shaped, shapeless, stonecutting, smelting and blasting |
| `EmberTagsProvider` | tags for blocks, items, entities, fluids, damage types, enchantments and game events — seven nested providers, one per registry |
| `EmberLanguageProvider` | one class per language |
| `EmberSoundProvider` | `sounds.json` |
| `EmberAdvancementProvider` | advancements, read back with the game's codec as they are written |
| `EmberEnchantmentProvider` | enchantments, including effects your mod invented |
| `EmberDamageTypeProvider` | damage types, since hurting a player means declaring the kind of hurt |
| `EmberEquipmentProvider` | equipment assets: what armour looks like on the wearer |
| `EmberCosmeticsProvider` | jukebox songs, paintings, instruments, banner patterns, armour trims, animal variants |
| `EmberTradeProvider` | villager trades, and the sets they are drawn from |
| `EmberOreProvider` | configured and placed features — for an ore, or for a feature you wrote |
| `EmberBiomeProvider` | biomes |
| `EmberDimensionProvider` | dimension types, the dimensions using them, and their noise settings |
| `EmberStructureProvider` | structures, template pools, structure sets, processor lists |
| `EmberTestProvider` | test instances: the files that make your game tests run |
| `EmberDialogProvider` | dialogs the server opens on a client, with no client code at all |

The [documentation](./docs/26.2/ember) covers each of them.

## Why the output is committed

`src/main/generated` is written by `./gradlew :example-mod:ember` and checked
into git. That is deliberate.

A generator is code, and code changes. If its output only existed inside a
build directory, a change in what Ember writes would reach the game without
anybody having read it. Committed, it is a diff: a reviewer sees that a
blockstate gained a rotation or a loot table lost a condition, in the same pull
request as the change that caused it.

It also lets the conformance checks read the files that ship rather than
running the generators again — which is how a slab that quietly paid out once
instead of twice was caught by comparing it to `oak_slab`.

## Naming things by constant

Tags can be named with the game's own constants, and should be wherever one
exists:

```java
tag(BlockTags.MINEABLE_WITH_PICKAXE).add(ModBlocks.RUBY_BLOCK);
tag("mymod:gems").add(ModItems.RUBY);   // no constant exists for your own
```

The difference is not tidiness. A misspelled string writes a perfectly valid
file into a tag nothing reads — no error, no warning, the game carries on. A
misspelled constant does not compile.
