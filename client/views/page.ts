import { SocketListener, ViewUpdate, ViewUpdateWrapper, socket, SocketWrapper } from "../utilities/socket.ts";
import { capitalize } from "../../shared/text.ts";
import { ServerRequest, RequestOptions, StreamOptions } from "../utilities/requests.ts";
import CBS from "../submodules/custom-bootstrap/src/1-main/1-main.ts";
import { CBS_Document } from "../submodules/custom-bootstrap/src/1-main/4-document.ts";


export type PageEvent = 'open' | 'close' | 'load';


export type Query = {
    [key: string]: string | number | boolean | null | undefined;
}

export class Page {
    static readonly dashboardName = window.location.pathname.split('/')[1];

    static pages: {
        [key: string]: Page;
    } = {};

    static #home: Page;

    public static get home(): Page {
        return Page.#home || Object.values(Page.pages)[0];
    }

    private static set home(home: Page) {
        if (Page.#home) throw new Error('Home page already set');
        Page.#home = home;
    }

    private static addPage(page: Page) {
        if (Page.pages[page.name]) 
            return console.error(
                new Error(`Page ${page.name} already exists`));
        Page.pages[page.name] = page;

        if (page.home) Page.home = page;
    }
    static current?: Page;
    static history: Page[] = [];



    private readonly el: HTMLElement|null;
    readonly link: HTMLAnchorElement|null;
    readonly events: {
        [key in PageEvent]?: Function;
    } = {};
    readonly data: {
        [key: string]: any;
    } = {}
    readonly updates: ViewUpdate[] = [];
    readonly lowercaseName: string;
    readonly body: HTMLElement|null;
    readonly dom: CBS_Document;

    constructor(
        public readonly name: string, 
        public readonly home?: boolean
    ) {
        this.lowercaseName = this.name.toLowerCase().replaceAll(' ', '-');
        this.body = document.querySelector(`#${this.lowercaseName}--page-body`);
        this.dom = CBS.createDomFromElement(this.body as HTMLDivElement);

        Page.addPage(this);
        this.el = document.querySelector(`#${this.lowercaseName}`);
        this.link = document.querySelector(`a[data-target="${this.lowercaseName}"]`);

        if (this.link && this.el) {
            this.link.addEventListener('click', (e) => {
                e.preventDefault();
                this.open();
            });
        }
    }

    open(query?: Query) {
        if (Page.current === this) return;
        ViewUpdate.updates = ViewUpdate.updates.filter(vu => vu.viewUpdate.page !== this.name);

        for (const page of Object.values(Page.pages)) {
            if (page !== this && page !== Page.current) page.quietClose();
        }

        this.link?.classList.add('active');
        this.el?.classList.remove('d-none');
        Page.current?.close();
        Page.current = this;
        Page.history.push(this);

        if (this.events['open']) {
            this.events['open'](query);
        }

        document.title = `sfzMusic ${capitalize(Page.dashboardName)} Dashboard | ${this.name}`;
        history.pushState({ page: this.name }, this.name, `/${Page.dashboardName}/${this.name.toLowerCase().replaceAll(' ', '-')}`);
        window.scrollTo(0, 0);

        for (const vu of ViewUpdate.updates) {
            if (vu.viewUpdate.page === this.name) {
                vu.viewUpdate.callback(...vu.args);
            }
        }
    }

    private quietClose() {
        this.link?.classList.remove('active');
        this.el?.classList.add('d-none');
    }

    close() {
        this.quietClose();

        if (this.events['close']) {
            this.events['close']();
        }
    }

    async fetch(path: string, body?: any, options?: RequestOptions): Promise<any> {
        if (!path.startsWith('/')) path = `/${path}`;
        return new Promise((res, rej) => {
            ServerRequest.post(`/api/${this.name.toLowerCase()}${path}`, body, options)
                .then(res)
                .catch(rej);
        });
    }

    async stream(path: string, files: FileList, options?: StreamOptions) {
        if (!path.startsWith('/')) path = `/${path}`;
        return ServerRequest.stream(`/api/${this.name.toLowerCase()}${path}`, files, options);
    }

    on(event: PageEvent, callback: (query?: Query) => void) {
        if (this.events[event]) return console.error(`Event ${event} already exists`);
        this.events[event] = callback;
    }

    newUpdate(event: string, callback: (...args: any[]) => void, filter?: (...args: any[]) => boolean) {
        const listener = SocketWrapper.listeners[event];
        if (!listener) return console.error(`Event ${event} does not exist`);


        const vu = new ViewUpdate(event, this.name, callback, filter);
        listener.add(vu);
        return vu;
    }
}





document.addEventListener('DOMContentLoaded', () => {
    const page = Page.pages[capitalize(window.location.pathname.split('/')[2].toLowerCase())];
    // console.log(page, Page);
    if (page) page.open();
    // open first page if no page is found
    else Page.home.open();
});




window.onpopstate = (e) => {
    e.preventDefault();
    const page = Page.pages[e.state.page];
    if (page) page.open();
    // open first (or home) page if no page is found
    else Page.home.open();
}

socket.on('page:open', (page: string) => {
    const p = Page.pages[page];
    if (p) p.open();
});