const start = Date.now();
export const uptime = () => Date.now() - start;

export const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'
];

export const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const currentMonth = () => months[new Date().getMonth()];
export const currentYear = () => new Date().getFullYear();
export const currentDay = () => days[new Date().getDay()];


export const formatDate = (str: string) => (date: Date) => {
    const parse = {
        'YYYY': date.getFullYear().toString(),
        'MM': (date.getMonth() + 1).toString().length === 1 ? `0${date.getMonth() + 1}` : date.getMonth() + 1,
        'DD': date.getDate().toString().length === 1 ? `0${date.getDate()}` : date.getDate(),
        'HH12': date.getHours() > 12 ? date.getHours() - 12 : date.getHours(),
        'HH24': date.getHours().toString().length === 1 ? `0${date.getHours()}` : date.getHours(),
        'HH': date.getHours().toString().length === 1 ? `0${date.getHours()}` : date.getHours(),
        'mm': date.getMinutes().toString().length === 1 ? `0${date.getMinutes()}` : date.getMinutes(),
        'ss': date.getSeconds().toString().length === 1 ? `0${date.getSeconds()}` : date.getSeconds(),
        'Month': months[date.getMonth()],
        'Day': days[date.getDay()],
        'ap': date.getHours() > 12 ? 'PM' : 'AM'
    };

    let formatted = str;

    for (const key in parse) {
        formatted = formatted.replace(new RegExp(key, 'g'), parse[key]);
    }

    return formatted;
}