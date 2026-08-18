---
title: Client and server
section: Getting started
order: 15
---

# Client and server

A dedicated server jar does not contain the client's classes. Not "does not
use" — does not contain. Touching `Minecraft.getInstance()` from code a server
runs is a `NoClassDefFoundError`, and it arrives the first time somebody hosts
your mod rather than while you are writing it.

Fenix keeps the two apart in three places, at three different moments.

## The source sets

`src/main/java` compiles against the **server's** view of the game.
`src/client/java` compiles against the client's, and can see everything main
can as well.

That is the important one, because it is the compiler that enforces it. Reach
for a screen, a renderer or `Minecraft` from `src/main` and the build stops with
the name of the symbol. There is nothing to remember and nothing to test for.

```
src/
  main/java/com/example/mymod/MyMod.java          ← both sides
  client/java/com/example/mymod/client/MyModClient.java  ← client only
```

The Gradle plugin configures the client source set **if the directory exists**,
so adding a client half later is creating a directory. There is no flag.

Both entry points carry the same mod id:

```java
@Mod(MyMod.MODID)
public final class MyModClient implements FenixMod { … }
```

One jar carries one manifest and one id. A client class declaring an id of its
own produces a jar whose index and manifest disagree, and the loader refuses it.

::: tip
The annotation processor writes the client entry point into
`fenix.index.client.json`, separately from `fenix.index.json`. A dedicated
server reads only the second, so it never learns the client class exists —
which is the point. Being told to load a class that names types the server jar
does not contain would be fatal, not merely wrong.
:::

## The manifest, for a whole mod

If a mod has no business on one side at all, say so:

```json
{
  "id": "mymod",
  "side": "client"
}
```

`client`, `server`, or `both` — and `both` is the default. A mod whose side
does not match is set aside before it is loaded: not started and then stopped,
never started. That is the right answer for a mod that is entirely a screen, or
entirely a server utility.

## Asking at runtime

For the cases neither of the above covers — common code that should behave
slightly differently — the side is available:

```java
@Override
public void onInit(Fenix fenix) {
    if (fenix.side().isClient()) {
        …
    }
}
```

Reach for this last. It is a branch you have to keep correct, where the other
two are decisions the build and the loader make for you.

## Why not an annotation

`@Mod(MODID, side = Side.CLIENT)` would work — the loader could read the
attribute and skip the class. It is not offered on purpose.

With one source set, everything compiles against the client jar, so calling a
client-only method from common code compiles cleanly, runs cleanly in single
player, and fails on the first dedicated server. The attribute would say where
a class runs while doing nothing about what it is allowed to touch.

Separate source sets answer the second question, which is the one that bites.
