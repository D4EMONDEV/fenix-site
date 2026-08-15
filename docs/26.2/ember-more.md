---
title: Advancements, damage and enchantments
section: Ember
order: 30
---

# Advancements, damage and enchantments

Three data kinds that used to be code and are now files. All three fail the
same way when they are wrong: the file loads, the game says nothing, and the
thing simply never happens.

## Advancements

```java
@Generator
public final class ModAdvancements extends EmberAdvancementProvider {

    @Override
    protected void advancements() {
        advancement("root")
                .title("Ruby Age")
                .description("Find your first ruby.")
                .icon(ModItems.RUBY)
                .background("minecraft:block/deepslate")
                .hasItem("ruby", ModItems.RUBY)
                .save();

        advancement("every_shape")
                .parent("mymod:root")
                .title("Cut to Fit")
                .icon(ModBlocks.RUBY_STAIRS)
                .challenge()
                .experience(100)
                .hasItem("slab", ModBlocks.RUBY_SLAB)
                .hasItem("stairs", ModBlocks.RUBY_STAIRS)
                .save();
    }
}
```

A root advancement opens a tab of its own, so it wants a `background`. Without
one the tab draws on nothing and looks broken rather than empty.

### All of them, or any of them

Criteria are combined with **AND** by default — which is what "collect every
shape" means. `requireAny()` switches to OR:

```java
advancement("a_friend")
        .requireAny()
        .hasItem("sprite", SPRITE_EGG)
        .hasItem("wisp", WISP_EGG)
        .save();
```

### Triggers

`hasItem`, `killed` and `grantedByCode` cover the common ones. There are around
eighty, so anything else goes in verbatim:

```java
.criterion("bred", "minecraft:bred_animals", """
        { "parent": [ { "condition": "minecraft:entity_properties",
                        "entity": "this",
                        "predicate": { "minecraft:entity_type": "minecraft:cow" } } ] }
        """)
```

::: warning
A trigger name that does not exist is not an error. The file loads and the
advancement can never be earned. Fenix's conformance check parses every
generated advancement with the game's own codec for exactly this reason.
:::

## Damage types

Since damage became data, hurting a player means declaring the kind of hurt
first.

```java
@Generator
public final class ModDamageTypes extends EmberDamageTypeProvider {

    @Override
    protected void damageTypes() {
        damageType("ruby_burn")
                .exhaustion(0.1f)
                .effects(Effects.BURNING)
                .save();
    }
}
```

Two things are easy to forget and both are silent:

- **The death message.** The game builds the key `death.attack.<message_id>`,
  and a damage type without a line there kills players with a blank message.
- **The tags.** A damage type in no tag is one armour, enchantments and the
  game rules have never heard of. Fire damage outside `#minecraft:is_fire`
  ignores Fire Protection, and nothing explains why.

```java
tag(DamageTypeTags.IS_FIRE).add("mymod:ruby_burn");
```

## Enchantments

There is no `Registrar.enchantment`, and that is not an omission: since 1.21 an
enchantment is data, so shipping the file is the whole of adding one.

```java
enchantment("ruby_edge")
        .description("Ruby Edge")
        .supports(ItemTags.SWORDS)
        .primary(ItemTags.SWORDS)
        .exclusiveWith(EnchantmentTags.DAMAGE_EXCLUSIVE)
        .slots(Slot.MAINHAND)
        .maxLevel(3)
        .weight(4)
        .cost(4, 9, 24, 9)
        .addsDamage(0.5f, 0.5f)
        .save();
```

The frame — what it goes on, how rare it is, what it costs — has methods. Its
*effects* are a language of their own, wide enough that vanilla uses a dozen
shapes across its own enchantments, so `effect(component, json)` takes them
verbatim rather than pretending a builder could cover them. `addsDamage` is the
one shape common enough to be worth naming.

::: tip
An enchantment outside `#minecraft:in_enchanting_table` exists, can be given by
command, and is never once offered by an enchanting table. It reads as the
table being unlucky.
:::
