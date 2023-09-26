import CBS, {} from "../submodules/custom-bootstrap/src/1-main/1-main";
import { CBS_Modal } from "../submodules/custom-bootstrap/src/components/1-general/modal";
import { CBS_Button } from "../submodules/custom-bootstrap/src/components/1-general/1-button";
import { CBS_Container } from "../submodules/custom-bootstrap/src/components/0-grid/container";
import { PdfJsDocument, PdfJsPage } from "../declaration-merging/pdfjslib.d";
import pdfjsLib from '../../node_modules/pdfjs-dist/build/pdf.js';




export class PDF {
    doc: Promise<PdfJsDocument>;

    constructor(
        public readonly id: string,
        public readonly name: string
    ) {
        this.doc = this.load();
    }


    get url(): string {
        return '/uploads/' + this.id + '.pdf';
    }


    async load(): Promise<PdfJsDocument> {
        return new Promise((res, rej) => {
            pdfjsLib.getDocument(this.url).promise
                .then(res)
                .catch(console.error);
        });
    }


    // opens a modal with the pdf viewer
    async modal(options?: PDFViewOptions): Promise<CBS_Modal> {
        const container = CBS.createElement('container');

        const buttons: CBS_Button[] = [];

        if (options?.editable) {
            const save = CBS.createElement('button', {
                color: 'success'
            });
    
            save.append('Save');

            buttons.push(save);
        }

        const modal = CBS.modal(container, {
            title: 'PDF Viewer: ' + this.name,
            size: 'xl',
            buttons
        });

        const btnGroup = CBS.createElement('button-group');

        const prev = CBS.createElement('button', {
            color: 'primary'
        });
        prev.append('<i class="material-icons">arrow_back</i>');
        btnGroup.append(prev);

        const next = CBS.createElement('button', {
            color: 'primary'
        });
        next.append('<i class="material-icons">arrow_forward</i>');
        btnGroup.append(next);


        const canvas = document.createElement('canvas');
        container.append(canvas);
        container.append(btnGroup);


        // page.next() and .prev() return a new page
        // this reassigns the page interval and keeps the listeners
        let page = await this.viewPage(1, canvas);
        const getPage = () => page;
        prev.on('click', () => {
            getPage().prev().then((p) => {
                page = p;
            }).catch(console.error);
        });
        next.on('click', () => {
            getPage().next().then((p) => {
                page = p;
            }).catch(console.error);
        });

        return modal;
    }

    async viewer(canvas: HTMLCanvasElement, options?: PDFViewOptions): Promise<CBS_Container> {
        const page = await this.viewPage(1, canvas);

        const container = CBS.createElement('container');

        
        const btnGroup = CBS.createElement('button-group');

        const prev = CBS.createElement('button', {
            color: 'primary'
        });
        prev.append('<i class="material-icons">arrow_back</i>');
        btnGroup.append(prev);

        const next = CBS.createElement('button', {
            color: 'primary'
        });
        next.append('<i class="material-icons">arrow_forward</i>');
        btnGroup.append(next);

        container.append(canvas);
        container.append(btnGroup);


        // page.next() and .prev() return a new page
        // this reassigns the page interval and keeps the listeners
        let viewPage = await this.viewPage(1, canvas);
        const getPage = () => page;
        prev.on('click', () => {
            getPage().prev().then((p) => {
                viewPage = p;
            }).catch(console.error);
        });
        next.on('click', () => {
            getPage().next().then((p) => {
                viewPage = p;
            }).catch(console.error);
        });

        return container;
    }



    // loads the pdf page onto a canvas
    async viewPage(page: number, canvas: HTMLCanvasElement): Promise<PDF_Page> {
        return new Promise(async (res, rej) => {
            const doc = await this.doc;

            doc.getPage(page).then((pdfPage: PdfJsPage) => {
                const viewport = pdfPage.getViewport({
                    scale: 1.0,
                    rotation: 0
                });

                const context = canvas.getContext('2d') as CanvasRenderingContext2D;
                canvas.height = viewport.height || 11 * 72;
                canvas.width = viewport.width || 8.5 * 72;

                // flip page about horizontal axis

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                pdfPage.render(renderContext).promise
                    .then(() => {
                        if (page < 1 || page > doc.numPages) {
                            return rej(new Error('Page does not exist'));
                        }

                        const p = new PDF_Page(pdfPage, this, page, canvas);

                        res(p);
                    })
                    .catch(rej);

            });
        });
    }
}



export type PDFViewOptions = {
    editable?: boolean;
};






export class PDF_Page {
    constructor(
        public readonly page: PdfJsPage,
        public readonly pdf: PDF,
        public readonly number: number,
        public readonly canvas: HTMLCanvasElement
    ) {}

    next(): Promise<PDF_Page> {
        return this.pdf.viewPage(this.number + 1, this.canvas);
    }

    prev(): Promise<PDF_Page> {
        return this.pdf.viewPage(this.number - 1, this.canvas);
    }
};