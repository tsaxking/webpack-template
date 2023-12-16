import { getTemplateSync, log } from "./files.ts";
import { Session } from "../structure/sessions.ts";
import { Server } from "npm:socket.io";
import { messages, StatusId, StatusCode, StatusMessage, StatusColor } from "../../shared/status-messages.ts";
import { Next, ServerFunction } from "../structure/app/app.ts";
import { Req } from "../structure/app/req.ts";
import { Res } from "../structure/app/res.ts";

declare global {
    namespace Express {
        interface Request {
            session: Session;
            start: number;
            io: Server;
        }
    }
}




/**
 * Description placeholder
 * @date 10/12/2023 - 3:26:23 PM
 *
 * @export
 * @class Status
 * @typedef {Status}
 */
export class Status {
    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @static
     * @param {StatusId} id
     * @param {(session: Session) => boolean} test
     * @returns {ServerFunction}
     */
    static middleware(id: StatusId, test: (session: Session) => boolean): ServerFunction<any> {
        return (req: Req, res: Res, next: Next) => {
            if (test(req.session)) {
                next();
            } else {
                const status = Status.from(id, req);
                status.send(res);
            }
        }
    }






    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @static
     * @param {StatusId} id
     * @param {Req} req
     * @param {?*} [data]
     * @returns {Status}
     */
    static from(id: StatusId, req: Req, data?: any): Status {
        try {
            data = JSON.stringify(data);
        } catch (e) {
            console.error('Unable to stringify data for status message.', e);
            console.log('Data:', data);
            data = undefined;
        }


        const message = messages[id];
        if (!message) {
            console.log('Unknown status message requested.', id);

            return new Status(
                {
                    message: 'An unknown status message was requested.',
                    color: 'danger',
                    code: 500,
                    instructions: 'Please contact an administrator.'
                },
                'Unknown Status Message',
                'Unknown',
                data,
                req
            );
        }

        if (typeof id === 'number') {
            throw new Error('Status message requested by number. Please use a string instead.');
        }

        const [title, status] = id.split(':');


        return new Status(
            message,
            title,
            status,
            data,
            req
        )
    }




    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {string}
     */
    public readonly message: string;
    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {StatusColor}
     */
    public readonly color: StatusColor;
    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {StatusCode}
     */
    public readonly code: StatusCode;
    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {string}
     */
    public readonly instructions: string;
    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {string}
     */
    public readonly data: string;
    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {?string}
     */
    public readonly redirect?: string;
    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {Req}
     */
    public readonly request: Req;



    /**
     * Creates an instance of Status.
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @constructor
     * @param {StatusMessage} message
     * @param {string} title
     * @param {string} status
     * @param {*} data
     * @param {Req} req
     */
    constructor(
        message: StatusMessage,
        public readonly title: string,
        public readonly status: string,
        data: any,
        req: Req
    ) {
        this.message = message.message;
        this.color = message.color;
        this.code = message.code;
        this.instructions = message.instructions;
        this.data = data;
        this.redirect = message.redirect;
        this.request = req;


        log('status', {
            ...message,
            data: data ? JSON.stringify(data) : 'No data provided.',
            ip: req.session.ip,
            username: req.session.account?.username,
            sessionId: req.session.id
        });



        // Send email to admins if error
        // if (status === ColorCode.majorError && env.SEND_STATUS_EMAILS === 'TRUE') {
        //     Account.fromRole('admin')
        //         .then(admins => {
        //             const email = new Email(
        //                 admins.map(admin => admin.email),
        //                 'Error: ' + title,
        //                 EmailType.error,
        //                 {
        //                     constructor: {
        //                         title,
        //                         message,
        //                         code,
        //                         sessionId: request.session.id,
        //                         username: request.session.account?.username,
        //                         ip: request.session.ip,
        //                         email: request.session.account?.email,
        //                     }
        //                 });

        //             email.send()
        //                 .catch(console.error);
        //         })
        //         .catch(console.error);
        // }
    }

    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @readonly
     * @type {string}
     */
    get html() {
        return getTemplateSync('status', {
            ...this,
            data: this.data ? JSON.stringify(this.data) : 'No data provided.'
        });
    }

    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @readonly
     * @type {{ title: string; status: string; message: string; code: StatusCode; instructions: string; data: any; redirect: string; color: StatusColor; }}
     */
    get json() {
        return {
            title: this.title,
            status: this.status,
            message: this.message,
            code: this.code,
            instructions: this.instructions,
            data: JSON.parse(this.data || '{}'),
            redirect: this.redirect,
            color: this.color
        }
    }

    /**
     * Description placeholder
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @param {Res} res
     */
    send(res: Res) {
        switch (this.request.method) {
            case 'GET':
                res.status(this.code).send(this.html);
                break;
            case 'POST':
                res.status(this.code).json(this.json);
                break;
            default:
                res.status(this.code).send(this.html);
                break;
        }
    }
}