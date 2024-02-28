<!-- 
Github @dukenmarga, July 2022
Context Menu is small menu that displayed when user right-click the mouse on browser.
Think of it as a way to show Refresh option on Microsoft Windows when right-click on desktop.
Known bug:
    - If the browser loads the content for the first time, showMenu set to false.
    Hence, we cannot get menu.h and menu.y dimension, since context menu has not been available at DOM.
    The first right click will not shown properly when right-click occurs around the edge (bottom part
    and right part) of the browser.

Inspired from: Context Menu https://svelte.dev/repl/3a33725c3adb4f57b46b597f9dade0c1?version=3.25.0
-->

<script lang="ts">
import { onMount } from 'svelte';
import type { ContextMenuOptions } from '../../../utilities/contextmenu';

// pos is cursor position when right click occur
let pos: { x: number; y: number } = { x: 0, y: 0 };
// menu is dimension (height and width) of context menu
let menu: { h?: number; y?: number; w?: number } = { h: 0, y: 0 };
// browser/window dimension (height and width)
let browser: { h?: number; y?: number; w?: number } = { h: 0, y: 0 };
// showMenu is state of context-menu visibility
export let showMenu: boolean = false;
export let target: HTMLElement;
// to display some text
let content;

onMount(() => {
    // When right-click occur, show context menu
    target.addEventListener('contextmenu', rightClickContextMenu);
    // When mouse is clicked, hide context menu
    window.addEventListener('click', onPageClick);
});

function rightClickContextMenu(e: MouseEvent) {
    e.preventDefault();
    showMenu = true;
    browser = {
        w: window.innerWidth,
        h: window.innerHeight
    };
    pos = {
        x: e.clientX,
        y: e.clientY
    };
    // If bottom part of context menu will be displayed
    // after right-click, then change the position of the
    // context menu. This position is controlled by `top` and `left`
    // at inline style.
    // Instead of context menu is displayed from top left of cursor position
    // when right-click occur, it will be displayed from bottom left.
    if (browser.h - pos.y < menu.h) pos.y = pos.y - menu.h;
    if (browser.w - pos.x < menu.w) pos.x = pos.x - menu.w;
}
function onPageClick(e) {
    // To make context menu disappear when
    // mouse is clicked outside context menu
    showMenu = false;
}
function getContextMenuDimension(node) {
    // This function will get context menu dimension
    // when navigation is shown => showMenu = true
    let height = node.offsetHeight;
    let width = node.offsetWidth;
    menu = {
        h: height,
        w: width
    };
}

export let menuItems: ContextMenuOptions = [];
</script>

{#if showMenu}
    <div
        class="card rounded shadow border-0"
        use:getContextMenuDimension
        style="position: absolute; top:{pos.y}px; left:{pos.x}px"
    >
        <div class="card-body p-1 border-0">
            <ul class="list-group border-0">
                {#each menuItems as item}
                    {#if item === null}
                        <hr class="my-1" />
                    {:else if typeof item === 'string'}
                        <li class="list-group border-0 p-0 w-100">
                            <h6 class="text-center text-muted p2">
                                {item}
                            </h6>
                        </li>
                        <hr class="my-1" />
                    {:else}
                        <li class="list-group-item border-0 p-0 w-100">
                            <button
                                on:click="{item.onClick}"
                                class="border-0 btn btn-dark w-100 text-start"
                                ><i class="{item.class}"
                                ></i>{item.displayText}</button
                            >
                        </li>
                    {/if}
                {/each}
            </ul>
        </div>
    </div>
{/if}
