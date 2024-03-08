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

/**
 * All notification event types
 * @date 3/8/2024 - 7:09:49 AM
 *
 * @typedef {EventTypes}
 */
type EventTypes = {
    show: void;
    hide: void;
    destroy: void;
};

/**
 * Modal class
 * @date 3/8/2024 - 7:09:49 AM
 *
 * @export
 * @class Modal
 * @typedef {Modal}
 */
export class Modal {
    /**
     * Event emitter
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @private
     * @readonly
     * @type {*}
     */
    private readonly em = new EventEmitter<keyof EventTypes>();

    /**
     * Adds an event listener to the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @public
     * @template {keyof EventTypes} K
     * @param {K} event
     * @param {(args: EventTypes[K]) => void} listener
     * @returns {void) => void}
     */
    public on<K extends keyof EventTypes>(
        event: K,
        listener: (args: EventTypes[K]) => void
    ) {
        this.em.on(event, listener);
    }

    /**
     * Removes an event listener from the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @public
     * @template {keyof EventTypes} K
     * @param {K} event
     * @param {(args: EventTypes[K]) => void} listener
     * @returns {void) => void}
     */
    public off<K extends keyof EventTypes>(
        event: K,
        listener: (args: EventTypes[K]) => void
    ) {
        this.em.off(event, listener);
    }

    /**
     * Emits an event from the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @public
     * @template {keyof EventTypes} K
     * @param {K} event
     * @param {?EventTypes[K]} [args]
     */
    public emit<K extends keyof EventTypes>(event: K, args?: EventTypes[K]) {
        this.em.emit(event, args);
    }

    /**
     * Target element
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @readonly
     * @type {*}
     */
    readonly target = document.createElement('div');
    /**
     * Modal id
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @readonly
     * @type {string}
     */
    readonly id: string;

    /**
     * Modal size
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @private
     * @type {('sm' | 'lg' | 'xl' | 'xxl' | 'auto')}
     */
    private $size: 'sm' | 'lg' | 'xl' | 'xxl' | 'auto' = 'auto';

    /**
     * Creates an instance of Modal.
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @constructor
     * @param {?string} [id]
     */
    constructor(id?: string) {
        this.id = id || `modal-${Math.random().toString(36).substr(2, 9)}`;
        this.render();

        this.on('show', () => {
            $(this.target).modal('show');
        });

        this.on('hide', () => {
            $(this.target).modal('hide');
        });
    }

    /**
     * Sets the size of the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @type {("sm" | "lg" | "xl" | "xxl" | "auto")}
     */
    set size(size: 'sm' | 'lg' | 'xl' | 'xxl' | 'auto') {
        this.target
            .querySelector('.modal-dialog')
            ?.classList.remove(`modal-${this.$size}`);
        this.$size = size;
        this.target
            .querySelector('.modal-dialog')
            ?.classList.add(`modal-${size}`);
    }

    /**
     * Gets the size of the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @type {("sm" | "lg" | "xl" | "xxl" | "auto")}
     */
    get size() {
        return this.$size;
    }

    /**
     * Renders the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @private
     */
    private render() {
        const modal = this.target;
        modal.id = this.id;
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
        close.classList.add('btn-close');
        // close.innerHTML = `<i class="material-icons">close</i>`;
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

        this.size = 'auto';
    }

    /**
     * Adds a button to the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @param {HTMLButtonElement} button
     */
    addButton(button: HTMLButtonElement) {
        const footer = this.target.querySelector('.modal-footer');
        if (!footer) return; // should never happen
        footer.appendChild(button);
    }

