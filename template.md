---
title: Start a mod
---

# Start a mod

Fill this in and take away a project that builds. Everything is generated in
your browser — nothing is uploaded, and there is no server to ask.

<Template />

## Where the versions come from

Not from this page. The plugin version, the API version and the Java version
are read from `platforms.json` in the loader's repository each time this page
loads — the same file the Gradle plugin ships and the same one the site's
version check reads.

That is deliberate. This site once shipped a "Your first mod" page whose build
file could not build: it named a `fenixApi` configuration the plugin does not
create, and it left out the `settings.gradle` that tells Gradle where the
plugin lives. The version check passed the whole time, because it was reading
a version out of a line that never worked. A generator carrying its own copy
of the numbers would be that mistake with a download button on it.

If the table cannot be read, this page refuses to generate rather than falling
back on remembered numbers.

## What it does not include

The Gradle wrapper. Run `gradle wrapper` once in the unpacked directory and
Gradle writes it. A wrapper is a jar that every later build executes, and one
handed to you by a web page is not something to run unexamined.
