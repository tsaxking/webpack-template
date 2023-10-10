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