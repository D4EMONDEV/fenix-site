---
title: Mixins
section: Reaching into the game
order: 10
---

# Mixins

When no event reaches the code you need to change, a mixin does. Fenix ships
Mixin 0.8.7 and applies configurations named in the manifest.

```json
{ "mixins": ["mymod.mixins.json"] }
```

```json
{
  "required": true,
  "package": "com.example.mymod.mixin",
  "compatibilityLevel": "JAVA_21",
  "mixins": ["SomeMixin"],
  "client": ["SomeClientMixin"],
  "injectors": { "defaultRequire": 1 }
}
```

## `remap = false`, always

The game is unobfuscated. There are no mappings, so there is nothing to remap
to, and a mixin that asks for remapping fails to find a mapping set that does
not exist.

```java
@Inject(method = "tick", at = @At("HEAD"), remap = false)
private void mymod$onTick(CallbackInfo info) {
}
```

## Name your injectors

Prefix handler methods with your mod id. Two mods injecting a method called
`onTick` into the same class collide, and the error names neither of them.

## Reaching your own state

A mixin cannot add a public method that other code can call — Mixin merges the
class and then refuses to load the mixin itself. Declare an interface **outside
the mixin package**, have the mixin implement it, and cast:

```java
// com.example.mymod.duck.Charged  — not in the mixin package
public interface Charged {
    int mymod$charge();
}
```

```java
@Mixin(Entity.class)
public abstract class EntityChargeMixin implements Charged {

    @Unique private int mymod$charge;

    @Override
    public int mymod$charge() {
        return mymod$charge;
    }
}
```

```java
int charge = ((Charged) entity).mymod$charge();
```

## Check what you injected into

An injector that matches nothing is silent unless you ask for it.
`"defaultRequire": 1` turns a mixin that found no target into a startup failure
rather than a feature that quietly does nothing — which, after a game update
moves a method, is the difference between a crash you can read and a bug report
you cannot reproduce.
