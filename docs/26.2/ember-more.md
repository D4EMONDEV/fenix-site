---
title: Advancements, armour and damage
section: Ember
order: 30
---

# Advancements, armour and damage

Four things that used to be code and are now files: advancements, armour,
damage types and enchantments. They fail the same way when they are wrong —
the file loads, the game says nothing, and the thing simply never happens.

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
advancement can never be earned. Ember reads every advancement back with the
game's own codec as it writes it, and refuses to write one that would not
load — so this fails the build instead of failing silently in the world.
:::

### A trigger of your own

The eighty vanilla triggers describe things vanilla knows about: an item picked
up, a mob killed, a block placed. None of them can see a number your mod keeps
for itself, so an advancement about that number needs a trigger you register.

Extend `SimpleCriterionTrigger`, and give it a codec for whatever the
advancement is allowed to say:

```java
public final class SwingsTrigger extends SimpleCriterionTrigger<SwingsTrigger.Instance> {

    public record Instance(Optional<ContextAwarePredicate> player, int atLeast)
            implements SimpleCriterionTrigger.SimpleInstance {

        public static final Codec<Instance> CODEC = RecordCodecBuilder.create(
                instance -> instance.group(
                        ContextAwarePredicate.CODEC.optionalFieldOf("player")
                                .forGetter(Instance::player),
                        Codec.INT.fieldOf("at_least").forGetter(Instance::atLeast)
                ).apply(instance, Instance::new));
    }

    @Override
    public Codec<Instance> codec() {
        return Instance.CODEC;
    }

    public void fire(ServerPlayer player, int swings) {
        trigger(player, instance -> swings >= instance.atLeast());
    }
}
```

Register it, and name it from an advancement:

```java
public static final SwingsTrigger SWINGS =
        REGISTRAR.trigger("swings", new SwingsTrigger());
```

```java
advancement("well_swung")
        .parent("example-mod:hammer")
        .title("Well Swung")
        .description("Swing the ruby hammer twenty-five times.")
        .icon(ModItems.RUBY_HAMMER)
        .goal()
        .criterion("swung", "example-mod:swings", "{\"at_least\": 25}")
        .save();
```

`Registrar.trigger` registers **eagerly**, unlike the rest of the registrar.
Advancements are read while a datapack loads, which happens earlier than
deferred content is bound, and a trigger the reader cannot find makes the
advancement fail to load. So the object is passed built, not as a factory.

Then call it every time the number changes. The advancement holds the
threshold, so the code that fires does not need to know it:

```java
int total = Attachments.get(player, TOTAL_SWINGS) + 1;
Attachments.set(player, TOTAL_SWINGS, total);

if (player instanceof ServerPlayer server) {
    SWINGS.fire(server, total);
}
```

::: warning
A trigger that is registered and never fired is an advancement nobody can
earn — and from inside the game it looks exactly like conditions that are too
hard, not like a mod that forgot to say when. Registering it is half the work.
:::

## Armour

Armour is two halves that are registered in different places, and a set with
only the first half equips, protects, wears down and cannot be seen. Both
halves are below.

### The material

`armorMaterial` describes the set: how much it takes, how much it gives, and
what it sounds like when it goes on.

```java
public static final ArmorMaterial RUBY_ARMOR = REGISTRAR.armorMaterial("ruby")
        .durability(22)
        .protection(ArmorType.HELMET, 3)
        .protection(ArmorType.CHESTPLATE, 7)
        .protection(ArmorType.LEGGINGS, 5)
        .protection(ArmorType.BOOTS, 3)
        .enchantmentValue(12)
        .toughness(1.5f)
        .knockbackResistance(0.05f)
        .build();
```

Everything except `protection` has iron's value until you change it, so a
plain set is three lines. `protection` has no default and `build()` throws
without it: armour that protects for zero is a set that looks finished and
does nothing, which is not a mistake worth defaulting into.

`durability` is a factor, not a number of points — the game multiplies it by
each piece's own base, the way vanilla's materials do, so one number covers
all four pieces.

Then the four items:

```java
public static final Holder<Item> RUBY_HELMET = REGISTRAR.newItem("ruby_helmet")
        .stacksTo(1)
        .armor(RUBY_ARMOR, ArmorType.HELMET)
        .build();
```

### The look

The material names an *equipment asset*, and the asset names the textures.
Ember writes it:

```java
@Generator
public final class ModEquipment extends EmberEquipmentProvider {

    @Override
    protected void equipment() {
        humanoidArmor("ruby");
    }
}
```

`humanoidArmor` writes **three** layers, because a humanoid is drawn from
three: `humanoid` for the helmet, chestplate and boots, `humanoid_leggings`
for the leggings, and `humanoid_baby` for the small version worn by baby mobs.
Each layer is a directory of its own, so `humanoidArmor("ruby")` wants three
files:

