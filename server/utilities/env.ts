import path from 'path';
import { config } from 'dotenv';

config();

export const __root = path.resolve(__dirname, '../../');
export const __templates = path.resolve(__root, './public/templates/');
export const __public = path.resolve(__root, './public/');
export const __uploads = path.resolve(__root, './storage/uploads/');
export const __logs = path.resolve(__root, './storage/logs/');
export const __entries = path.resolve(__root, './client/entries/');

export const unify = (str: string) => str.replace(/\\/g, '/');

export default process.env;
