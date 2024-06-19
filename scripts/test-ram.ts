import { toByteString } from '../shared/text';
// the purpose of this fil is to test how much memory deno can use before crashing
// each tick will create a 1MB object and store it in an array
// it will then log the memory usage

const size = 1024 * 1024; // 1MB

// create a 1MB array
const createArray = () => new Array(size).fill(0);

let runs = 0;
const runTest = () => {
    runs++;
    return createArray();
};

const stored: any[] = [];
// eslint-disable-next-line no-constant-condition
while (true) {
    stored.push(runTest());
    console.clear();
    const memory = process.memoryUsage();
    // console.log(memory);
    // console.log(runs);
    console.log('rss:', toByteString(memory.rss));
    console.log('heapTotal:', toByteString(memory.heapTotal));
    console.log('heapUsed:', toByteString(memory.heapUsed));
    console.log('external:', toByteString(memory.external));
}
