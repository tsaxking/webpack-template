// these notifications are to replace the default browser notifications
// these use bootstrap modals/toasts to display information to the user
// All confirm/alert/prompt functions return a promise that resolves when the user closes the modal instead of blocking the thread (like the default browser functions)
// toasts by default are placed at the top right of the screen, this is customizable

import { StatusJson } from '../../shared/status';
import Toast from '../views/components/bootstrap/Toast.svelte';
import { capitalize, fromCamelCase, fromSnakeCase } from '../../shared/text';
import { Modal } from './modals';

/**
 * Mounts the toast container to the DOM (not visible)
 * @date 10/12/2023 - 1:14:12 PM
 *
 * @type {*}
 */
const container = (() => {
    const parent = document.createElement('div');
    parent.setAttribute('aria-live', 'polite');
    parent.setAttribute('aria-atomic', 'true');
    parent.classList.add('bg-dark', 'position-relative', 'bd-example-toasts');

    const child = document.createElement('div');
    child.id = 'toast-container';
    child.classList.add('position-absolute', 'top-0', 'end-0', 'p-3');

    return parent;
})();

/**
 * Displays a toast notification to the user
 * @date 10/12/2023 - 1:14:47 PM
 * @param {StatusJson} data The data to display (in the format of a StatusMessage)
 */
export const notify = (data: StatusJson): Promise<void> => {
    return new Promise<void>((res) => {
        const status = capitalize(
            fromSnakeCase(fromCamelCase(data.title), '-'),
        );

        const message = `${status}: ${
            capitalize(
                fromSnakeCase(fromCamelCase(data.$status), '-'),
            )
        }`;

        // if (data.data) {
        //     for (const [key, value] of Object.entries(data.data)) {
        //         message += `\n${key}: ${value}`;
        //     }
        // }

        const t = new Toast({
            target: document.createElement('div'),
            props: {
                title: message,
                message: data.message,
                show: true,
                color: data.color,
                bodyTextColor: (() => {
                    switch (data.color) {
                        case 'warning':
                            return 'dark';
                        case 'info':
                            return 'dark';
                        default:
                            return 'white';
                    }
                })(),
            },
        });

        container
            .querySelector('#toast-container')
            ?.appendChild(t.$$.root.firstChild as Node);

        t.$on('hide.bs.toast', () => {
            res();
            t.$destroy();
        });
    });
};

/**
 * Returns a promise that resolves when the user closes the modal
 * @date 10/12/2023 - 1:17:28 PM
 * @param {string} message The message to display to the user
 * @async
 */
export const alert = async (message: string): Promise<void> => {
    return new Promise<void>((res) => {
        const id = 'alert-' + Math.random().toString(36).substring(2, 9);
        const m = new Modal(id);
        m.setTitle('Alert');
        const p = document.createElement('p');
        p.innerText = message;
        m.setBody(p);

        m.show();
        m.on('hide', () => {
            res();
            m.destroy();
        });
    });
};

/**
 * Returns a promise that resolves when the user closes the modal with a boolean value
 * @date 10/12/2023 - 1:17:50 PM
 *  @param {string} message The prompt to display to the user
 * @returns {Promise<boolean>}
 */
export const confirm = async (message: string): Promise<boolean | null> => {
    return new Promise<boolean | null>((res) => {
        const id = 'alert-' + Math.random().toString(36).substring(2, 9);
        const m = new Modal(id);

        m.setTitle('Confirm');
        m.setBody(message);

        const yes = document.createElement('button');
        const no = document.createElement('button');

        yes.innerText = 'Confirm';
        yes.classList.add('btn', 'btn-primary');
        yes.onclick = () => {
            m.hide();
            res(true);
        };

        no.innerText = 'Cancel';
        no.classList.add('btn', 'btn-secondary');
        no.onclick = () => {
            m.hide();
            res(false);
        };

        const group = document.createElement('div');
        group.classList.add('btn-group');
        group.appendChild(no);
        group.appendChild(yes);

        m.setFooter(group);

        m.show();
        m.on('hide', () => {
            res(null);
            m.destroy();
        });
    });
};

