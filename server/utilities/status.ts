import { LogType, getJSONSync, getTemplateSync, log } from "./files.ts";
import Account from "../structure/accounts.ts";
import { Email, EmailType } from "./email.ts";
import { Session } from "../structure/sessions.ts";
import { Server } from "npm:socket.io";
import env from "./env.ts";
import {  StatusCode, StatusMessage, StatusColor } from "../../shared/status.ts";
import { messages, StatusId } from "../../shared/status-messages.ts";
import { Req, Res, Next, ServerFunction } from "../structure/app.ts";

declare global {
    namespace Express {
        interface Request {
            session: Session;
            start: number;
            io: Server;
        }
    }
}




export class Status {
    static middleware(id: StatusId, test: (session: Session) => boolean): ServerFunction {
        return (req: Req, res: Res, next: Next) => {
            if (test(req.session)) {
                next();
            } else {
                const status = Status.from(id, req);
                status.send(res);
            }
        }
    }






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




    public readonly message: string;
    public readonly color: StatusColor;
    public readonly code: StatusCode;
    public readonly instructions: string;
    public readonly data: string;
    public readonly redirect?: string;
    public readonly request: Req;



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

    get html() {
        return getTemplateSync('status', {
            ...this,
            data: this.data ? JSON.stringify(this.data) : 'No data provided.'
        });
    }

    get json() {
        return {
            title: this.title,
            status: this.status,
            message: this.message,
            code: this.code,
            instructions: this.instructions,
            data: JSON.parse(this.data || '{}'),
            redirect: this.redirect
        }
    }

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