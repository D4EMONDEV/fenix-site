---
title: Installing Fenix
section: Getting started
order: 5
---

# Installing Fenix

This is for **playing** with Fenix — putting it into a `.minecraft` so the
official launcher can start it. Writing a mod needs none of it: the Gradle
plugin downloads everything and `./gradlew runClient` launches the game.

## The installer

Download it from the [releases
page](https://github.com/D4EMONDEV/Fenix/releases), unpack the zip for your
platform, and double-click the application inside. Every release carries one.

Building it yourself is a clone and one task, if you would rather:

```bash
./gradlew :fenix-installer:distInstaller
```

It carries its own Java runtime, which is deliberate: Minecraft ships a Java of
its own but does not put it on the `PATH`, so an installer that needed one
would turn away exactly the people it exists for. That is most of its size.

There is nothing to download while it runs. The loader, `fenix-api-core`, Mixin
and ASM all travel inside it, so it works offline and installs the versions it
was built and tested with rather than whatever is current.

### From a terminal

The same thing is a plain jar, if you would rather:

```bash
java -jar fenix-installer-0.1.3.jar
```

| Option | What it is for |
|--------|----------------|
| `--dir <path>` | a `.minecraft` that is not in the standard place |
| `--minecraft <version>` | the vanilla version to install on top of |

## What it writes

Fenix installs **beside** vanilla rather than over it:

- a version directory under `versions/`
- the loader and its libraries under `libraries/`
- one entry in `launcher_profiles.json`

That entry uses a stable key, so installing again updates it instead of leaving
you with a list of near-identical profiles. Every other profile is left as it
was.

Nothing in your existing installation is replaced, and uninstalling is deleting
the version directory and that one profile entry.

## Then

Open the official launcher, pick the **Fenix** profile, and play. Mods go in
`.minecraft/mods/`.

::: tip
For developing a mod, `./gradlew runClient` is shorter and does not touch your
real `.minecraft` at all — it builds a throwaway game directory under `build`.
Reach for the installer when you want to *play* with mods, or to hand someone a
working install.
:::

::: tip
`jpackage` bundles a runtime for the machine it runs on, so a Windows build
gives a Windows installer and nothing else. The release workflow runs it on
Windows, macOS and Linux, which is why the releases page has one archive per
platform — and why building it yourself gives you only your own.
:::