/**
 * Returns a promise that resolves when the user closes the modal with a string value or null if the user cancels
 * @param {string} question The prompt to display to the user
 * @returns {Promise<string|null>}
 */
export const prompt = async (question: string): Promise<string | null> => {
    return new Promise<string | null>((res) => {
        const id = 'alert-' + Math.random().toString(36).substring(2, 9);
        const m = new Modal(id);
        m.setTitle('Prompt');
        m.setBody(question);

        const input = document.createElement('input');
        input.classList.add('form-control', 'mt-3');
        input.type = 'text';
        input.placeholder = 'Enter your response here...';

        const confirm = document.createElement('button');
        const cancel = document.createElement('button');

        confirm.innerText = 'Confirm';
        confirm.classList.add('btn', 'btn-primary');
        confirm.onclick = () => {
            m.hide();
            if (input.value === '') return res(null);
            res(input.value);
        };

        cancel.innerText = 'Cancel';
        cancel.classList.add('btn', 'btn-secondary');
        cancel.onclick = () => {
            m.hide();
            res(null);
        };

        const group = document.createElement('div');
        group.classList.add('btn-group');
        group.appendChild(cancel);
        group.appendChild(confirm);

        m.setFooter(group);

        m.show();
        m.on('hide', () => {
            res(null);
            m.destroy();
        });
    });
};

export const select = async (
    question: string,
    options: string[],
): Promise<number> => {
    return new Promise<number>((res) => {
        const id = 'alert-' + Math.random().toString(36).substring(2, 9);
        const m = new Modal(id);
        m.setTitle('Select');

        const formGroup = document.createElement('div');
        formGroup.classList.add('form-group');
        const label = document.createElement('label');
        label.innerText = question;
        formGroup.appendChild(label);

        const select = document.createElement('select');
        select.classList.add('form-control', 'mt-3');
        const defaultOption = document.createElement('option');
        defaultOption.value = '-1';
        defaultOption.innerText = 'Select an option...';
        select.appendChild(defaultOption);
        formGroup.appendChild(select);

        m.setBody(formGroup);

        options.forEach((option, i) => {
            const o = document.createElement('option');
            o.value = i.toString();
            o.innerText = option;
            select.appendChild(o);
        });

        const confirm = document.createElement('button');
        const cancel = document.createElement('button');

        confirm.innerText = 'Confirm';
        confirm.classList.add('btn', 'btn-primary');
        confirm.onclick = () => {
            m.hide();
            res(parseInt(select.value));
        };

        cancel.innerText = 'Cancel';
        cancel.classList.add('btn', 'btn-secondary');
        cancel.onclick = () => {
            m.hide();
            res(-1);
        };

        const group = document.createElement('div');
        group.classList.add('btn-group');
        group.appendChild(cancel);
        group.appendChild(confirm);

        m.setFooter(group);

        m.show();
        m.on('hide', () => {
            res(-1);
            m.destroy();
        });
    });
};

export const choose = async <A extends string, B extends string>(
    question: string,
    option1: A,
    option2: B,
): Promise<null | A | B> => {
    return new Promise<null | A | B>((res) => {
        const id = 'alert-' + Math.random().toString(36).substring(2, 9);
        const m = new Modal(id);
        m.setTitle('Choose');

        m.setBody(question);

        const a = document.createElement('button');
        const b = document.createElement('button');
        const cancel = document.createElement('button');

        a.innerText = option1;
        a.classList.add('btn', 'btn-primary');
        a.onclick = () => {
            m.hide();
            res(option1);
        };

        b.innerText = option2;
        b.classList.add('btn', 'btn-primary');
        b.onclick = () => {
            m.hide();
            res(option2);
        };

        cancel.innerText = 'Cancel';
        cancel.classList.add('btn', 'btn-secondary');
        cancel.onclick = () => {
            m.hide();
            res(null);
        };

        const group = document.createElement('div');
        group.classList.add('btn-group');
        group.appendChild(cancel);
        group.appendChild(a);
        group.appendChild(b);

        m.setFooter(group);

        m.show();
        m.on('hide', () => {
            res(null);
            m.destroy();
        });
    });
};
