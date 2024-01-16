declare module 'pdfjs' {
}

export interface PdfJsLib {
    getDocument(url: string): {
        promise: Promise<PdfJsDocument>;
    };

    GlobalWorkerOptions: {
        workerSrc: string;
    };

    disableWorker: boolean;

    version: string;
}

interface PdfJsDocument {
    numPages: number;

    getPage(pageNumber: number): Promise<PdfJsPage>;
}

export interface PdfJsPage {
    getViewport(
        scale: number | {
            scale: number;
            rotation: number;
        },
    ): PdfJsViewport;
    getTextContent(): Promise<PdfJsTextContent>;
    getAnnotations(): Promise<PdfJsAnnotation[]>;
    getAnnotations(): Promise<PdfJsAnnotation[]>;
    getAnnotations(params: { intent: string }): Promise<PdfJsAnnotation[]>;
    render(renderParameters: PdfJsRenderParameters): PdfJsRenderTask;

    getTextContentStream(): ReadableStream;
    getOperatorList(): Promise<PdfJsOperatorList>;
    getOperatorList(params: { intent: string }): Promise<PdfJsOperatorList>;
}

export interface PdfJsOperatorList {
    fnArray: number[];
    argsArray: number[][];
    lastChunk: boolean;
}

export interface PdfJsViewport {
    width: number;
    height: number;
    rotation: number;
    transform: number[];
    offsetX: number;
    offsetY: number;
    scale: number;
    rawDims: {
        pageHeight: number;
        pageWidth: number;
        pageX: number;
        pageY: number;
    };
}

export interface PdfJsRenderTask {
    promise: Promise<void>;
    cancel(): void;
}

export interface PdfJsRenderParameters {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfJsViewport;
}

export interface PdfJsTextContent {
    items: PdfJsTextItem[];
}

export interface PdfJsTextItem {
    str: string;
    transform: number[];
    width: number;
    height: number;
    dir: string;
    fontName: string;
    hasEOL: boolean;
    heightDir: number;
    transformDir: number[];
}

export interface PdfJsTextLayerRenderTask {
    promise: Promise<void>;
    cancel(): void;
}

export interface PdfJsTextLayerRenderParameters {
    textContent: PdfJsTextContent;
    container: HTMLElement;
    viewport: PdfJsViewport;
    textDivs: HTMLElement[];
    textContentStream: ReadableStream;
    enhanceTextSelection: boolean;
    textDivsLayer: HTMLElement;
}

export interface PdfJsAnnotationLayerRenderTask {
    promise: Promise<void>;
    cancel(): void;
}

export interface PdfJsAnnotationLayerRenderParameters {
    annotations: PdfJsAnnotation[];
    div: HTMLElement;
    viewport: PdfJsViewport;
    linkService: PdfJsLinkService;
    downloadManager: PdfJsDownloadManager;
}

export interface PdfJsAnnotation {
    subtype: string;
    rect: number[];
    borderWidth: number;
    color: number[];
    hasAppearance: boolean;
    id: string;
    title: string;
    contents: string;
    name: string;
    data: string;
    viewable: string;
    actions: PdfJsAnnotationAction;
    getHtmlElement(commonOjbs: any): HTMLElement;
}

export interface PdfJsAnnotationAction {
    mouseUp: PdfJsAnnotationActionHandler[];
    mouseDown: PdfJsAnnotationActionHandler[];
    mouseEnter: PdfJsAnnotationActionHandler[];
    mouseExit: PdfJsAnnotationActionHandler[];
    pageOpen: PdfJsAnnotationActionHandler[];
    pageClose: PdfJsAnnotationActionHandler[];
    pageVisible: PdfJsAnnotationActionHandler[];
    pageInvisible: PdfJsAnnotationActionHandler[];
    pageAction: PdfJsAnnotationActionHandler[];
}

export interface PdfJsAnnotationActionHandler {
    action: string;
    title: string;
    eventType: string;
    ref: PdfJsRef;
}

export interface PdfJsRef {
    num: number;
    gen: number;
}

export interface PdfJsLinkService {
    setDocument(pdfDocument: PdfJsDocument): void;
    setViewer(viewer: PdfJsViewer): void;
    setDownloadManager(downloadManager: PdfJsDownloadManager): void;
    get pagesCount(): number;
    get page(): number;
    set page(value: number);
    navigateTo(dest: PdfJsDestination): void;
    getDestinationHash(dest: PdfJsDestination): string;
    getAnchorUrl(hash: string): string;
    setHash(hash: string): void;
    executeNamedAction(action: string): void;
    cachePageRef(pageNum: number, pageRef: PdfJsRef): void;
    isPageVisible(pageNumber: number): boolean;
    isPageCached(pageNumber: number): boolean;
    pagesRotation: number;
    _pagesRefCache: any[];
}

export interface PdfJsDownloadManager {
    downloadUrl(url: string, filename: string): void;
    downloadData(data: any, filename: string, contentType: string): void;
    download(blob: Blob, url: string, filename: string): void;
}

export interface PdfJsViewer {
    container: HTMLElement;
    viewer: HTMLElement;
    getPageView(pageIndex: number): PdfJsPageView;
    getVisiblePages(): PdfJsPageView[];
    cleanup(): void;
}

export interface PdfJsPageView {
    div: HTMLElement;
    setPdfPage(pdfPage: PdfJsPage): void;
    destroy(): void;
    render(): PdfJsPageRenderTask;
    textLayer?: PdfJsTextLayer;
    annotationLayer?: PdfJsAnnotationLayer;
}

export interface PdfJsPageRenderTask {
    promise: Promise<void>;
    cancel(): void;
}

export interface PdfJsTextLayer {
    render(): PdfJsTextLayerRenderTask;
}

export interface PdfJsAnnotationLayer {
    render(): PdfJsAnnotationLayerRenderTask;
}

export interface PdfJsDestination {
    name: string;
    args: any[];
}
