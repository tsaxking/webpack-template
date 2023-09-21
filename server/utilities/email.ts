import nodemailer from 'npm:nodemailer';
import sgTransport from 'npm:nodemailer-sendgrid-transport';
import { config } from 'npm:dotenv';
import { getTemplateSync } from './files.ts';
import env from './env.ts';

config();

const transporter = nodemailer.createTransport(sgTransport({
        service: 'gmail',
        auth: {
            api_key: env.SENDGRID_API_KEY
        }
    }));




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



export enum EmailType {
    link,
    text,
    error
}

export class Email {
    constructor(
        public to: string | string[],
        public subject: string,
        public type: EmailType,
        public options: EmailOptions
    ) {}


    send() {
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
    }
}