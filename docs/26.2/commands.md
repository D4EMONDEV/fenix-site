---
title: Commands
---

# Commands

Commands are declared through the event bus, which is what makes them survive
`/reload`:

```java
public static void register() {
    CommandEvents.REGISTER.register(commands ->
            commands.literal("wisp")
                    .then(Commands.argument("count", IntegerArgumentType.integer(1, 16))
                            .executes(context -> throwWisps(
                                    context, IntegerArgumentType.getInteger(context, "count"))))
                    .executes(context -> throwWisps(context, 1)));
}
```

Call `register()` once from `onInit`. The event fires on server start and again
on every datapack reload, so a command registered this way is rebuilt each time
rather than disappearing.

## An argument type of your own

Registering an argument type is what makes tab-completion suggest your values
rather than nothing:

```java
public static final Holder<ArgumentTypeInfo<OreArgument, ?>> ORE_ARGUMENT =
        REGISTRAR.argumentType("ore", OreArgument.class,
                SingletonArgumentInfo.contextFree(OreArgument::new));
```

```java
public final class OreArgument implements ArgumentType<Identifier> {

    @Override
    public <S> CompletableFuture<Suggestions> listSuggestions(
            CommandContext<S> context, SuggestionsBuilder builder) {
        return SharedSuggestionProvider.suggest(NAMES, builder);
    }
}
```

Without the registration the command still works locally and suggests nothing
over a network, because the server cannot tell the client what kind of argument
it is.
