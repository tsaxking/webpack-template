import { EventEmitter } from '../../shared/event-emitter';

/**
 * Opens a modal with the given id
 * @param {string} modalId
 * @returns
 */
export const openModal = (modalId: string) => $(`#${modalId}`).modal('show');
/**
 * Closes a modal with the given id
 * @param {string} modalId
 * @returns
 */
export const closeModal = (modalId: string) => $(`#${modalId}`).modal('hide');
/**
 * Closes all modals accessible by the user
 * @date 10/12/2023 - 1:11:44 PM
 */
export const closeAllModals = () => $('.modal').modal('hide');

type EventTypes = {
    show: void;
    hide: void;
    destory: void;
};

export class Modal {
    private readonly $emitter = new EventEmitter<keyof EventTypes>();

    public on<K extends keyof EventTypes>(
        event: K,
        listener: (args: EventTypes[K]) => void,
    ) {
        this.$emitter.on(event, listener);
    }

    public off<K extends keyof EventTypes>(
        event: K,
        listener: (args: EventTypes[K]) => void,
    ) {
        this.$emitter.off(event, listener);
    }

    public emit<K extends keyof EventTypes>(event: K, args?: EventTypes[K]) {
        this.$emitter.emit(event, args);
    }

    private readonly $el = document.createElement('div');

    constructor(private readonly modalId: string) {
        this.render();

        this.on('show', () => {
            $(this.$el).modal('show');
        });

        this.on('hide', () => {
            $(this.$el).modal('hide');
        });
    }

    private render() {
        const modal = this.$el;
        modal.id = this.modalId;
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.add('modal', 'fade');

        const dialog = document.createElement('div');
        dialog.classList.add('modal-dialog');

        const content = document.createElement('div');
        content.classList.add('modal-content');

        const header = document.createElement('div');
        header.classList.add('modal-header');
        const title = document.createElement('h5');
        title.classList.add('modal-title');

        const close = document.createElement('button');
        close.type = 'button';
        close.classList.add('close');
        close.setAttribute('data-dismiss', 'modal');
        close.setAttribute('aria-label', 'Close');
        $(close).on('click', () => this.hide());

        const body = document.createElement('div');
        body.classList.add('modal-body');

        const footer = document.createElement('div');
        footer.classList.add('modal-footer');

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.classList.add('btn', 'btn-secondary');
        closeButton.textContent = 'Close';
        $(closeButton).on('click', () => this.hide());

        footer.appendChild(closeButton);
        header.appendChild(title);
        header.appendChild(close);
        content.appendChild(header);
        content.appendChild(body);
        content.appendChild(footer);
        dialog.appendChild(content);
        modal.appendChild(dialog);
    }

    setTitle(title: string | HTMLElement) {
        const header = this.$el.querySelector('.modal-header');
        if (!header) return;
        const titleEl = header.querySelector('.modal-title');
        if (!titleEl) return;
        titleEl.innerHTML = '';
        if (typeof title === 'string') {
            titleEl.textContent = title;
        } else {
            titleEl.appendChild(title);
        }
    }

    setBody(body: string | HTMLElement) {
        const content = this.$el.querySelector('.modal-content');
        if (!content) return;
        const bodyEl = content.querySelector('.modal-body');
        if (!bodyEl) return;
        bodyEl.innerHTML = '';
        if (typeof body === 'string') {
            bodyEl.textContent = body;
        } else {
            bodyEl.appendChild(body);
        }
    }

    setFooter(footer: string | HTMLElement) {
        const content = this.$el.querySelector('.modal-content');
        if (!content) return;
        const footerEl = content.querySelector('.modal-footer');
        if (!footerEl) return;
        footerEl.innerHTML = '';
        if (typeof footer === 'string') {
            footerEl.textContent = footer;
        } else {
            footerEl.appendChild(footer);
        }
    }

    public show() {
        this.emit('show');
    }

    public hide() {
        this.emit('hide');
    }

    public destroy() {
        this.emit('destory');
        $(`#${this.modalId}`).remove();
    }
}