    /**
     * Sets the title of the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @param {(string | HTMLElement)} title
     */
    setTitle(title: string | HTMLElement) {
        const header = this.target.querySelector('.modal-header');
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

    /**
     * Sets the body of the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @param {(string | HTMLElement)} body
     */
    setBody(body: string | HTMLElement) {
        const content = this.target.querySelector('.modal-content');
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

    /**
     * Sets the footer of the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @param {(string | HTMLElement)} footer
     */
    setFooter(footer: string | HTMLElement) {
        const content = this.target.querySelector('.modal-content');
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

    /**
     * Shows the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @public
     */
    public show() {
        this.emit('show');
    }

    /**
     * Hides the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @public
     */
    public hide() {
        this.emit('hide');
    }

    /**
     * Destroys the modal
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @public
     */
    public destroy() {
        this.emit('destroy');
        $(`#${this.id}`).remove();
        $('.modal-backdrop').remove();
    }
}

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
    child.classList.add(
        'position-absolute',
        'top-0',
        'end-0',
        'w-100',
        'h-100'
    );
    parent.appendChild(child);

    const mount = () => {
        const main = document.querySelector('main');
        if (!main) return;
        // append to the beginning of the main element
        main.insertBefore(parent, main.firstChild);
        clearInterval(int);
    };

    const int = setInterval(mount, 10);

    return parent;
})();

/**
 * Bootstrap toast colors
 * @date 3/8/2024 - 7:09:49 AM
 *
 * @export
 * @typedef {Color}
 */
export type Color =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark';

/**
 * Toast class
 * @date 3/8/2024 - 7:09:49 AM
 *
 * @export
 * @class Toast
 * @typedef {Toast}
 */
export class Toast {
    /**
     * Target element
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @readonly
     * @type {*}
     */
    readonly target = document.createElement('div');

    /**
     * Event emitter
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @private
     * @readonly
     * @type {*}
     */
    private readonly em = new EventEmitter<keyof EventTypes>();

    /**
     * Adds an event listener to the toast
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @public
     * @template {keyof EventTypes} K
     * @param {K} event
     * @param {(args: EventTypes[K]) => void} listener
     * @returns {void) => void}
     */
    public on<K extends keyof EventTypes>(
        event: K,
        listener: (args: EventTypes[K]) => void
    ) {
        this.em.on(event, listener);
    }

    /**
     * Removes an event listener from the toast
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @public
     * @template {keyof EventTypes} K
     * @param {K} event
     * @param {(args: EventTypes[K]) => void} listener
     * @returns {void) => void}
     */
    public off<K extends keyof EventTypes>(
        event: K,
        listener: (args: EventTypes[K]) => void
    ) {
        this.em.off(event, listener);
    }

    /**
     * Emits an event from the toast
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @public
     * @template {keyof EventTypes} K
     * @param {K} event
     * @param {?EventTypes[K]} [args]
     */
    public emit<K extends keyof EventTypes>(event: K, args?: EventTypes[K]) {
        this.em.emit(event, args);
    }

    /**
     * Toast title
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @private
     * @type {string}
     */
    private $title: string;
    /**
     * Toast body
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @private
     * @type {string}
     */
    private $body: string;
    /**
     * Toast color
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @private
     * @type {Color}
     */
    private $color: Color;

    /**
     * Creates an instance of Toast.
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @constructor
     * @param {string} title
     * @param {string} body
     * @param {Color} [color='success']
     */
    constructor(title: string, body: string, color: Color = 'success') {
        this.on('show', () => {
            $(this.target).toast('show');
        });

        this.target.classList.add('notification');

        container.appendChild(this.target);
        this.$title = title;
        this.$body = body;
        this.$color = color;
        this.render();
    }

    /**
     * Sets the title of the toast
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @type {string}
     */
    set title(title: string) {
        this.$title = title;
        this.target.querySelector('strong')!.textContent = title;
    }

    /**
     * Gets the title of the toast
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @type {string}
     */
    get title() {
        return this.$title;
    }

    /**
     * Sets the body of the toast
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @type {string}
     */
    set body(body: string) {
        this.$body = body;
        this.target.querySelector('toast-body')!.textContent = body;
    }

