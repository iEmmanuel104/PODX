import EmailTemplate from './templates';
import { logger } from '../logger';
import {
    EMAIL_HOST_ADDRESS,
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REFRESH_TOKEN,
    OAUTH_ACCESS_TOKEN,
    // POSTMARK_API_KEY,
    // NODE_ENV,
} from '../constants';
import nodemailer from 'nodemailer';
// import * as postmark from 'postmark';

export type postmarkInfo = {
    postMarkTemplateData: Record<string, unknown>;
    receipientEmail: string
}

type EmailOptions = {
    email: string;
    subject: string;
    html?: string;
    from?: string;
    message?: string;
    attachments?: [];
    // sendgrid
    isTemplate?: boolean;
    templateId?: string;
    templateData?: object;
    //postmark
    isPostmarkTemplate?: boolean;
    postMarkTemplateAlias?: string;
    postmarkInfo?: postmarkInfo[]
};

// eslint-disable-next-line no-unused-vars
type SendEmailFunction = (options: EmailOptions) => Promise<void | Error>;

export default class EmailService {
    private sendEmail: SendEmailFunction;

    constructor(service: string) {
        switch (service) {
            case 'nodemailer':
                this.sendEmail = this.createNodemailerEmail();
                break;
            // case 'postmark':
            //     this.sendEmail = this.createPostmarkEmail();
            //     break;
            default:
                throw new Error('Invalid email service specified');
        }
    }
    private createNodemailerEmail(): SendEmailFunction {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: EMAIL_HOST_ADDRESS,
                clientId: OAUTH_CLIENT_ID,
                clientSecret: OAUTH_CLIENT_SECRET,
                refreshToken: OAUTH_REFRESH_TOKEN,
                accessToken: OAUTH_ACCESS_TOKEN,
            },
        });

        return async (options) => {
            logger.info('options for sending', options);

            try {

                // Use Promise.all to wait for all emails to be sent
                await Promise.all((options.postmarkInfo ?? []).map(async (recipient) => {
                    const mailOptions = {
                        from: `Shortlet-Lagos Accounts<${EMAIL_HOST_ADDRESS}>`,
                        to: recipient.receipientEmail,
                        subject: options.subject,
                        html: options.html ? options.html : undefined,
                        attachments: options.attachments,
                    };

                    try {
                        await transporter.sendMail(mailOptions);
                        logger.info(`Email sent to ${recipient}`);
                    } catch (error) {
                        // Log the error without throwing it
                        logger.error(`Error sending email to ${recipient}: ${error}`);
                    }
                }));
            } catch (error) {
                logger.error('Error sending email:', error);
            }
        };

    }

    // static getSenderEmail(type: string) {
    //     switch (type) {
    //     case 'auth':
    //         return 'accounts@blkat.io';
    //     case 'support':
    //         return 'support@Shortlet-Lagos.com';
    //     case 'vibes':
    //         return 'vibes@Shortlet-Lagos.com';
    //     default:
    //         return 'accounts@Shortlet-Lagos.com';
    //     }
    // }

    // private createPostmarkEmail(): SendEmailFunction {
    //     const postmarkClient = new postmark.ServerClient(POSTMARK_API_KEY);

    //     return async (options) => {
    //         const senderEmail = EmailService.getSenderEmail(options.from ? options.from : 'auth');
    //         let emailMessages: postmark.Message[] = [];
    //         let emailsWithTemplateMessages: postmark.TemplatedMessage[] = [];

    //         if (
    //             options.isPostmarkTemplate
    //             && options.postMarkTemplateAlias
    //             && options.postmarkInfo
    //             && options.email === 'batch'
    //         ) {
    //             logger.info('Using Postmark Template');
    //             console.log('options.postmarkInfo', options.postmarkInfo);
    //             emailsWithTemplateMessages = (options.postmarkInfo).map((recipient) => {
    //                 const message: postmark.TemplatedMessage = {
    //                     From: senderEmail,
    //                     To: recipient.receipientEmail,
    //                     Attachments: options.attachments ? options.attachments : [],
    //                     TemplateModel: recipient.postMarkTemplateData as Record<string, unknown>,
    //                     TemplateAlias: options.postMarkTemplateAlias,
    //                     ...(senderEmail === 'vibes@Shortlet-Lagos.com' ? { MessageStream: 'vibes' } : {}),
    //                 };
    //                 return message;
    //             });
    //         } else {
    //             const recipientEmails = options.email.split(',').map((email) => email.trim());
    //             logger.info('Using Postmark Standard Email');
    //             emailMessages = recipientEmails.map((recipient) => {
    //                 const message: postmark.Message = {
    //                     From: senderEmail,
    //                     To: recipient,
    //                     Subject: options.subject,
    //                     HtmlBody: options.html ? options.html : undefined,
    //                     TextBody: options.message,
    //                     Attachments: options.attachments ? options.attachments : [],
    //                 };
    //                 return message;
    //             });
    //         }

    //         try {
    //             let response;
    //             if (options.isPostmarkTemplate && emailsWithTemplateMessages.length > 0) {
    //                 console.log('emailsWithTemplateMessages', emailsWithTemplateMessages);
    //                 response = await postmarkClient.sendEmailBatchWithTemplates(emailsWithTemplateMessages);
    //             } else {
    //                 response = await postmarkClient.sendEmailBatch(emailMessages);
    //             }

    //             logger.info('Email sent to recipients');
    //             logger.info('========RESPONSE========', response);
    //             // log the response status code and message
    //             logger.info(response[0].ErrorCode);
    //             logger.info(response[0].Message);
    //         } catch (error) {
    //             logger.error('Error sending postmark email');
    //             logger.error(error);
    //         }
    //     };
    // }


    public send(options: EmailOptions): Promise<void | Error> {
        console.log('sending email');
        return this.sendEmail(options);
    }
}

const emailService = new EmailService('nodemailer');

// let emailService: EmailService;

// if (NODE_ENV === 'production') {
//     console.log('Using LIVE - postmark');
//     // emailService = new EmailService('postmark');
//     // console.log('Using DEV - Nodemailer');
//     emailService = new EmailService('nodemailer');
// } else {
//     console.log('Using DEV - Nodemailer');
//     // emailService = new EmailService('postmark');
//     emailService = new EmailService('nodemailer');
// }

export { EmailTemplate, emailService };
