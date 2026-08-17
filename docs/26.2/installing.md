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

There are no prebuilt downloads yet — the release workflow publishes the Maven
repository and nothing else, so the installer is built from the repository:

```bash
git clone https://github.com/D4EMONDEV/Fenix.git
cd Fenix
./gradlew :fenix-installer:distInstaller
```

That leaves a zip in `fenix-installer/build/distributions/`. Unpack it and
double-click the application inside.

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

::: warning
The zip is built for one platform at a time: `jpackage` bundles a runtime for
the machine it runs on, so building on Windows gives a Windows installer and
nothing else. macOS and Linux have to be built there.

That is also why there are no downloads on the releases page yet — attaching
them means running the build on three machines, which the publish workflow does
not do today.
:::
