---
title: Loot, recipes and tags
section: Ember
order: 20
---

# Loot, recipes and tags

## Loot tables

```java
@Override
protected void lootTables() {
    dropsSelf(RUBY_BLOCK);
    drops(RUBY_ORE, ModItems.RUBY);          // one, whatever the tool
    dropsOre(DEEPSLATE_RUBY_ORE, ModItems.RUBY);   // respects Fortune
    dropsWithSilkTouch(GLASS_LIKE);

    dropsSlab(RUBY_SLAB);                    // two when it was a double slab
    dropsDoor(RUBY_DOOR);                    // once, not once per half
}
```

`dropsSelf` is wrong for a slab and for a door, and wrong quietly. A double slab
is one block holding two, so breaking it owes two and pays one. A door is two
block states and breaking either breaks both, so it rolls its table twice and
pays double.

### What a mob and a chest drop

```java
entityLoot(ModContent.RUBY_SPRITE)
        .drop(ModItems.RUBY, 0, 2).looting(1)
        .save();

chestLoot("ruby_cache")
        .rolls(2, 4)
        .item(ModItems.RUBY, 20, 1, 3)
        .item(ModBlocks.RUBY_BLOCK, 5)
        .save();
```

`looting(max)` applies to the drop before it, and is the idiom every vanilla
mob table uses. Without it a mod's mob ignores the enchantment, which players
read as the mob being bugged rather than as a table that never mentioned it.

An entity type with no table in `loot_table/entities` drops nothing, silently.

## Recipes

```java
@Override
protected void recipes() {
    shaped(RUBY_BLOCK)
            .pattern("###", "###", "###")
            .define('#', ModItems.RUBY)
            .save();

    shapeless(ModItems.RUBY, 9)
            .ingredient(RUBY_BLOCK)
            .named("ruby_from_block")
            .save();

    // Anything in a tag will do — how most vanilla recipes are written.
    shaped(RUBY_TALLY)
            .pattern("###", "#R#", "###")
            .define('#', ItemTags.PLANKS)
            .define('R', ModItems.RUBY)
            .save();

    stonecutting(RUBY_SLAB, RUBY_BLOCK, 2);
    stonecutting(RUBY_STAIRS, RUBY_BLOCK);

    smelting(ModItems.RUBY, RUBY_ORE, 1.0f, 200);
    blasting(ModItems.RUBY, RUBY_ORE, 1.0f, 100);
}
```

A recipe naming one block where a family was meant works for that block and
silently refuses the other eleven. The player who tried birch concludes the mod
is broken.

## Tags

Name them with the game's constants wherever one exists:

```java
@Override
protected void tags() {
    tag(BlockTags.MINEABLE_WITH_PICKAXE)
            .add(RUBY_BLOCK)
            .addTag("mymod:ruby_shapes");     // a tag can hold a tag

    tag(BlockTags.NEEDS_IRON_TOOL).add(RUBY_BLOCK);

    tag(BlockTags.FENCES).add(RUBY_FENCE);
    tag(BlockTags.WALLS).add(RUBY_WALL);

    tag("mymod:ruby_shapes")                  // your own: no constant exists
            .add(RUBY_SLAB)
            .add(RUBY_STAIRS);
}
```

Both forms exist and both are correct. The difference is where a mistake shows
up: a misspelled constant does not compile, and a misspelled string writes a
perfectly valid file into a tag nothing reads.

The typed overloads also keep the two kinds apart — `tag(ItemTags.SWORDS)`
inside a `BlockTagsProvider` is a compile error, not a file in the wrong
directory.

::: warning
Every block that declares `requiresTool()` needs a `mineable` tag. Without one,
no tool is the right tool: the block takes a long time to break and drops
nothing at all.
:::
