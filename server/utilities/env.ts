import path from 'path';
import { config } from 'dotenv';

config();

/**
 * Full path of the root directory
 * @date 3/8/2024 - 5:49:10 AM
 *
 * @type {*}
 */
export const __root = path.resolve(__dirname, '../../');
/**
 * Full path of the templates directory
 * @date 3/8/2024 - 5:49:10 AM
 *
 * @type {*}
 */
export const __templates = path.resolve(__root, './public/templates/');
/**
 * Full path of the public directory
 * @date 3/8/2024 - 5:49:10 AM
 *
 * @type {*}
 */
export const __public = path.resolve(__root, './public/');
/**
 * Full path of the uploads directory
 * @date 3/8/2024 - 5:49:10 AM
 *
 * @type {*}
 */
export const __uploads = path.resolve(__root, './storage/uploads/');
/**
 * Full path of the logs directory
 * @date 3/8/2024 - 5:49:10 AM
 *
 * @type {*}
 */
export const __logs = path.resolve(__root, './storage/logs/');
/**
 * Full path of the client directory
 * @date 3/8/2024 - 5:49:10 AM
 *
 * @type {*}
 */
export const __entries = path.resolve(__root, './client/entries/');

/**
 * Unify paths across different operating systems
 * @date 3/8/2024 - 5:49:10 AM
 *
 * @param {string} str
 * @returns {*}
 */
export const unify = (str: string) => str.replace(/\\/g, '/');

export default process.env;
