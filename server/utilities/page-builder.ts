import { getJSON, getTemplate } from './files.ts';
import { fromSnakeCase, capitalize } from '../../shared/text.ts';
import { Server } from 'npm:socket.io';
import { Session } from '../structure/sessions.ts';
import { SocketWrapper } from '../structure/socket.ts';
import { Req } from "../structure/app/req.ts";
import { Res } from "../structure/app/res.ts";
import { Next, ServerFunction } from "../structure/app/app.ts";


declare global {
    namespace Express {
        interface Request {
            session: Session;
            start: number;
            io: Server;
            file?: {
                id: string;
                name: string;
                size: number;
                type: string;
                ext: string;
                contentType: string;
                filename: string
            }
            socketIO?: SocketWrapper;
        }
    }
}


/**
 * Description placeholder
 * @date 10/12/2023 - 3:25:12 PM
 *
 * @type {{
    [key: string]: (req?: Request) => Promise<string>;
}}
 */
const builds: {
    [key: string]: (req?: Req) => Promise<string>;
} = {
    // put your pages here:
    /*
    example:
        '/account': async (req: Request) => {
            const { account } = req.session;

            if (account) {
                const template = await getTemplate('account', account); // uses node-html-constructor if you pass in the second parameter
                return template;
            }

            return 'You are not logged in.';
        }
    */
};


/**
 * Description placeholder
 * @date 10/12/2023 - 3:25:12 PM
 *
 * @async
 */
export const builder = async (req: Req, res: Res, next: Next) => {
    const { url } = req;
    if (builds[url]) {
        res.send(await builds[url](req));
    } else {
        next();
    }
};

/**
 * Description placeholder
 * @date 10/12/2023 - 3:25:12 PM
 *
 * @async
 */
export const homeBuilder = async (url: string) => {
    return await getTemplate('home/index', {
        pageTitle: capitalize(fromSnakeCase(url, '-')).slice(1),
        content: builds[url] ? await builds[url]() : '',
        footer: await getTemplate('components/footer', {
            year: new Date().getFullYear()
        }),
        navbar: await navBuilder(url, false)
    });
};

/**
 * Description placeholder
 * @date 10/12/2023 - 3:25:12 PM
 *
 * @async
 */
export const navBuilder = async (url: string, offcanvas: boolean) => {
    return await getTemplate('components/navbar', {
        offcanvas: {
            offcanvas
        },
        navbarRepeat: await getJSON<string[]>('pages/home').then((data) => {
            return data.map((page: string) => {
                return {
                    active: '/' + page === url,
                    name: capitalize(fromSnakeCase(page, '-')),
                    link: '/' + page
                }
            });
        })
    })
}