---
title: Configuration
---

# Configuration

A config is a record. The record is the schema, the defaults and the accessor
at once.

```java
public record ModConfig(boolean wisps, int limit, String greeting) {

    public static final ModConfig DEFAULTS = new ModConfig(true, 8, "Hello");
}
```

```java
@Override
public void onInit(Fenix fenix) {
    config = Config.of(fenix, ModConfig.DEFAULTS);

    if (config.get().wisps()) {
        // …
    }
}
```

The file is written on first run with the defaults, in the game directory under
`config/<modid>.json`. A missing field falls back to the default rather than
failing; a field the record does not have is reported and ignored, so a config
left over from an older version starts rather than crashing.

::: tip
Read the config once and keep it, as above. `Config.of` reads the file, and
calling it on every use turns a startup cost into a per-tick one.
:::
