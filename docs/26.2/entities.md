---
title: Entities
---

# Entities

```java
public static final Holder<EntityType<RubySprite>> RUBY_SPRITE = REGISTRAR.entity(
        "ruby_sprite", RubySprite::new, MobCategory.CREATURE, 0.6f, 1.2f);
```

## Attributes

An entity with a brain needs an attribute set, or the game refuses to spawn it.
Register the supplier beside the type:

```java
REGISTRAR.attributes(RUBY_SPRITE, RubySprite::attributes);
```

```java
public static AttributeSupplier.Builder attributes() {
    return Mob.createMobAttributes()
            .add(Attributes.MAX_HEALTH, 12.0)
            .add(Attributes.MOVEMENT_SPEED, 0.25)
            .add(EntityAttributes.holder(ModContent.RUBY_CHARGE), 3.0);
}
```

### Attributes of your own

A stat vanilla has no word for — mana, weight, a resistance — is an attribute
you register. It is stored on the entity and saved with it, and other mods can
add to it.

```java
public static final Holder<Attribute> RUBY_CHARGE =
        REGISTRAR.attribute("ruby_charge", 0.0, 0.0, 64.0);
```

`AttributeSupplier.Builder.add` wants the game's own `Holder`, not Fenix's, so
`EntityAttributes.holder(…)` converts between them.

## Spawning

Two separate things: where the game is *allowed* to put it, and which biomes
actually want it.

```java
REGISTRAR.spawnPlacement(RUBY_SPRITE, SpawnPlacementTypes.ON_GROUND,
        Heightmap.Types.MOTION_BLOCKING_NO_LEAVES, Mob::checkMobSpawnRules);

BiomeModifications.addSpawn(BiomeSelectors.overworld(), MobCategory.CREATURE,
        RUBY_SPRITE, 6, 1, 3);   // weight, min, max
```

Taking something out works the same way:

```java
BiomeModifications.removeSpawn(BiomeSelectors.overworld(),
        MobCategory.AMBIENT, EntityTypes.BAT);
```

::: tip
Pass the `Holder`, not `HOLDER.get()`. The removal and the addition are applied
when biomes load, which is after registration — resolving the type yourself at
declaration time reads a handle before `apply()` has run.
:::

## A spawn egg

```java
public static final Holder<Item> RUBY_SPRITE_SPAWN_EGG =
        REGISTRAR.spawnEgg("ruby_sprite_spawn_egg", RUBY_SPRITE);
```

In 26.2 a spawn egg is an ordinary flat item with one texture — there is no
tint template to fill in.

## Drawing it

Client side only, in the client entry point:

```java
ModEntityModels.register();
EntityRendering.register(ModContent.RUBY_SPRITE, RubySpriteRenderer::new);
```
