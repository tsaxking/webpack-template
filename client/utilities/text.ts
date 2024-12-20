import FuzzySearch from 'fuzzy-search';

/**
 * Returns the index of the string that is closest to the key
 * @param {string} key
 * @param {string[]} options
 * @returns {number[]}
 */
export const fuzzySearch = (key: string, options: string[]): number[] => {
    const searcher = new FuzzySearch(options, [], { caseSensitive: false });
    const results = searcher.search(key);
    return results.map((r: string) => options.indexOf(r));
};
