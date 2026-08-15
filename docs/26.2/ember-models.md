---
title: Models and blockstates
section: Ember
order: 10
---

# Models and blockstates

`EmberModelProvider` covers thirteen shapes. Each writes what vanilla writes
for its own equivalent — the same states, the same rotations, the same
multipart conditions.

```java
@Override
protected void models() {
    cubeAll(RUBY_BLOCK);                        // one texture on six faces
    cubeColumn(RUBY_LOG);                       // ends and sides differ
    cubeBottomTop(FURNACE_LIKE);
    orientable(MACHINE);                        // a front face that turns

    cross(SAPLING_LIKE);                        // a flat cross, for plants

    slab(RUBY_SLAB, RUBY_BLOCK);                // cut from another block
    stairs(RUBY_STAIRS, RUBY_BLOCK);
    fence(RUBY_FENCE, RUBY_BLOCK);
    fenceGate(RUBY_GATE, RUBY_BLOCK);
    wall(RUBY_WALL, RUBY_BLOCK);
    trapdoor(RUBY_TRAPDOOR, RUBY_BLOCK);
    button(RUBY_BUTTON, RUBY_BLOCK);
    pressurePlate(RUBY_PLATE, RUBY_BLOCK);

    door(RUBY_DOOR);                            // its own three textures

    flatItem(RUBY);                             // an icon
    handheldItem(RUBY_HAMMER);                  // held like a tool
}
```

The second argument is the block the shape is cut from: its texture is borrowed
rather than needing one of its own.

## Textures a door needs

A door is the one shape that does not borrow. It needs three files:

```
textures/block/ruby_door_top.png
textures/block/ruby_door_bottom.png
textures/item/ruby_door.png
```

::: warning
The block textures must be **opaque in the three leftmost columns and the
bottom three rows**. Vanilla's door model samples the door's narrow sides from
`uv [0,0,3,16]` and its top and bottom from the last three rows. A transparent
pixel there is a see-through edge on a solid door — and the wide faces, which
read the whole texture, look perfectly fine, so the mistake shows only from the
side.

`oak_door_bottom.png` is opaque in all 256 pixels. `oak_door_top.png` is clear
only at its two window panes.
:::

## Reading vanilla rather than remembering it

Which way a blockstate's variants are rotated is not guessable. A furnace and a
button are both drawn facing north at rotation zero, not south — and getting it
wrong costs every variant 90 degrees, with no crash and no log line.

If you write a blockstate by hand, open the game's own file for the block you
are copying and read it. It is in the client jar under
`assets/minecraft/blockstates/`.
