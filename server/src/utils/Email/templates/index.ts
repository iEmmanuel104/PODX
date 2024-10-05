import { container } from './container';
import { accountActivation } from './accountactivation';
import { forgotPassword } from './forgotpassword';
import { emailInvite } from './referral';
import { certificate } from './certificateTemplate';
import { adminLogin } from './adminLogin';


class EmailTemplate {

    forgotPassword = async ({ link, name }: { link: string, name: string }) => {
        return container(forgotPassword({ link, name }));
    };
    accountActivation = async ({ otpCode, name }: { otpCode: string, name: string }) => {
        return container(await accountActivation(otpCode, name));
    };
    adminLogin = async ({ otpCode, name }: { otpCode: string, name: string }) => {
        return container(await adminLogin(otpCode, name));
    };
    emailInvite = async ({ link, name }: { link: string, name: string }) => {
        return container(await emailInvite(link, name));
    };

    certificate = async ({ name, propertyTitle, instructorName, date }: { name: string, propertyTitle: string, instructorName: string, date: string }) => {
        const certificateTemplate = await certificate({ name, propertyTitle, instructorName, date });
        return certificateTemplate;
    }
}

export default EmailTemplate;