```
assets/<mod>/textures/entity/equipment/humanoid/ruby.png
assets/<mod>/textures/entity/equipment/humanoid_leggings/ruby.png
assets/<mod>/textures/entity/equipment/humanoid_baby/ruby.png
```

They are 64×32, laid out like vanilla's — the game reads fixed boxes out of
them rather than whole images, so a texture of the wrong size renders as a
slice of the wrong part of the file.

::: warning
Two of those three were drawn here and the third was not, and nothing said so:
the armour looked right on a player and was invisible on a baby zombie. Fenix's
conformance check now reads every layer of every equipment asset and fails the
build if a texture it names is not on disk.
:::

Use `asset(name).layer(layer, texture)` for anything that is not a humanoid
set — a horse's barding, or a wolf's armour, which are their own layers.

### Armour trims

A trim is two halves chosen separately at a smithing table: the **pattern** is
the shape, the **material** is the colour it is drawn in.

```java
trimPattern("facet");
trimMaterial("ruby", "ruby");
```

The pattern's texture goes in two directories, because armour is drawn in two
layers:

```
assets/<mod>/textures/trims/entity/humanoid/facet.png
assets/<mod>/textures/trims/entity/humanoid_leggings/facet.png
```

Draw them **greyscale**. The material recolours the pattern, so a trim drawn in
colour comes out right in exactly one material and wrong in every other — and
nothing says so.

::: warning
A trim whose texture is missing is not drawn at all. The armour looks
untrimmed, not broken, so there is nothing to notice and nothing in the log.
Fenix reads every pattern's `asset_id`, checks both layers, and fails the build.
:::

## Dialogs

A screen the **server** opens on a player's client, without the client knowing
anything about it. New in this line of the game, and the first thing a mod has
ever been able to put on screen from the server side alone — everything else
that draws is client code. A dialog is a datapack file, so it appears on a
vanilla client connected to a modded server.

```java
@Generator
public final class ModDialogs extends EmberDialogProvider {

    @Override
    protected void dialogs() {
        notice("shrine_found")
                .title("The Ruby Shrine")
                .body("Four pillars, weathered by whatever has been here longer than you.")
                .body("Something below still glitters.")
                .button("Onwards")
                .save();
    }
}
```

Then open it:

```java
player.registryAccess()
        .lookup(Registries.DIALOG)
        .flatMap(registry -> registry.get(Identifier.parse("example-mod:shrine_found")))
        .ifPresent(player::openDialog);
```

`notice` is the simplest of the five kinds — a title, some paragraphs, one
button. `withoutPausing()` lets a single-player game keep running behind it,
which matters for anything shown while the player is being chased.
`mustAnswer()` refuses escape, so the button is the only way out.

::: warning
A dialog that does not parse is not opened at all — `openDialog` is handed a
holder that was never bound — so it fails as a screen that does not appear,
which is indistinguishable from code that never ran. Ember reads it back with
the game's codec as it writes it: a misspelled kind gives `Unknown registry key
[…] minecraft:dialog_type: minecraft:notic`.
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


### An effect of your own

An enchantment file composes effects, and vanilla ships the vocabulary —
damage, ignite, a status effect. A mod that wants an effect vanilla has no word
for registers one:

```java
public record Drain(int seconds) implements EnchantmentEntityEffect {

    public static final MapCodec<Drain> CODEC = RecordCodecBuilder.mapCodec(
            i -> i.group(Codec.INT.fieldOf("seconds").forGetter(Drain::seconds))
                    .apply(i, Drain::new));

    @Override
    public void apply(ServerLevel level, int enchantLevel, EnchantedItemInUse item,
                      Entity target, Vec3 at) {
        // whatever only your mod can do
    }

    @Override
    public MapCodec<Drain> codec() {
        return CODEC;
    }
}
```

```java
public static final Holder<MapCodec<? extends EnchantmentEntityEffect>> DRAIN =
        REGISTRAR.enchantmentEffect("ruby_drain", Drain.CODEC);
```

The **codec** is what is registered, not the effect — an enchantment naming
`example-mod:ruby_drain` is asking for the codec, which builds an effect from
the fields the file supplied. Then name it wherever an effect is accepted:

```java
.effect("minecraft:post_attack", """
        {
          "enchanted": "attacker",
          "affected": "victim",
          "effect": { "type": "example-mod:ruby_drain", "seconds": 4 }
        }""")
```

`enchantmentValueEffect` does the same for the other kind: a way of changing a
number, where vanilla offers add, multiply and a few curves.

::: warning
One malformed effect makes the **whole enchantment** fail to load. It is then
absent from the enchanting table and the anvil, with a single line at pack
load — which reads as an enchantment that is hard to get.

Ember reads every enchantment back with the game's own codec as it writes it,
inside a game that has your mod, so a misspelled effect id fails the build:
`Unknown registry key […]: example-mod:ruby_drian`.
:::
