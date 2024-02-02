import { FileError, getTemplateSync, log } from './files.ts';
import { Session } from '../structure/sessions.ts';
import {
    messages,
    StatusCode,
    StatusColor,
    StatusId,
    StatusMessage,
} from '../../shared/status-messages.ts';
import { Next, ServerFunction } from '../structure/app/app.ts';
import { Req } from '../structure/app/req.ts';
import { Res } from '../structure/app/res.ts';
import { Result } from '../../shared/attempt.ts';
import env from './env.ts';

/**
 * Status class, used to send pre-made status messages to the client
 * These messages also add logs to the ./storage/logs/status.csv file
 * @date 10/12/2023 - 3:26:23 PM
 *
 * @export
 * @class Status
 * @typedef {Status}
 */
export class Status {
    /**
     * Status middleware, used to check if a user fulfills a certain requirement
     * This could be used to check if a user is logged in, or if they have a certain role
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @static
     * @param {StatusId} id
     * @param {(session: Session) => boolean} test
     * @returns {ServerFunction}
     */
    static middleware(
        id: StatusId,
        test: (session: Session) => boolean,
    ): ServerFunction {
        return (req: Req, res: Res, next: Next) => {
            if (test(req.session)) {
                next();
            } else {
                const status = Status.from(id, req);
                status.send(res);
            }
        };
    }

    /**
     * Generates a status object from a status id and a request object
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @static
     * @param {StatusId} id
     * @param {Req} req
     * @param {?*} [data]
     * @returns {Status}
     */
    static from(id: StatusId, req: Req, data?: unknown): Status {
        let dataStr = 'No data';
        try {
            dataStr = JSON.stringify(data);
        } catch (e) {
            console.error('Unable to stringify data for status message.', e);
            console.log('Data:', data);
        }

        const message = messages[id];
        if (!message) {
            console.log('Unknown status message requested.', id);

            return new Status(
                {
                    message: 'An unknown status message was requested.',
                    color: 'danger',
                    code: 500,
                    instructions: 'Please contact an administrator.',
                },
                'Unknown Status Message',
                'Unknown',
                dataStr,
                req,
            );
        }

        if (typeof id === 'number') {
            throw new Error(
                'Status message requested by number. Please use a string instead.',
            );
        }

        const [title, status] = id.split(':');

        return new Status(message, title, status, dataStr, req);
    }

    /**
     * Message the user will see
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {string}
     */
    public readonly message: string;
    /**
     * Bootstrap color the message will have
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {StatusColor}
     */
    public readonly color: StatusColor;
    /**
     * HTTP status code
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {StatusCode}
     */
    public readonly code: StatusCode;
    /**
     * Any instructions the user should follow
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {string}
     */
    public readonly instructions: string;
    /**
     * URL to redirect to
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @public
     * @readonly
     * @type {?string}
     */
    public redirect?: string;
    /**
     * Request object
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
        public readonly data: string,
        req: Req,
    ) {
        this.message = message.message;
        this.color = message.color;
        this.code = message.code;
        this.instructions = message.instructions;
        this.redirect = message.redirect;
        this.request = req;

        // Log the status message in the ./storage/logs/status.csv file
        log('status', {
            ...message,
            data: data ? JSON.stringify(data) : 'No data provided.',
            ip: req.session.ip,
            username: req.session.account?.username,
            sessionId: req.session.id,
        });

        // TODO: Send email to admins if server error
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
     * Generates the HTML for the status message
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @readonly
     * @type {string}
     */
    get html() {
        return getTemplateSync('status', {
            ...this.json,
            page: env.TITLE || 'My App',
            // data: this.data ? JSON.stringify(this.data) : 'No data provided.',
        });
    }

    /**
     * Generates a safe json for the status message (excludes the request object)
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @readonly
     * @type {{ title: string; status: string; message: string; code: StatusCode; instructions: string; data: any; redirect: string; color: StatusColor; }}
     */
    get json() {
        return {
            title: this.title,
            $status: this.status,
            message: this.message,
            code: this.code,
            instructions: this.instructions,
            data: JSON.parse(this.data || '{}'),
            redirect: this.redirect || '',
            color: this.color,
        };
    }

    /**
     * Sends the status message to the client (either as json or html, depending on the request method)
     * @date 10/12/2023 - 3:26:23 PM
     *
     * @param {Res} res
     */
    send(res: Res) {
        let r: Result<string, FileError> | undefined;
        switch (this.request.method) {
            case 'GET':
                r = this.html;
                break;
            case 'POST':
                return res.status(this.code).json(this.json);
            default:
                r = this.html;
                break;
        }

        if (!r) {
            throw new Error('Unable to get status template');
        }

        if (r.isErr()) {
            throw new Error(r.error);
        }

        res.status(this.code).send(r.value);
    }
}
