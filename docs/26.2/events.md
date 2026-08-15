---
title: Events
section: Behaviour
order: 0
---

# Events

An event is a static field you register a listener on. Registration is
unordered and can happen at any time after the class loads; `onInit` is the
usual place.

```java
PlayerEvents.JOINED.register(joined ->
        joined.player().sendSystemMessage(Component.literal("Welcome.")));
```

## Two kinds

A plain `Event` reports something. A `CancellableEvent` asks, and the listener
answers with a `Flow`:

```java
BlockEvents.BREAK.register(event -> {
    if (event.level().getBlockState(event.pos()).is(PROTECTED)) {
        return Flow.CANCEL;
    }
    return Flow.CONTINUE;
});
```

## Priority

```java
BlockEvents.BREAK.register(Priority.HIGH, listener);
```

Higher runs first. Reach for it when your listener has to see the event before
another mod's, not to express importance.

## What is there

### Server side

| Event | Fires |
|-------|-------|
| `ServerEvents.STARTED` / `STOPPING` | the server, once |
| `LevelEvents.LOADED` / `SAVING` | per level — the overworld, the nether and the end are separate |
| `PlayerEvents.JOINED` | a player can be sent something |
| `PlayerEvents.PICKED_UP` | before the stack merges into the inventory |
| `PlayerEvents.CHANGED_DIMENSION` | after arrival |
| `PlayerEvents.USE_ITEM` | cancellable |
| `BlockEvents.BREAK` / `PLACE` | cancellable |
| `EntityEvents.HURT` / `INTERACT` / `DEATH` | `HURT` and `INTERACT` cancellable |
| `LootEvents.LOADING` | add a pool to a table as it loads |
| `CommandEvents.REGISTER` | on start and on every `/reload` |

### Client side

| Event | Fires |
|-------|-------|
| `ClientEvents.CONNECTED` / `DISCONNECTED` | joining and leaving a world |
| `ClientEvents.SCREEN` | before a screen is initialised — where a widget is added |
| `ClientBlockEvents.ATTACK` / `USE` | the client's own prediction, cancellable |
| `ItemTooltipEvents.BUILD` | lines under an item's name |
| `HudRenderEvents.RENDER` | drawing over the game |

## Loot, without overriding files

```java
LootEvents.LOADING.register(loot -> {
    if (loot.id().equals(Identifier.parse("minecraft:blocks/stone"))) {
        loot.addPool(LootPool.lootPool()
                .setRolls(ConstantValue.exactly(1))
                .when(LootItemRandomChanceCondition.randomChance(0.02f))
                .add(LootItem.lootTableItem(ModItems.RUBY.get()))
                .build());
    }
});
```

Adding a pool rather than shipping a datapack file matters: two mods that both
drop something from stone is exactly what a file override cannot do. The second
copy wins and the first mod's drop is gone, with nothing said.
