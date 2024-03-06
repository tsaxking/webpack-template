/**
 * Sleep for a given amount of time
 * @date 10/12/2023 - 1:51:48 PM
 */
export const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Sleep for a given amount of days (can be used for larger amounts of time)
 * @date 10/12/2023 - 1:51:48 PM
 */
export const daysTimeout = (cb: () => void, days: number) => {
    const day = 1000 * 60 * 60 * 24;

    let numDays = 0;
    const int = setInterval(() => {
        numDays++;
        if (numDays >= days) {
            cb();
            numDays = 0;
            clearInterval(int);
        }
    }, day);
};
