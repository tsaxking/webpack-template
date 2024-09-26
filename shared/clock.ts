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
    'December'
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
    'Dec'
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
    'Saturday'
];

export const daysShort: string[] = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
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
        if (typeof date === 'string') {
            if (isNaN(Number(date))) {
                date = new Date(date);
            } else {
                date = new Date(Number(date));
            }
        }
        if (typeof date === 'number') date = new Date(date);

        const DATE = date as Date;
        const data = format
            // year
            .replace(/YYYY/g, DATE.getFullYear()?.toString())
            .replace(/YY/g, DATE.getFullYear()?.toString().slice(-2))
            // month
            .replace(/MMM/g, monthsShort[DATE.getMonth()]?.toString())
            .replace(/MM/g, (DATE.getMonth() + 1)?.toString().padStart(2, '0'))
            .replace(/month/gi, months[DATE.getMonth()]?.toString())
            // day
            .replace(/DDD/g, daysShort[DATE.getDay()]?.toString())
            .replace(/DD/g, DATE.getDate()?.toString().padStart(2, '0'))
            .replace(/day/gi, days[DATE.getDay()]?.toString())
            // time
            .replace(/hh/g, () => {
                const hours = DATE.getHours();
                if (format.includes('AM') || format.includes('PM')) {
                    if (hours === 0) return '12';
                    if (hours > 12) {
                        return (hours - 12)?.toString().padStart(2, '0');
                    }
                }
                return hours?.toString().padStart(2, '0');
            }) // 24 hour
            .replace(/mm/g, DATE.getMinutes()?.toString().padStart(2, '0'))
            .replace(/ss/g, DATE.getSeconds()?.toString().padStart(2, '0'))
            .replace(/ms/g, DATE.getMilliseconds()?.toString().padStart(3, '0'))
            // time no padding
            .replace(
                /h/g,
                DATE.getHours() > 12
                    ? (DATE.getHours() - 12)?.toString()
                    : DATE.getHours()?.toString()
            ) // 12 hour
            .replace(/m/g, DATE.getMinutes()?.toString())
            .replace(/s/g, DATE.getSeconds()?.toString())
            .replace(/ms/g, DATE.getMilliseconds()?.toString())
            // am/pm
            .replace(/am/g, DATE.getHours() >= 12 ? 'pm' : 'am')
            .replace(/AM/g, DATE.getHours() >= 12 ? 'PM' : 'AM')
            .replace(/a.m./g, DATE.getHours() >= 12 ? 'p.m.' : 'a.m.')
            .replace(/A.M./g, DATE.getHours() >= 12 ? 'P.M.' : 'A.M.')
            .replace(/pm/g, DATE.getHours() >= 12 ? 'pm' : 'am')
            .replace(/PM/g, DATE.getHours() >= 12 ? 'PM' : 'AM')
            .replace(/p.m./g, DATE.getHours() >= 12 ? 'p.m.' : 'a.m.')
            .replace(/P.M./g, DATE.getHours() >= 12 ? 'P.M.' : 'A.M.');
        return data;
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
    UTC: 0 // Coordinated Universal Time
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

export const segment = (dates: Date[], segments?: number): Date[] => {
    dates = dates.slice(); // copy the array
    dates.sort((a, b) => a.getTime() - b.getTime());
    const min = dates[0];
    const max = dates[dates.length - 1];
    if (!min || !max) return []; // no dates
    const range = max.getTime() - min.getTime();
    if (segments) {
        return Array.from({ length: segments }).map((_, i) => {
            const start = min.getTime() + (range / segments) * i;
            return new Date(start);
        });
    }
    switch (true) {
        case range < 1000 * 60 * 60: // less than an hour
            return segment(dates, 4); // 15 minute segments
        case range < 1000 * 60 * 60 * 24: // less than a day
            return segment(dates, 24); // 1 hour segments
        case range < 1000 * 60 * 60 * 24 * 7: // less than a week
            return segment(dates, 7); // 1 day segments
        case range < 1000 * 60 * 60 * 24 * 30: // less than a month
            return segment(dates, 30); // 1 week segments
        case range < 1000 * 60 * 60 * 24 * 365: // less than a year
            return segment(dates, 12); // 1 month segments
        default:
            return segment(dates, 5); // 1 year segments
    }
};
