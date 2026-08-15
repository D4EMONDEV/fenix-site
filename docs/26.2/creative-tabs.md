---
title: Creative tabs
---

# Creative tabs

A block that is in no creative tab is registered, modelled, named, drops
correctly — and cannot be found by a player. It can only be got with `/give`.
Nothing logs, nothing throws, and it looks exactly like a block that was never
added.

This is the quietest failure a mod can have. Treat adding to a tab as part of
adding content, not as a finishing touch.

## Adding to vanilla's tabs

```java
CreativeTabs.addTo(CreativeTabs.BUILDING_BLOCKS, RUBY_BLOCK, RUBY_SLAB, RUBY_STAIRS);
CreativeTabs.addTo(CreativeTabs.NATURAL_BLOCKS, RUBY_ORE);
CreativeTabs.addTo(CreativeTabs.INGREDIENTS, RUBY);
CreativeTabs.addTo(CreativeTabs.SPAWN_EGGS, RUBY_SPRITE_SPAWN_EGG);
```

Vanilla builds those lists once and freezes them, so this has to happen after
`apply()` and before the game finishes starting. Calling it from `onRegister`,
straight after `apply()`, is the simple answer.

## A tab of your own

```java
public static final ResourceKey<CreativeModeTab> TAB =
        REGISTRAR.creativeTab("mymod", ModItems.RUBY);   // name, and its icon

CreativeTabs.addTo(TAB, /* everything the mod registers */);
```

Content usually belongs in both: vanilla's tab is where somebody browsing finds
it, and your own is where somebody looking for your mod goes.

## Keeping the list complete

The list falls behind. It is two edits — add the content, list the content —
and only the first is load-bearing, so the second is the one that gets
forgotten.

If your mod is large enough for that to matter, a test that reads your own
declarations and asserts each appears in a tab costs about forty lines and
turns a silent omission into a failing build. Fenix's example mod has one, for
exactly this reason: the list fell behind twice.

## Paging

Vanilla shows ten tabs per screen. Past that, Fenix adds arrows rather than
letting the eleventh become unreachable. Nothing to call — it happens when the
count needs it.
