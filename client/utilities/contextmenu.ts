/**
 * Options for the context menu
 * @date 3/8/2024 - 6:59:48 AM
 *
 * @export
 * @typedef {ContextMenuOptions}
 */
export type ContextMenuOptions = (
    | {
          action: (e: MouseEvent) => void;
          name: string;
          //   class: string;
      }
    | null
    | string
)[];

const rightClickContextMenu = (e: MouseEvent, el: HTMLDivElement) => {
    e.preventDefault();
    const browser = {
        h: window.innerHeight,
        w: window.innerWidth
    };

    const pos = {
        x: e.clientX,
        y: e.clientY
    };

    const { width, height } = el.getBoundingClientRect();

    return {
        x: pos.x + width > browser.w ? pos.x - width : pos.x,
        y: pos.y + height > browser.h ? pos.y - height : pos.y
    };
};

/**
 * Adds a context menu to the target
 * @date 3/8/2024 - 6:59:48 AM
 *
 * @param {ContextMenuOptions} options
 * @param {HTMLElement} target
 */
export const contextmenu = (
    target: HTMLElement,
    options: ContextMenuOptions
) => {
    const el = create('div');
    el.classList.add('shadow', 'border-0', 'contextmenu', 'rounded');
    el.style.position = 'fixed';
    el.style.zIndex = '1000';
    const body = create('div');
    body.classList.add('card-body', 'p-0', 'border-0', 'rounded');
    el.appendChild(body);
    const list = create('ul');
    list.classList.add('list-group', 'list-group-flush', 'border-0', 'p-0');
    body.appendChild(list);
    for (const o of options) {
        const li = create('li');
        li.classList.add('list-group-item', 'border-0', 'p-0', 'm-0');

        if (o === null) {
            const hr = create('hr');
            hr.classList.add('dropdown-divider', 'bg-secondary');
            hr.style.height = '1px';
            hr.style.width = '100%';
            list.appendChild(hr);
        } else if (typeof o === 'string') {
            const p = create('p');
            p.classList.add('text-muted', 'p-2', 'm-0');
            p.textContent = o;
            li.appendChild(p);
            list.appendChild(li);
        } else {
            const button = create('button');
            button.classList.add(
                'btn',
                'btn-dark',
                'border-0',
                'text-start',
                'w-100',
                'p-2',
                'rounded-0'
            );
            // const i = create('i');
            // i.classList.add(...o.class.split(' '), 'me-2');
            // button.appendChild(i);
            const span = create('span');
            span.textContent = o.name;
            button.appendChild(span);
            button.addEventListener('click', o.action);
            li.appendChild(button);
            list.appendChild(li);
        }
    }

    const fn = (e: MouseEvent) => {
        for (const cm of findAll('.contextmenu')) {
            cm.remove();
        }

        e.preventDefault();
        const pos = rightClickContextMenu(e, el);
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;
        el.style.zIndex = '9000';
        document.body.appendChild(el);
        // target.removeEventListener('contextmenu', fn);

        const rm = () => {
            el.remove();
            document.removeEventListener('click', rm);
        };

        document.addEventListener('click', rm);
    };

    target.addEventListener('contextmenu', fn);

    return () => {
        target.removeEventListener('contextmenu', fn);
    };
};
