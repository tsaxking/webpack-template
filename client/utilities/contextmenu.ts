import ContextMenu from '../views/components/main/Contextmenu.svelte';

/**
 * Options for the context menu
 * @date 3/8/2024 - 6:59:48 AM
 *
 * @export
 * @typedef {ContextMenuOptions}
 */
export type ContextMenuOptions = (
    | {
          name: string;
          onClick: (e: MouseEvent) => void;
          displayText: string;
          class: string;
      }
    | null
    | string
)[];

/**
 * Adds a context menu to the target
 * @date 3/8/2024 - 6:59:48 AM
 *
 * @param {ContextMenuOptions} options
 * @param {HTMLElement} target
 */
export const contextmenu = (
    options: ContextMenuOptions,
    target: HTMLElement
) => {
    console.log('contextmenu', options, target);
    new ContextMenu({
        target: document.body,
        props: {
            menuItems: options,
            showMenu: false,
            target
        }
    });
};
