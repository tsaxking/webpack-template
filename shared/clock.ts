/**
 * Start time of the application
 * @date 10/12/2023 - 1:50:41 PM
 *
 * @type {*}
 */
const start = Date.now();
/**
 * Returns the uptime of the application
 * @date 10/12/2023 - 1:50:41 PM
 */
export const uptime = () => Date.now() - start;

/**
 * All months as an array of strings
 * @date 10/12/2023 - 1:50:41 PM
 *
 * @type {string[]}
 */
export const months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'
];

/**
 * All days as an array of strings
 * @date 10/12/2023 - 1:50:41 PM
 *
 * @type {string[]}
 */
export const days: string[] = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Gets the current month
 * @date 10/12/2023 - 1:50:41 PM
 */
export const currentMonth = () => months[new Date().getMonth()];
/**
 * Gets the current year
 * @date 10/12/2023 - 1:50:41 PM
 */
export const currentYear = () => new Date().getFullYear();
/**
 * Gets the current day
 * @date 10/12/2023 - 1:50:41 PM
 */
export const currentDay = () => days[new Date().getDay()];