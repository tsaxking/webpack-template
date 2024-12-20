/**
 * Picture type
 * @date 3/8/2024 - 7:01:19 AM
 *
 * @export
 * @typedef {Picture}
 */
export type Picture = {
    url: string;
    file: File;
};

/**
 * Page group type (used for the sidebar)
 * @date 3/8/2024 - 7:01:19 AM
 *
 * @export
 * @typedef {PageGroup}
 */
export type PageGroup = {
    name: string;
    pages: PageObj[];
};

/**
 * Page type (used for the sidebar)
 * @date 3/8/2024 - 7:01:19 AM
 *
 * @export
 * @typedef {PageObj}
 */
export type PageObj = {
    name: string;
    icon: string;
    iconType: 'material' | 'fontawesome' | 'bootstrap';
};