    /**
     * Gets the body of the toast
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @type {string}
     */
    get body() {
        return this.$body;
    }

    /**
     * Sets the color of the toast
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @type {Color}
     */
    set color(color: Color) {
        this.target
            .querySelector('toast-header')
            ?.classList.remove(`text-${this.color}`);
        this.target
            .querySelector('toast-header')
            ?.classList.add(`text-${color}`);
        this.target
            .querySelector('toast-body')
            ?.classList.remove(`bg-${this.color}`);
        this.target.querySelector('toast-body')?.classList.add(`bg-${color}`);
        this.target
            .querySelector('toast-body')
            ?.classList.remove(`text-${this.textColor}`);
        this.$color = color;
        this.target
            .querySelector('toast-body')
            ?.classList.add(`text-${this.textColor}`);
    }

    /**
     * Returns the color of the toast
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @type {Color}
     */
    get color() {
        return this.$color;
    }

    /**
     * The text color of the toast
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @readonly
     * @type {('light' | 'dark')}
     */
    get textColor(): 'light' | 'dark' {
        switch (this.$color) {
            case 'danger':
            case 'primary':
            case 'success':
            case 'info':
            case 'dark':
            case 'secondary':
                return 'light';
            case 'warning':
            case 'light':
                return 'dark';
            default:
                return 'light';
        }
    }

    /**
     * Renders the toast
     * @date 3/8/2024 - 7:09:49 AM
     *
     * @private
     */
    private render() {
        this.target.classList.add(
            'toast'
            // 'position-absolute'
        );
        this.target.setAttribute('role', 'alert');
        this.target.setAttribute('aria-live', 'assertive');
        this.target.setAttribute('aria-atomic', 'true');

        const header = document.createElement('div');
        header.classList.add(
            'toast-header',
            'bg-dark',
            'border-0',
            `text-${this.color}`
        );

        const strong = document.createElement('strong');
        strong.classList.add('me-auto');
        strong.textContent = this.$title;

        const time = document.createElement('small');
        time.textContent = 'Just now';
        const start = Date.now();
        setInterval(() => {
            const now = Date.now();
            const diff = now - start;
            const seconds = Math.floor(diff / 1000);

            if (seconds < 60) {
                time.textContent = `${seconds} seconds ago`;
            } else if (seconds < 3600) {
                const minutes = Math.floor(seconds / 60);
                time.textContent = `${minutes} minutes ago`;
            } else if (seconds < 86400) {
                const hours = Math.floor(seconds / 3600);
                time.textContent = `${hours} hours ago`;
            } else {
                const days = Math.floor(seconds / 86400);
                time.textContent = `${days} days ago`;
            }
        }, 1000 * 30);

        const button = document.createElement('button');
        button.setAttribute('type', 'button');
        button.classList.add('btn-close', 'btn-close-white');
        button.setAttribute('aria-label', 'Close');
        button.dataset.bsDismiss = 'toast';
        $(button).on('click', () => this.hide());

        const body = document.createElement('div');
        body.classList.add(
            'toast-body',
            `bg-${this.$color}`,
            `text-${this.textColor}`
        );
        body.textContent = this.$body;

        header.appendChild(strong);
        header.appendChild(time);
        header.appendChild(button);
        this.target.appendChild(header);
        this.target.appendChild(body);

        container.firstChild?.appendChild(this.target);

        this.show();
    }

    /**
     * Shows the toast
     * @date 3/8/2024 - 7:09:49 AM
     */
    show() {
        this.emit('show');
    }

    /**
     * Hides the toast
     * @date 3/8/2024 - 7:09:49 AM
     */
    hide() {
        this.emit('hide');
    }

    /**
     * Destroys the toast
     * @date 3/8/2024 - 7:09:49 AM
     */
    destroy() {
        this.emit('destroy');
    }
}

/**
 * Alert class
 * @date 3/8/2024 - 7:09:48 AM
 *
 * @export
 * @class Alert
 * @typedef {Alert}
 */
export class Alert {
    /**
     * Target element
     * @date 3/8/2024 - 7:09:48 AM
     *
     * @readonly
     * @type {*}
     */
    readonly target = document.createElement('div');

