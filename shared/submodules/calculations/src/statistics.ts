/**
 * Returns the standard deviation of the given data
 * @date 1/10/2024 - 2:45:36 PM
 */
export const standardDeviation = (data: number[]): number => {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance =
        data.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) /
        data.length;
    return Math.sqrt(variance);
};

/**
 * Returns the average of the given data
 * @date 1/10/2024 - 2:45:36 PM
 */
export const mean = (data: number[]): number => {
    return data.reduce((a, b) => a + b, 0) / data.length;
};

/**
 * Returns the median of the given data
 * @date 1/10/2024 - 2:45:36 PM
 */
export const median = (data: number[]): number => {
    const sorted = data.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid] + sorted[mid - 1]) / 2;
    } else {
        return sorted[mid];
    }
};

/**
 * Returns the mode of the given data
 * @date 1/10/2024 - 2:45:36 PM
 */
export const mode = (data: number[]): number => {
    const counts = data.reduce(
        (counts, x) => {
            counts[x] = counts[x] ? counts[x] + 1 : 1;
            return counts;
        },
        {} as { [key: number]: number }
    );

    let max = 0;
    let mode = 0;
    for (const key in counts) {
        if (counts[key] > max) {
            max = counts[key];
            mode = Number(key);
        }
    }

    return mode;
};

/**
 * Returns the range of the given data
 * @date 1/10/2024 - 2:45:36 PM
 */
export const range = (data: number[]): number => {
    const sorted = data.sort((a, b) => a - b);
    return sorted[sorted.length - 1] - sorted[0];
};

/**
 * Returns the quartiles of the given data (the lower, median, and upper values)
 * @date 1/10/2024 - 2:45:36 PM
 */
export const quartiles = (data: number[]): [number, number, number] => {
    const sorted = data.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const lower = sorted.slice(0, mid);
    const upper = sorted.slice(mid + 1);

    return [median(lower), median(sorted), median(upper)];
};

/**
 * Returns the interquartile range of the given data (the difference between the upper and lower quartiles)
 * @date 1/10/2024 - 2:45:36 PM
 */
export const interquartileRange = (data: number[]): number => {
    const [lower, _, upper] = quartiles(data);
    return upper - lower;
};

/**
 * Returns the outliers of the given data (values that are more than 1.5 * IQR away from the quartiles)
 * @date 1/10/2024 - 2:45:36 PM
 */
export const outliers = (data: number[]): number[] => {
    const [lower, _, upper] = quartiles(data);
    const iqr = interquartileRange(data);
    return data.filter(x => x < lower - 1.5 * iqr || x > upper + 1.5 * iqr);
};

/**
 * Returns the z-score of the given value in the given data (how many standard deviations away from the mean it is)
 * @date 1/10/2024 - 2:45:36 PM
 */
export const zScore = (data: number[], value: number): number => {
    return (value - mean(data)) / standardDeviation(data);
};

/**
 * Returns the z-scores of the given data (how many standard deviations away from the mean each value is)
 * @date 1/10/2024 - 2:45:36 PM
 */
export const zScores = (data: number[]): number[] => {
    const m = mean(data);
    const sd = standardDeviation(data);
    return data.map(x => (x - m) / sd);
};

/**
 * Returns the correlation coefficient of the given data (how closely the data is correlated)
 * @date 1/10/2024 - 2:45:36 PM
 */
export const correlation = (data1: number[], data2: number[]): number => {
    const z1 = zScores(data1);
    const z2 = zScores(data2);

    const sum = z1.map((z, i) => z * z2[i]).reduce((a, b) => a + b, 0);
    return sum / (z1.length - 1);
};

/**
 * Returns the covariance of the given data (how closely the data is correlated)
 * @date 1/10/2024 - 2:48:20 PM
 */
export const covariance = (data1: number[], data2: number[]): number => {
    const m1 = mean(data1);
    const m2 = mean(data2);
    const sum = data1
        .map((x, i) => (x - m1) * (data2[i] - m2))
        .reduce((a, b) => a + b, 0);
    return sum / (data1.length - 1);
};

/**
 * Returns the moving average of the given data (the average of the last n values)
 * @date 1/10/2024 - 2:45:36 PM
 */
export const movingAverage = (data: number[], windowSize: number): number[] => {
    const averages: number[] = [];
    for (let i = 0; i < data.length - windowSize; i++) {
        const window = data.slice(i, i + windowSize);
        averages.push(mean(window));
    }
    return averages;
};
