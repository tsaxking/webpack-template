import ContextMenu from '../views/components/main/Contextmenu.svelte';

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
