---
title: Networking
section: Behaviour
order: 10
---

# Networking

A channel is a typed pair of ends. Declare it once, on both sides.

```java
public static final ToServer<Reset> RESET =
        ToServer.of(Identifier.parse("mymod:reset"), Reset.CODEC);

public static final ToClient<Tally> TALLY =
        ToClient.of(Identifier.parse("mymod:tally"), Tally.CODEC);
```

The payload is a record with a codec:

```java
public record Tally(BlockPos pos, int count) {
    public static final StreamCodec<FriendlyByteBuf, Tally> CODEC =
            StreamCodec.composite(
                    BlockPos.STREAM_CODEC, Tally::pos,
                    ByteBufCodecs.VAR_INT, Tally::count,
                    Tally::new);
}
```

## Receiving

```java
// Server: the player who sent it comes with the payload.
RESET.receive((reset, player) -> {
    if (player.blockPosition().closerThan(reset.pos(), 8)) {
        // …
    }
});

// Client:
TALLY.receive(tally -> Minecraft.getInstance().player
        .sendSystemMessage(Component.literal("Tally: " + tally.count())));
```

## Handlers run on the game thread

Packets arrive on a network thread. Fenix hands your handler to the client or
the server before running it, so you can touch the world or the screen the way
the code above does.

This is worth knowing because it is the kind of thing that is easy to get wrong
in a mod loader and hard to notice: a handler running on the network thread
mostly works. The way it stops working is a disconnect reading
`Rendersystem called from wrong thread`, which names no mod, no channel and no
handler.

## Distrust the other side

Both ends of a channel are reachable by software you did not write. The server
example above checks the distance before acting, because a payload saying
"reset the block at these coordinates" is a claim, not a fact.

Fenix refuses a payload that arrives travelling the wrong way, and ignores one
whose channel it does not know — a server may well run mods its players do not
have, and the reverse.
