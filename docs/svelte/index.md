# Svelte

These files are separated into 3 main categories: `Dashboards`, `Pages`, and `Components`.

## Dashboards

A dashboard is a single svelte file that contains pages. It is used to create a single page application that can be used to navigate between different pages. Logic here should be kept to exclusively navigation and [stack](../client/stack.md) management.

## Pages

A page is a collection of components. Logic can be a little more complex than in a dashboard, but be careful because it's easy to get lost in the logic. The idea is to keep the logic as simple as possible.

## Components

Component files are the building blocks of the application. They should be as simple as possible. If something can be used in multiple places, it should be a component. This is where the struct svelte-stores should be utilized.

## Related pages

- [Protocols](./protocols.md)
- [Struct](../structs/index.md)
- [Home](../../README.md)
