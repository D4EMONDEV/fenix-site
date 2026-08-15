---
title: Blocks and items
---

# Blocks and items

## A plain block

```java
public static final Holder<Block> RUBY_BLOCK = REGISTRAR.newBlock("ruby_block")
        .strength(3f, 6f)
        .requiresTool()
        .withItem()
        .register();
```

## Shapes cut from it

Minecraft keeps the constructors of `StairBlock`, `ButtonBlock`,
`TrapDoorBlock` and `PressurePlateBlock` to itself. Widen them in the manifest
rather than subclassing each for no reason — see
[accessible members](accessible).

```java
public static final Holder<Block> RUBY_SLAB = REGISTRAR.newBlock("ruby_slab")
        .strength(3f, 6f)
        .from(SlabBlock::new)
        .withItem()
        .register();

public static final Holder<Block> RUBY_STAIRS = REGISTRAR.newBlock("ruby_stairs")
        .strength(3f, 6f)
        // Safe to read: content is built in declaration order, and the block
        // this is cut from is declared above.
        .from(p -> new StairBlock(RUBY_BLOCK.get().defaultBlockState(), p))
        .withItem()
        .register();
```

### Doors, trapdoors, buttons and plates

These four share a `BlockSetType`, which decides two things that look
unrelated: the sounds they make, and **whether a hand can open them**. Vanilla
ships one per wood and one per metal. `BlockSetType.IRON` says no to opening by
hand — that is the iron door's whole character, and it is easy to borrow by
accident.

Declare your own:

```java
public static final BlockSetType RUBY_SET = REGISTRAR.blockSetType(
        "ruby", true, SoundType.METAL,
        SoundEvents.IRON_DOOR_CLOSE, SoundEvents.IRON_DOOR_OPEN,
        SoundEvents.IRON_TRAPDOOR_CLOSE, SoundEvents.IRON_TRAPDOOR_OPEN,
        SoundEvents.STONE_PRESSURE_PLATE_CLICK_OFF,
        SoundEvents.STONE_PRESSURE_PLATE_CLICK_ON,
        SoundEvents.STONE_BUTTON_CLICK_OFF, SoundEvents.STONE_BUTTON_CLICK_ON);

public static final Holder<Block> RUBY_DOOR = REGISTRAR.newBlock("ruby_door")
        .strength(3f, 6f)
        .noOcclusion()
        .from(p -> new DoorBlock(RUBY_SET, p))
        .withItem()
        .register();
```

The second argument is `openableByHand`.

### Fences and walls connect by tag

`FenceBlock.isSameFence` asks `BlockTags.FENCES`, and `WallBlock` asks
`BlockTags.WALLS`. Neither looks at the class. A fence outside the tag stands
alone in a row of its own kind, and a fence gate keeps joining it regardless —
a gate is matched by class, so it will not tell you anything is wrong.

```java
tag(BlockTags.FENCES).add(RUBY_FENCE);
tag(BlockTags.WALLS).add(RUBY_WALL);
```

## Items

```java
public static final Holder<Item> RUBY = REGISTRAR.newItem("ruby").register();

public static final Holder<Item> HAMMER = REGISTRAR.newItem("ruby_hammer")
        .durability(250)
        .stacksTo(1)
        .from(RubyHammer::new)
        .register();
```

## Behaviour vanilla keeps in tables

Burning, stripping, composting and fuel are not properties of a block — they
live in tables the game builds once and freezes. Fenix opens them:

```java
BlockInteractions.flammable(RUBY_LOG, 5, 5);
BlockInteractions.strippable(RUBY_LOG, STRIPPED_RUBY_LOG);
BlockInteractions.compostable(RUBY, 0.5f);
BlockInteractions.fuel(RUBY, 1600);
```

Left out, each fails without a word: a log that will not burn, an axe that does
nothing to it, a furnace that refuses your item.
