import nodemailer from 'nodemailer';
import { sgTransport } from '@neoxia-js/nodemailer-sendgrid-transport';
import { Constructor, FileError, getTemplateSync } from './files';
import env from './env';
import { attemptAsync, Result } from '../../shared/check';

/**
 * Sendgrid transporter, used to send emails
 * @date 10/12/2023 - 3:24:32 PM
 *
 * @type {*}
 */
const transporter = nodemailer.createTransport(
    sgTransport({
        auth: {
            apiKey: env.SENDGRID_API_KEY || ''
        }
    })
);

/**
 * Email options
 * @date 10/12/2023 - 3:24:32 PM
 *
 * @export
 * @typedef {EmailOptions}
 */
export type EmailOptions = {
    attachments?: {
        filename: string;
        path: string;
    }[];
    constructor: Constructor & {
        link?: string;
        linkText?: string;
        title: string;
        message: string;
    };
};

/**
 * Email types
 * @date 10/12/2023 - 3:24:32 PM
 *
 * @export
 * @enum {number}
 */
export enum EmailType {
    link,
    text,
    error
}

/**
 * Email class
 * @date 10/12/2023 - 3:24:32 PM
 *
 * @export
 * @class Email
 * @typedef {Email}
 */
export class Email {
    /**
     * Creates an instance of Email.
     * @date 10/12/2023 - 3:24:32 PM
     *
     * @constructor
     * @param {(string | string[])} to
     * @param {string} subject
     * @param {EmailType} type
     * @param {EmailOptions} options
     */
    constructor(
        public to: string | string[],
        public subject: string,
        public type: EmailType,
        public options: EmailOptions
    ) {}

    /**
     * Sends the email to the specified address in the constructor
     * @date 10/12/2023 - 3:24:32 PM
     *
     * @returns {*}
     */
    send() {
        return attemptAsync(async () => {
            const { to, subject, type, options } = this;
            let { constructor } = options;
            const { attachments } = options;

            constructor = {
                ...(constructor || {}),
                logo: (env.DOMAIN || '') + (env.LOGO || ''),
                homeLink: (env.DOMAIN || '') + (env.HOME_LINK || ''),
                footer: env.FOOTER || ''
            };

            let r: Result<string, FileError> | undefined;

            switch (type) {
                case EmailType.link:
                    r = getTemplateSync('emails/link', constructor);
                    break;
                case EmailType.text:
                    r = getTemplateSync('emails/text', constructor);
                    break;
                case EmailType.error:
                    r = getTemplateSync('emails/error', constructor);
                    break;
                default:
                    break;
            }

            if (!r) {
                throw new Error('Unable to get email template');
            }

            if (r.isOk()) {
                const html = r.value;
                const mailOptions = {
                    from: env.SENDGRID_DEFAULT_FROM,
                    to,
                    subject,
                    html,
                    attachments
                };

                return transporter
                    .sendMail(
                        mailOptions
                        // (err: Error, info: { response: string }) => {
                        //     if (err) {
                        //         console.error(err);
                        //     } else {
                        //         console.log('Email sent: ' + info.response);
                        //         resolve(info);
                        //     }
                        // },
                    )
                    .catch(console.error);
            }

            throw r.error;
        });
    }
}
