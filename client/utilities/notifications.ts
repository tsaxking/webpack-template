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
export const confirm = async (message: string): Promise<boolean> => {
    return new Promise<boolean>((res) => {
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

        $(modal).modal('show');
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

        $(modal).modal('show');
    });
};
