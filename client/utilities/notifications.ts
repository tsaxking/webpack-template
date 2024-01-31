// these notifications are to replace the default browser notifications
// these use bootstrap modals/toasts to display information to the user
// All confirm/alert/prompt functions return a promise that resolves when the user closes the modal instead of blocking the thread (like the default browser functions)
// toasts by default are placed at the top right of the screen, this is customizable

import { StatusJson } from '../../shared/status';
import ToastContainer from '../views/components/bootstrap/ToastContainer.svelte';
import Toast from '../views/components/bootstrap/Toast.svelte';
import { capitalize, fromCamelCase, fromSnakeCase } from '../../shared/text';
import Modal from '../views/components/bootstrap/Modal.svelte';
import Button from '../views/components/bootstrap/Button.svelte';

/**
 * Mounts the toast container to the DOM (not visible)
 * @date 10/12/2023 - 1:14:12 PM
 *
 * @type {*}
 */
const container = new ToastContainer({
    target: document.body.querySelector('main') || document.body,
});

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

        container.$$.root
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
        const m = new Modal({
            target: document.body,
            props: {
                title: 'Alert',
                message,
                id,
            },
        });

        const modal = m.$$.root.querySelector('#' + id) as Node;

        m.$on('close', () => {
            $(modal).modal('hide');
        });

        m.$on('hide', () => {
            $(modal).modal('hide');
        });

        $(modal).modal('show');

        $(modal).on('hidden.bs.modal', () => {
            m.$destroy();
            res();
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
        const m = new Modal({
            target: document.body,
            props: {
                title: 'Confirm',
                message: message,
                id,
            },
        });

        const modal = m.$$.root.querySelector('#' + id) as HTMLElement;

        const button = new Button({
            target: modal.querySelector('.modal-footer') as HTMLElement,
            props: {
                text: 'Confirm',
                color: 'primary',
            },
        });

        button.$$.root
            .querySelector('button.btn-primary')
            ?.addEventListener('click', () => {
                $(modal).modal('hide');
                res(true);
            });

        m.$on('close', () => {
            $(modal).modal('hide');
            res(false);
        });

        m.$on('hide', () => {
            $(modal).modal('hide');
            res(null);
        });

        $(modal).modal('show');

        $(modal).on('hidden.bs.modal', () => {
            m.$destroy();
            res(null);
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
        const m = new Modal({
            target: document.body,
            props: {
                title: 'Prompt',
                message: question,
                id,
            },
        });

        const modal = m.$$.root.querySelector('#' + id) as HTMLElement;

        const input = document.createElement('input');
        input.classList.add('form-control', 'mt-3');
        input.type = 'text';
        input.placeholder = 'Enter your response here...';
        modal.querySelector('.modal-body')?.appendChild(input);

        const button = new Button({
            target: modal.querySelector('.modal-footer') as HTMLElement,
            props: {
                text: 'Confirm',
                color: 'primary',
            },
        });

        const submit = () => {
            $(modal).modal('hide');
            if (input.value === '') return res(null);
            res(input.value);
        };

        input.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Enter':
                    return submit();
                case 'Escape':
                    return res(null);
            }
        });

        button.$$.root
            .querySelector('button.btn-primary')
            ?.addEventListener('click', submit);

        m.$on('close', () => {
            $(modal).modal('hide');
            res(null);
        });

        m.$on('hide', () => {
            $(modal).modal('hide');
            res(null);
        });

        $(modal).modal('show');

        $(modal).on('hidden.bs.modal', () => {
            m.$destroy();
            res(null);
        });
    });
};

export const select = async (
    question: string,
    options: string[],
): Promise<number> => {
    return new Promise<number>((res) => {
        const id = 'alert-' + Math.random().toString(36).substring(2, 9);
        const m = new Modal({
            target: document.body,
            props: {
                title: 'Choose',
                message: question,
                id,
            },
        });

        const modal = m.$$.root.querySelector('#' + id) as HTMLElement;

        const select = document.createElement('select');
        select.classList.add('form-control', 'mt-3');
        const defaultOption = document.createElement('option');
        defaultOption.value = '-1';
        defaultOption.innerText = 'Select an option...';
        select.appendChild(defaultOption);
        modal.querySelector('.modal-body')?.appendChild(select);

        options.forEach((option, i) => {
            const o = document.createElement('option');
            o.value = i.toString();
            o.innerText = option;
            select.appendChild(o);
        });

        const submitButton = new Button({
            target: modal.querySelector('.modal-footer') as HTMLElement,
            props: {
                text: 'Confirm',
                color: 'primary',
            },
        });

        const submit = () => {
            $(modal).modal('hide');
            res(parseInt(select.value));
        };

        select.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Enter':
                    return submit();
                case 'Escape':
                    return res(-1);
            }
        });

        submitButton.$$.root
            .querySelector('button.btn-primary')
            ?.addEventListener('click', submit);

        m.$on('close', () => {
            $(modal).modal('hide');
            res(-1);
        });

        m.$on('hide', () => {
            $(modal).modal('hide');
            res(-1);
        });

        $(modal).on('hidden.bs.modal', () => {
            m.$destroy();
            res(-1);
        });

        $(modal).modal('show');
    });
};

export const choose = async <A extends string, B extends string>(
    question: string,
    option1: A,
    option2: B,
): Promise<null | A | B> => {
    return new Promise<null | A | B>((res) => {
        const id = 'alert-' + Math.random().toString(36).substring(2, 9);
        const m = new Modal({
            target: document.body,
            props: {
                title: 'Choose',
                message: question,
                id,
            },
        });

        const modal = m.$$.root.querySelector('#' + id) as HTMLElement;

        const submit = (i: null | A | B) => {
            $(modal).modal('hide');
            res(i);
        };

        const createButton = (text: string, value: null | A | B) => {
            const b = document.createElement('button');
            b.innerText = text;
            b.classList.add('btn', 'btn-primary');
            b.onclick = () => submit(value);
            modal.querySelector('.modal-footer')?.appendChild(b);

            return b;
        };

        createButton(option1, option1);
        createButton(option2, option2);

        m.$on('hide', () => submit(null));

        m.$on('close', () => submit(null));

        $(modal).on('hidden.bs.modal', () => {
            m.$destroy();
            res(null);
        });

        $(modal).modal('show');
    });
};
