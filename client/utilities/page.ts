export const getOpenPage = () => {
    const url = new URL(window.location.href);
    const page = url.searchParams.get('page');
    return page || '';
};
