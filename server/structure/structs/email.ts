import { DB } from '../../utilities/database';
import { Struct } from './struct';
import nodemailer from 'nodemailer';
import { sgTransport } from '@neoxia-js/nodemailer-sendgrid-transport';
import env from '../../utilities/env';
import { Constructor } from 'node-html-constructor/versions/v4';
import { attemptAsync } from '../../../shared/check';
import { getTemplateSync } from '../../utilities/files';

class EmailError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EmailError';
    }
}

export namespace Email {
    const transporter = nodemailer.createTransport(
        sgTransport({
            auth: {
                apiKey: env.SENDGRID_API_KEY || ''
            }
        })
    );

    export type EmailOptions = {
        type: 'link' | 'text' | 'error';
        to: string[] | string;
        subject: string;
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

    export const Email = new Struct({
        database: DB,
        name: 'Email',
        structure: {
            type: 'text',
            recipient: 'text', // string[]
            clicked: 'boolean',
            link: 'text'
        }
    });

    Email.listen('/:id', async (req, res) => {
        const { id } = req.req.params;
        const email = (await Email.fromId(id)).unwrap();
        if (email) {
            res.redirect(email.data.link);
            return email.update({
                clicked: true
            });
        }

        return res.redirect('/404');
    });

    export const send = (data: EmailOptions) => {
        return attemptAsync(async () => {
            const { type, to, attachments, constructor, subject } = data;

            let html = '';

            if (type === 'link') {
                const email = (
                    await Email.new({
                        recipient: [to].flat().join(','),
                        clicked: false,
                        link: constructor.link || '',
                        type
                    })
                ).unwrap();

                constructor.link = `/api/email/${email.id}`;
            }

            switch (type) {
                case 'link':
                    html = getTemplateSync('emails/link', constructor).unwrap();
                    break;
                case 'text':
                    html = getTemplateSync('emails/text', constructor).unwrap();
                    break;
                case 'error':
                    html = getTemplateSync(
                        'emails/error',
                        constructor
                    ).unwrap();
                    break;
            }

            if (!html.length) throw new EmailError('Template not found');

            return await transporter.sendMail({
                from: env.SENDGRID_DEFAULT_FROM,
                to,
                subject,
                html: html,
                attachments
            });
        });
    };
}
