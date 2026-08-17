---
title: What Ember writes
section: Ember
order: 0
---

# What Ember writes

Ember runs at build time, inside a real Minecraft, and leaves JSON files in
`src/main/generated`. Run it with:

```
./gradlew :yourmod:ember
```

A generator is a class with `@Generator`. The annotation processor indexes it
while it compiles, so a class that is never run is a build error rather than a
file that quietly never appears.

```java
@Generator
public final class ModModels extends EmberModelProvider {

    public ModModels() {
    }

    @Override
    protected void models() {
        cubeAll(ModBlocks.RUBY_BLOCK);
    }
}
```

## The providers

| Class | Writes |
|-------|--------|
| `EmberModelProvider` | blockstates, block and item models, item definitions |
| `EmberLootTableProvider` | block loot tables |
| `EmberRecipeProvider` | shaped, shapeless, stonecutting, smelting, blasting |
| `EmberTagsProvider.BlockTagsProvider` | block tags |
| `EmberTagsProvider.ItemTagsProvider` | item tags |
| `EmberTagsProvider.EntityTagsProvider` | entity type tags |
| `EmberTagsProvider.FluidTagsProvider` | fluid tags |
| `EmberTagsProvider.DamageTypeTagsProvider` | damage type tags |
| `EmberTagsProvider.EnchantmentTagsProvider` | enchantment tags |
| `EmberTagsProvider.GameEventTagsProvider` | game event tags |
| `EmberLanguageProvider` | one language file per class |
| `EmberOreProvider` | configured and placed features for an ore |
| `EmberSoundProvider` | `sounds.json` |
| `EmberAdvancementProvider` | advancements |
| `EmberDamageTypeProvider` | damage types |
| `EmberEnchantmentProvider` | enchantments |
| `EmberTradeProvider` | villager trades, and the sets they are drawn from |
| `EmberCosmeticsProvider` | jukebox songs, paintings, instruments, banner patterns |
| `EmberEquipmentProvider` | equipment assets: what armour looks like when worn |
| `EmberBiomeProvider` | biomes |
| `EmberDimensionProvider` | dimension types, and the dimensions using them |
| `EmberStructureProvider` | structures, template pools, sets, processor lists |
| `EmberTestProvider` | test instances: the files that make game tests run |
| `EmberDialogProvider` | dialogs the server opens on a client |

## Commit the output

`src/main/generated` belongs in git.

A generator is code, and code changes. If its output lived only in a build
directory, a change in what Ember writes would reach the game without anybody
reading it. Committed, it is a diff — a reviewer sees that a blockstate gained
a rotation or a loot table lost a condition, in the same change that caused it.

## Item definitions, not just models

In 26.2 the file the game looks up for an item is `assets/<ns>/items/<id>.json`,
not the model. An item with a perfectly good model and no definition beside it
draws as the missing-texture checker.

`flatItem` and `handheldItem` write both. If you write a model by hand, write
the definition too.

## Everything is checked against the game

Every file listed above is parsed with Minecraft's own codec on each build, by
a check that boots a real game to do it. That is not thoroughness for its own
sake: a datapack file that is wrong loads without complaint and the thing it
describes simply never happens. The codec is the only thing that says so.

## See also

- [Models and blockstates](ember-models)
- [Loot, recipes and tags](ember-data)
- [Advancements, damage and enchantments](ember-more)
