---
title: Brains and behaviour
section: Content
order: 25
---

# Brains and behaviour

Vanilla's villagers, piglins and axolotls are not driven by goals but by a
`Brain`: a bag of memories, the sensors that fill them, and the behaviours that
read them. A mod could not join in at all until Fenix could register the three
pieces a brain is made of.

## The three pieces

```java
public static final Holder<MemoryModuleType<Integer>> ANGER =
        REGISTRAR.memoryModule("anger", Codec.INT);

public static final Holder<SensorType<RubySensor>> NEARBY_RUBY =
        REGISTRAR.sensor("nearby_ruby", RubySensor::new);

public static final Holder<Activity> MINING = REGISTRAR.activity("mining");
```

| | |
|---|---|
| **Memory** | one named thing a mob knows |
| **Sensor** | what refills a memory, on the brain's own schedule |
| **Activity** | a named thing the mob is currently doing |

### Memories that are saved, and memories that are not

```java
REGISTRAR.memoryModule("target");             // forgotten on unload
REGISTRAR.memoryModule("anger", Codec.INT);   // saved with the entity
```

No codec means the memory does not survive the chunk unloading. That is right
for anything a sensor refills — what the mob can see, who it is angry at this
second. A grudge that should outlive a reload needs the codec.

### A sensor

```java
public final class RubySensor extends Sensor<LivingEntity> {

    @Override
    protected void doTick(ServerLevel level, LivingEntity entity) {
        entity.getBrain().setMemory(ModContent.ANGER.get(), 1);
    }

    @Override
    public Set<MemoryModuleType<?>> requires() {
        return Set.of(ModContent.ANGER.get());
    }
}
```

`requires()` is not decoration: the brain uses it to decide which memories to
allocate, and a sensor writing to a memory it did not declare is writing
nowhere.

## Why two of these need widening

`SensorType` and `Activity` both have private constructors in the game. Fenix
widens them through the `accessible` entries in its own manifest — see
[accessible members](accessible). Nothing is asked of a mod using them, but it
is worth knowing why the entries are there.

## Game events

Separate from brains, and often wanted alongside them: a game event is
something happening, in the vocabulary sculk and the warden already understand.

```java
public static final Holder<GameEvent> CHIME =
        REGISTRAR.gameEvent("chime", 16);
```

The number is how many blocks away it can be heard. Vanilla uses 16 for almost
everything.

::: warning
A game event outside `#minecraft:vibrations` is heard by nothing — not a sculk
sensor, not the warden, not an allay. That tag is most of the reason to have
declared the event.
:::

## Loot extension points

Three more registries a mod can add to, and all three take a codec rather than
a class, because in 26.2 that is what the registry holds:

```java
REGISTRAR.lootCondition("near_ruby", NearRuby.CODEC);
REGISTRAR.lootFunction("engrave", Engrave.CODEC);
REGISTRAR.lootNumberProvider("vein_size", VeinSize.CODEC);
```

The class returns the same codec from its own `codec()` method. That pair — the
registry mapping a name to a codec, the class pointing back at it — is how the
game gets from `"condition": "mymod:near_ruby"` in a loot table to your class.
