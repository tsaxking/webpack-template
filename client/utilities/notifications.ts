import { StatusJson } from "../../shared/status";
import ToastContainer from '../views/components/bootstrap/ToastContainer.svelte';
import Toast from "../views/components/bootstrap/Toast.svelte";
import { fromCamelCase, capitalize } from "../../shared/text";
import Modal from "../views/components/bootstrap/Modal.svelte";
import Button from "../views/components/bootstrap/Button.svelte";


const container = new ToastContainer({
    target: document.body.querySelector('main') || document.body
});



export const notify = (data: StatusJson) => {
    const status = capitalize(fromCamelCase(data.title));

    let message = `${status}: ${data.message}`;

    if(data.data) {
        for (const [key, value] of Object.entries(data.data)) {
            message += `\n${key}: ${value}`;
        }
    }

    const t = new Toast({
        target: document.createElement('div'),
        props: {
            title: status,
            message: data.message,
            show: true,
            color: 'danger',
            bodyTextColor: 'white'
        }
    });

    container.$$.root.querySelector('#toast-container')?.appendChild(t.$$.root.firstChild as Node);

    t.$on('hide.bs.toast', () => {
        console.log('hide');
        t.$destroy();
    });
}



export const alert = async (message: string): Promise<void> => {
    return new Promise<void>((res, rej) => {
        const id = 'alert-' + Math.random().toString(36).substring(2, 9);
        const m = new Modal({
            target: document.body,
            props: {
                title: 'Alert',
                message,
                id
            }
        });

        const modal = m.$$.root.querySelector('#' + id) as Node;

        m.$on('close', () => {
            $(modal).modal('hide');
        });

        $(modal).modal();

        $(modal).on('hidden.bs.modal', () => {
            m.$destroy();
            res();
        });
    });
};

export const confirm = async (prompt: string): Promise<boolean> => {
    return new Promise<boolean>((res, rej) => {
        const id = 'alert-' + Math.random().toString(36).substring(2, 9);
        const m = new Modal({
            target: document.body,
            props: {
                title: 'Confirm',
                message: prompt,
                id
            }
        });

        const modal = m.$$.root.querySelector('#' + id) as HTMLElement;

        const button = new Button({
            target: modal.querySelector('.modal-footer') as HTMLElement,
            props: {
                text: 'Confirm',
                color: 'primary'
            }
        });

        button.$$.root.querySelector('button.btn-primary')?.addEventListener('click', () => {
            $(modal).modal('hide');
            res(true);
        });

        m.$on('close', () => {
            $(modal).modal('hide');
            res(false);
        });

        $(modal).modal();
    });
};

export const prompt = async (question: string): Promise<string|null> => {
    return new Promise<string|null>((res, rej) => {
        const id = 'alert-' + Math.random().toString(36).substring(2, 9);
        const m = new Modal({
            target: document.body,
            props: {
                title: 'Prompt',
                message: question,
                id
            }
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
                color: 'primary'
            }
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

        button.$$.root.querySelector('button.btn-primary')?.addEventListener('click', submit);

        m.$on('close', () => {
            $(modal).modal('hide');
            res(null);
        });

        $(modal).modal();
    });
};