    /**
     * Event emitter
     * @date 3/8/2024 - 7:09:48 AM
     *
     * @private
     * @readonly
     * @type {*}
     */
    private readonly em = new EventEmitter<keyof EventTypes>();

    /**
     * Adds an event listener to the alert
     * @date 3/8/2024 - 7:09:48 AM
     *
     * @public
     * @template {keyof EventTypes} K
     * @param {K} event
     * @param {(args: EventTypes[K]) => void} listener
     * @returns {void) => void}
     */
    public on<K extends keyof EventTypes>(
        event: K,
        listener: (args: EventTypes[K]) => void
    ) {
        this.em.on(event, listener);
    }

    /**
     * Removes an event listener from the alert
     * @date 3/8/2024 - 7:09:48 AM
     *
     * @public
     * @template {keyof EventTypes} K
     * @param {K} event
     * @param {(args: EventTypes[K]) => void} listener
     * @returns {void) => void}
     */
    public off<K extends keyof EventTypes>(
        event: K,
        listener: (args: EventTypes[K]) => void
    ) {
        this.em.off(event, listener);
    }

    /**
     * Emits an event from the alert
     * @date 3/8/2024 - 7:09:48 AM
     *
     * @public
     * @template {keyof EventTypes} K
     * @param {K} event
     * @param {?EventTypes[K]} [args]
     */
    public emit<K extends keyof EventTypes>(event: K, args?: EventTypes[K]) {
        this.em.emit(event, args);
    }

    /**
     * Alert title
     * @date 3/8/2024 - 7:09:48 AM
     *
     * @private
     * @type {string}
     */
    private title: string;
    /**
     * Alert color
     * @date 3/8/2024 - 7:09:48 AM
     *
     * @private
     * @type {Color}
     */
    private color: Color;
    /**
     * Alert message
     * @date 3/8/2024 - 7:09:48 AM
     *
     * @private
     * @type {string}
     */
    private message: string;

    /**
     * Creates an instance of Alert.
     * @date 3/8/2024 - 7:09:48 AM
     *
     * @constructor
     * @param {string} title
     * @param {string} message
     * @param {Color} [color='success']
     */
    constructor(title: string, message: string, color: Color = 'success') {
        this.on('show', () => {
            $(this.target).alert();
        });
        this.target.classList.add('notification');
        container.appendChild(this.target);
        this.title = title;
        this.color = color;
        this.message = message;
        this.render();
    }

    /**
     * Renders the alert
     * @date 3/8/2024 - 7:09:48 AM
     *
     * @private
     */
    private render() {
        this.target.classList.add(
            'alert',
            `alert-${this.color}`,
            'alert-dismissible',
            // 'position-absolute',
            'animate__animated',
            'animate__fadeInDown',
            'animate__faster'
        );
        this.target.style.top = '10px';
        this.target.style.left = '10px';
        this.target.style.width = 'calc(100% - 20px)';
        this.target.style.zIndex = '100';
        this.target.setAttribute('role', 'alert');

        this.target.innerHTML = `
            <div class="d-flex">
                <strong class="me-1">${this.title}</strong> ${this.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        const removeAnimation = () => {
            this.target.removeEventListener('animationend', removeAnimation);

            this.target.classList.remove(
                'animate__fadeInDown',
                'animate__faster',
                'animate__animated'
            );
        };

        this.target.addEventListener('animationend', removeAnimation);
    }

    /**
     * Shows the alert
     * @date 3/8/2024 - 7:09:48 AM
     */
    show() {
        this.emit('show');
    }

    /**
     * Hides the alert
     * @date 3/8/2024 - 7:09:48 AM
     */
    hide() {
        this.emit('hide');
    }
}
