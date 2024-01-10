// The point of this file is to work with another server that generates ids and pulls them form random.org

import * as randomString from 'npm:uuid';
import axios from 'npm:axios';
import * as fsPromises from 'node:fs/promises';
import * as fs from 'node:fs';
import env from './env.ts';

export const uuid = (...args: any[]) => randomString.v4();

// const uuidv4 = randomString.v4;

// /**
//  * Description placeholder
//  * @date 10/12/2023 - 3:26:42 PM
//  *
//  * @type {*}
//  */
// const {
//     ID_GENERATION_KEY,
//     ID_GENERATION_LINK
// } = env;

// /**
//  * Description placeholder
//  * @date 10/12/2023 - 3:26:42 PM
//  *
//  * @async
//  */
// const getIds = async (n: number = 10): Promise<string[]> => {
//     if (ID_GENERATION_KEY && ID_GENERATION_LINK) {
//         ids.push(...(await axios.post(ID_GENERATION_LINK + '/uuid', {
//             apiKey: ID_GENERATION_KEY,
//             n
//         })).data as string[]);

//         fsPromises.writeFile('./ids.txt', JSON.stringify(ids, null, 2));

//         return ids;
//     }
//     return new Array(Math.round(n)).fill('').map(() => uuidv4());
// }

// /**
//  * Description placeholder
//  * @date 10/12/2023 - 3:26:42 PM
//  *
//  * @type {string[]}
//  */
// let ids: string[] = [];
// (async () => {
//     if (fs.existsSync('./ids.txt')) {
//         ids = JSON.parse(await fsPromises
//             .readFile('./ids.txt', 'utf-8')) as string[];
//     } else {
//         ids = await getIds(10);
//     }
// })();

// /**
//  * Description placeholder
//  * @date 10/12/2023 - 3:26:42 PM
//  *
//  * @typedef {uuidOptions}
//  */
// type uuidOptions = {
//     letters?: boolean;
//     length?: number;
// };

// /**
//  * Description placeholder
//  * @date 10/12/2023 - 3:26:42 PM
//  */
// const getId = (): string => {
//     if (ids.length) {
//         const id = ids.shift();
//         if (!id) return uuidv4();

//         if (ids.length < 5) {
//             getIds(10).then((newIds) => {
//                 ids.push(...newIds);
//             });
//         }

//         return id;
//     }

//     return uuidv4();
// }

// /**
//  * Returns a unique id
//  * @param {uuidOptions} options
//  * @returns {string} unique id
//  */
// export const uuid = (options?: uuidOptions): string => {
//     // random string, only letters
//     let id: string;
//     id = getId();

//     if (options?.letters) {
//         id = id.replace(/0-9/g, (num) => {
//             return String.fromCharCode(parseInt(num) + 65);
//         });
//     }

//     if (options?.length) {
//         if (options.length < 1) throw new Error('Length must be greater than 0');
//         if (options.length > 32) throw new Error('Length must be less than 32');

//         while (id.length < options.length) {
//             const i = getId();
//             id += i;
//         }

//         id = id.slice(0, options.length);
//     }

//     return id;
// }
