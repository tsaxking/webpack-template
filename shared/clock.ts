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
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export const monthsShort: string[] = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sept',
    'Oct',
    'Nov',
    'Dec',
];

/**
 * All days as an array of strings
 * @date 10/12/2023 - 1:50:41 PM
 *
 * @type {string[]}
 */
export const days: string[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

export const daysShort: string[] = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
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

type D = Date | number | string;

/**
 * Curry function that takes a date and returns a string formatted with the date and/or time
 * If no date is passed, it will use the current date
 * @param format A string that will be formatted with the date
 * @returns A function that takes a date and returns a string
 */
export const dateString = (format: string) => {
    return (date: D = new Date()) => {
        if (!(date instanceof Date)) date = new Date(date);
        return (
            format
                // year
                .replace(/YYYY/g, date.getFullYear().toString())
                .replace(/YY/g, date.getFullYear().toString().slice(-2))
                // month
                .replace(/MMM/g, monthsShort[date.getMonth()].toString())
                .replace(
                    /MM/g,
                    (date.getMonth() + 1).toString().padStart(2, '0'),
                )
                .replace(/month/gi, months[date.getMonth()].toString())
                // day
                .replace(/DDD/g, daysShort[date.getDay()].toString())
                .replace(/DD/g, date.getDate().toString().padStart(2, '0'))
                .replace(/day/gi, days[date.getDay()].toString())
                // time
                .replace(/hh/g, date.getHours().toString().padStart(2, '0')) // 24 hour
                .replace(/mm/g, date.getMinutes().toString().padStart(2, '0'))
                .replace(/ss/g, date.getSeconds().toString().padStart(2, '0'))
                .replace(
                    /ms/g,
                    date.getMilliseconds().toString().padStart(3, '0'),
                )
                // time no padding
                .replace(
                    /h/g,
                    date.getHours() > 12
                        ? (date.getHours() - 12).toString()
                        : date.getHours().toString(),
                ) // 12 hour
                .replace(/m/g, date.getMinutes().toString())
                .replace(/s/g, date.getSeconds().toString())
                .replace(/ms/g, date.getMilliseconds().toString())
                // am/pm
                .replace(/am/g, date.getHours() >= 12 ? 'pm' : 'am')
                .replace(/AM/g, date.getHours() >= 12 ? 'PM' : 'AM')
                .replace(/a.m./g, date.getHours() >= 12 ? 'p.m.' : 'a.m.')
                .replace(/A.M./g, date.getHours() >= 12 ? 'P.M.' : 'A.M.')
        );
    };
};

// some common formats
export const time = dateString('h:mm AM');
export const time24 = dateString('hh:mm');
export const date = dateString('MM/DD/YYYY');
export const dateTime = dateString('MM/DD/YYYY hh:mm AM');
export const dateTime24 = dateString('MM/DD/YYYY hh:mm');
export const fullDate = dateString('month DD, YYYY');
export const fullDateTime = dateString('month DD, YYYY hh:mm AM');
export const fullDateTime24 = dateString('month DD, YYYY hh:mm');

const timezoneOffsets = {
    EST: -5, // Eastern Standard Time
    EDT: -4, // Eastern Daylight Time
    CST: -6, // Central Standard Time
    CDT: -5, // Central Daylight Time
    MST: -7, // Mountain Standard Time
    MDT: -6, // Mountain Daylight Time
    PST: -8, // Pacific Standard Time
    PDT: -7, // Pacific Daylight Time
    AKST: -9, // Alaska Standard Time
    AKDT: -8, // Alaska Daylight Time
    HST: -10, // Hawaii Standard Time
    HAST: -10, // Hawaii-Aleutian Standard Time
    HADT: -9, // Hawaii-Aleutian Daylight Time
    SST: -11, // Samoa Standard Time
    SDT: -10, // Samoa Daylight Time
    CHST: 10, // Chamorro Standard Time
    UTC: 0, // Coordinated Universal Time
};

type Timezone = keyof typeof timezoneOffsets;

/**
 * Changes the timezone of a date
 * @param to The timezone to change to
 * @returns A function that takes a date and returns a date with the new timezone
 */
export const changeTimezone = (to: Timezone) => (date: Date) => {
    const offset = timezoneOffsets[to];
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    return new Date(utc + 3600000 * offset);
};
