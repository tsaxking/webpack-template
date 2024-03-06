// these notifications are to replace the default browser notifications
// these use bootstrap modals/toasts to display information to the user
// All confirm/alert/prompt functions return a promise that resolves when the user closes the modal instead of blocking the thread (like the default browser functions)
// toasts by default are placed at the top right of the screen, this is customizable

import { capitalize, fromCamelCase, fromSnakeCase } from '../../shared/text';
import { Alert, Modal, Toast } from './modals';
import { Color } from './modals';
import { sleep } from '../../shared/sleep';

/**
 * Displays a toast notification to the user
 * @date 10/12/2023 - 1:14:47 PM
 * @param {StatusJson} data The data to display (in the format of a StatusMessage)
 */
export const notify = <T extends 'toast' | 'alert'>(
    data: {
        title: string;
        status: string;
        message: string;
        color: Color;
    },
    type: T
): Toast | Alert => {
    const status = capitalize(fromSnakeCase(fromCamelCase(data.title), '-'));

    const title = `${status}: ${capitalize(
        fromSnakeCase(fromCamelCase(data.status), '-')
    )}`;
    console.log(data);

    const setAnimation = async (target: Alert | Toast) => {
        target.on('hide', () => {
            target.target.classList.add(
                'animate__animated',
                'animate__fadeOutUp',
                'animate__faster'
            );
            const onEnd = () => {
                target.target.removeEventListener('animationend', onEnd);
                target.target.remove();
            };

            target.target.addEventListener('animationend', onEnd);
        });

        await sleep(5000);
        target.hide();
    };

    if (type === 'toast') {
        const toast = new Toast(title, data.message, data.color);

        setAnimation(toast);

        toast.show();

        return toast;
    } else {
        const alert = new Alert(title, data.message, data.color);

        setAnimation(alert);

        alert.show();
        return alert;
    }
};

/**
 * Returns a promise that resolves when the user closes the modal
 * @date 10/12/2023 - 1:17:28 PM
 * @param {string} message The message to display to the user
 * @async
 */
export const alert = async (message: string): Promise<void> => {
    return new Promise<void>(res => {
        const m = new Modal();
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
    return new Promise<boolean | null>(res => {
        let resolved = false;
        const doRes = (val: boolean | null) => {
            if (resolved) return;
            resolved = true;
            res(val);
            m.hide();
        };
        const m = new Modal();

        m.setTitle('Confirm');
        m.setBody(message);

        const yes = document.createElement('button');
        const no = document.createElement('button');

        yes.innerText = 'Confirm';
        yes.classList.add('btn', 'btn-primary');
        yes.onclick = () => {
            doRes(true);
        };

        no.innerText = 'Cancel';
        no.classList.add('btn', 'btn-secondary');
        no.onclick = () => {
            doRes(false);
        };

        const group = document.createElement('div');
        group.classList.add('btn-group');
        group.appendChild(no);
        group.appendChild(yes);

        m.setFooter(group);

        m.show();
        m.on('hide', () => {
            doRes(null);
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
    return new Promise<string | null>(res => {
        let resolved = false;
        const doRes = (val: string | null) => {
            if (resolved) return;
            resolved = true;
            res(val);
        };
        const m = new Modal();
        m.setTitle('Prompt');

        const formGroup = document.createElement('div');
        formGroup.classList.add('form-group');

        const label = document.createElement('label');
        label.innerText = question;
        formGroup.append(label);

        const input = document.createElement('input');
        input.classList.add('form-control', 'mt-3');
        input.type = 'text';
        input.placeholder = 'Enter your response here...';
        formGroup.appendChild(input);

        m.setBody(formGroup);

        const confirm = document.createElement('button');
        const cancel = document.createElement('button');

        confirm.innerText = 'Confirm';
        confirm.classList.add('btn', 'btn-primary');
        confirm.onclick = () => {
            if (input.value === '') doRes(null);
            else doRes(input.value);
            m.hide();
        };

        cancel.innerText = 'Cancel';
        cancel.classList.add('btn', 'btn-secondary');
        cancel.onclick = () => {
            doRes(null);
            m.hide();
        };

        const group = document.createElement('div');
        group.classList.add('btn-group');
        group.appendChild(cancel);
        group.appendChild(confirm);

        m.setFooter(group);

        m.show();
        m.on('hide', () => {
            doRes(null);
            m.destroy();
        });
    });
};

export const select = async (
    question: string,
    options: string[]
): Promise<number> => {
    return new Promise<number>(res => {
        let resolved = false;
        const doRes = (val: number) => {
            if (resolved) return;
            resolved = true;
            res(val);
        };

        const m = new Modal();
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
            doRes(parseInt(select.value));
            m.hide();
        };

        cancel.innerText = 'Cancel';
        cancel.classList.add('btn', 'btn-secondary');
        cancel.onclick = () => {
            doRes(-1);
            m.hide();
        };

        const group = document.createElement('div');
        group.classList.add('btn-group');
        group.appendChild(cancel);
        group.appendChild(confirm);

        m.setFooter(group);

        m.show();
        m.on('hide', () => {
            doRes(-1);
            m.destroy();
        });
    });
};

export const choose = async <A extends string, B extends string>(
    question: string,
    option1: A,
    option2: B
): Promise<null | A | B> => {
    return new Promise<null | A | B>(res => {
        let resolved = false;
        const doRes = (val: null | A | B) => {
            if (resolved) return;
            resolved = true;
            res(val);
            m.hide();
        };

        const m = new Modal();
        m.setTitle('Choose');

        m.setBody(question);

        const a = document.createElement('button');
        const b = document.createElement('button');
        const cancel = document.createElement('button');

        a.innerText = option1;
        a.classList.add('btn', 'btn-primary');
        a.onclick = () => {
            doRes(option1);
        };

        b.innerText = option2;
        b.classList.add('btn', 'btn-primary');
        b.onclick = () => {
            doRes(option2);
        };

        cancel.innerText = 'Cancel';
        cancel.classList.add('btn', 'btn-secondary');
        cancel.onclick = () => {
            doRes(null);
        };

        const group = document.createElement('div');
        group.classList.add('btn-group');
        group.appendChild(cancel);
        group.appendChild(a);
        group.appendChild(b);

        m.setFooter(group);

        m.show();
        m.on('hide', () => {
            doRes(null);
            m.destroy();
        });
    });
};
