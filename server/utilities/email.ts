import nodemailer from 'npm:nodemailer';
import sgTransport from 'npm:nodemailer-sendgrid-transport';
import { config } from 'npm:dotenv';
import { getTemplateSync } from './files.ts';
import env from './env.ts';
import { error } from "./terminal-logging.ts";

config();

/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:32 PM
 *
 * @type {*}
 */
const transporter = nodemailer.createTransport(sgTransport({
        service: 'gmail',
        auth: {
            api_key: env.SENDGRID_API_KEY
        }
    }));




/**
 * Description placeholder
 * @date 10/12/2023 - 3:24:32 PM
 *
 * @export
 * @typedef {EmailOptions}
 */
export type EmailOptions = {
    attachments?: {
        filename: string,
        path: string
    }[],
    constructor: {
        link?: string,
        linkText?: string,
        title: string,
        message: string,
        [key: string]: any
    }
}



/**
 * Description placeholder
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
 * Description placeholder
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
     * Description placeholder
     * @date 10/12/2023 - 3:24:32 PM
     *
     * @returns {*}
     */
    send() {try {
        
            const { to, subject, type, options } = this;
            let { attachments, constructor } = options;
    
    
            constructor = {
                ...(constructor || {}),
                logo: (env.DOMAIN || '') + (env.LOGO || ''),
                homeLink: (env.DOMAIN || '') + (env.HOME_LINK || ''),
                footer: (env.FOOTER || '')
            }
    
            let html: string;
            let temp: string|boolean;
            
            switch (type) {
                case EmailType.link:
                    temp = getTemplateSync('./emails/link', constructor);
                    html = typeof temp === 'string' ? temp : '';
                    break;
                case EmailType.text:
                    temp = getTemplateSync('./emails/text', constructor);
                    html = typeof temp === 'string' ? temp : '';
                    break;
                case EmailType.error:
                    temp = getTemplateSync('./emails/error', constructor);
                    html = typeof temp === 'string' ? temp : '';
                    break;
                default:
                    html = '';
                    break;
            }
    
    
            const mailOptions = {
                from: env.SENDGRID_DEFAULT_FROM,
                to,
                subject,
                html,
                attachments
            };
    
            return new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (err: Error, info: { response: string }) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Email sent: ' + info.response);
                        resolve(info);
                    }
                });
            });
    } catch (e) {
        error('Unable to send email:', e);
    }
    }
}