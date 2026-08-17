---
title: The Registrar
section: Content
order: 0
---

# The registrar

One `Registrar` per mod, named after it:

```java
public static final Registrar REGISTRAR = Registrar.of("mymod");
```

Everything it creates lives under that namespace. You never write the namespace
again.

## Deferred, and why

Declaring content is not registering it. The registrar collects declarations as
your classes load, and registers them all when `apply()` is called from
`onRegister` — the one moment the game's registries are open.

```java
@Override
public void onRegister(Fenix fenix) {
    ModContent.REGISTRAR.apply();
}
```

What comes back from a declaration is a `Holder`: a handle that knows its id
immediately and its value after `apply()`. Reading `.get()` too early throws
with a message saying exactly that, rather than handing you a `null` that fails
somewhere else entirely.

```java
Holder<Block> block = REGISTRAR.newBlock("ruby_block").register();

block.id();     // fine at any time
block.get();    // throws until apply() has run
```

## What it can register

| Method | Registers |
|--------|-----------|
| `newBlock(name)` | a block, through a builder; `withItem()` adds its item |
| `newItem(name)` | an item, through a builder |
| `block(name, factory)` | a block whose class you wrote |
| `blockEntity(name, factory, blocks)` | a block entity type |
| `entity(name, …)` | an entity type |
| `menu(name, factory)` | a menu type |
| `recipeType` / `recipeSerializer` | a recipe kind of your own |
| `attribute(name, base, min, max)` | a number every entity carries |
| `gameRule(name, category, default)` | a rule, boolean or integer |
| `blockSetType(name, …)` | the character a door, trapdoor, button and plate share |
| `soundEvent`, `particle`, `effect`, `potion` | the rest |
| `poiType`, `profession` | villagers |
| `memoryModule`, `sensor`, `activity` | the three pieces of a brain |
| `gameEvent(name, radius)` | something happening, that sculk can hear |
| `lootCondition`, `lootFunction`, `lootNumberProvider` | loot extension points |
| `decoratedPotPattern` | a sherd, and the face it paints |
| `trigger(name, trigger)` | an advancement trigger of your own — [written up here](./ember-more#a-trigger-of-your-own) |
| `stat(name)` | a statistic the game keeps per player and shows under Custom |
| `feature(name, feature)` | world generation code of your own — [written up here](./ember-worldgen#a-feature-of-your-own) |
| `enchantmentEffect(name, codec)` | an enchantment effect vanilla has no word for |
| `testFunction(name, test)` | a game test: code that runs in a real world |
| `armorMaterial(name)` | durability, protection and the sound a set makes |
| `creativeTab(name, icon)` | a tab of the mod's own |

## Statistics, and what they are not

```java
public static final Identifier SWINGS = REGISTRAR.stat("hammer_swings");

player.awardStat(SWINGS);
```

A statistic and an [attachment](./blocks-and-items) both hold a number per
player, and they are not interchangeable. An attachment is yours: you decide
what it means and only your code reads it. A statistic is vanilla's — it shows
in the statistics screen under Custom, the game saves and restores it, and a
scoreboard or a command can read it. Reach for a statistic when the number is
something a player would want to look up.

Pass a `StatFormatter` for anything that is not a plain count: `TIME` for
ticks, `DISTANCE` for centimetres. Without one the number is shown raw, so a
duration reads as a tick count nobody can interpret.

::: warning
A statistic that is awarded but never registered is **dropped** from the
player's file when it is saved — not rejected. Nothing logs, and it is noticed
when somebody opens the statistics screen and finds nothing there. Give it a
name too, under `stat.<namespace>.<name>`, or the screen shows the key.
:::

## Builders

`newBlock` and `newItem` return builders, so the common case is one chain:

```java
public static final Holder<Block> RUBY_BLOCK = REGISTRAR.newBlock("ruby_block")
        .strength(3f, 6f)      // hardness, blast resistance
        .requiresTool()
        .sound(SoundType.METAL)
        .withItem()            // and its item, in the same breath
        .register();
```

A block whose behaviour you wrote takes a factory instead:

```java
public static final Holder<Block> TALLY = REGISTRAR.newBlock("tally")
        .strength(3f)
        .from(RubyTallyBlock::new)
        .withItem()
        .register();
```

::: warning
`requiresTool()` without a `mineable` tag is a block no tool can break for its
drop. It takes a long time and gives nothing back, and nothing in the log
mentions it. Add the tag in the same change — see
[loot, recipes and tags](ember-data).
:::
