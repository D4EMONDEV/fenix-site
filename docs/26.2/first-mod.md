---
title: Your first mod
section: Getting started
order: 10
---

# Your first mod

## The build file

Two files. First `settings.gradle`, which is where Gradle is told **where the
plugin lives** — Fenix is not on the Gradle Plugin Portal, so without this the
build stops at `Plugin [id: 'fr.d4emon.fenix.dev'] was not found`:

```groovy
pluginManagement {
    repositories {
        maven { url = 'https://d4emondev.github.io/Fenix/' }
        gradlePluginPortal()
    }
}

rootProject.name = 'mymod'
```

Then `build.gradle`, which is the whole file:

```groovy
plugins {
    id 'java'
    id 'fr.d4emon.fenix.dev' version '0.3.0'
}

fenix {
    minecraft = '26.2'
}
```

There is no `dependencies` block, and that is not an omission. The plugin adds
the Fenix repository, downloads Minecraft, puts
`fr.d4emon.fenix:fenix-api:0.8.0+mc26.2` on your compile path and the annotation processor beside it, and gives you
`runClient`, `runServer`, `runGameTest` and `ember`. Declaring the API yourself
is how the two versions drift apart, so the plugin owns it.

::: tip
`fenix { minecraft = '26.2' }` is an assignment, not a call. The plugin's
extension is a Gradle `Property`, and `minecraft '26.2'` — which reads fine and
is what Forge users expect — is a method call that does not exist.
:::

## The manifest

`src/main/resources/fenix.mod.json`:

```json
{
  "schema": 1,
  "id": "mymod",
  "version": "1.0.0",
  "depends": {
    "fenix": ">=0.1.0",
    "fenix-api-registry": ">=0.4.0"
  }
}
```

Nothing here points at your entry point. The `@Mod` annotation is the
declaration, and the processor records it while the mod compiles — so a
renamed or mistyped class fails the build rather than the launch.

## The entry point

```java
package com.example.mymod;

import fr.d4emon.fenix.api.Fenix;
import fr.d4emon.fenix.api.FenixMod;
import fr.d4emon.fenix.api.Mod;

@Mod("mymod")
public final class MyMod implements FenixMod {

    public MyMod() {
    }

    @Override
    public void onRegister(Fenix fenix) {
        ModContent.REGISTRAR.apply();
    }

    @Override
    public void onInit(Fenix fenix) {
        fenix.logger().info("mymod is up");
    }
}
```

## A block

```java
public final class ModContent {

    public static final Registrar REGISTRAR = Registrar.of("mymod");

    public static final Holder<Block> RUBY_BLOCK = REGISTRAR.newBlock("ruby_block")
            .strength(3f, 6f)
            .requiresTool()
            .withItem()
            .register();

    private ModContent() {
    }
}
```

## Run it

```
./gradlew runClient
```

The block exists, and is nowhere a player can find it. It has no model, no loot
table, no name and no creative tab — four separate files, none of which the
game will complain about. [Ember](ember) writes three of them; the fourth is
one line:

```java
CreativeTabs.addTo(CreativeTabs.BUILDING_BLOCKS, RUBY_BLOCK);
```
