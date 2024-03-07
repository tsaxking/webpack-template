export type Picture = {
    url: string;
    file: File;
};

export type PageGroup = {
    name: string;
    pages: PageObj[];
};

export type PageObj = {
    name: string;
    icon: string;
    iconType: 'material' | 'fontawesome' | 'bootstrap';
};
