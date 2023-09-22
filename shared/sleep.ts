export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));



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
}