export const forgotPassword = ({ link, name }: { link: string, name: string }) => {
    return `
<table style="width: 95%; max-width: 670px; margin: 20px auto; background: #fff; border-radius: 3px; text-align: center; box-shadow: 0 6px 18px 0 rgba(0,0,0,.06);" >
    <tr>
        <td style="height: 40px;"></td>
    </tr>
    <tr>
        <td style="padding: 35px;">
            <div style="width: 100%;">
                <h1 style="color: #1e1e2d; margin: 10px 0; font-size: 35px; font-weight: 300; text-transform: capitalize;">
                    Hi ${name},
                </h1>
                <p style="color: #1e1e2d; font-size: 18px; margin: 10px 0;">We received a request to reset your password for your Shortlet-Lagos account.</p>
                <p style="color: #1e1e2d; font-size: 16px; margin: 10px 0;">To reset your password, please click the link below:</p>
            </div>
            <div style="margin-top: 15px;">
                <a href=${link} style="text-decoration: none; display: inline-block; background: #F04950; color: #fff; font-weight: 800; text-transform: uppercase; font-size: 20px; padding: 10px 24px; border-radius: 5px; width: 100%;">
                    Reset Password
                </a>
                <p style="color: #1e1e2d; font-size: 16px; margin-top: 10px;">Or copy and paste the following link into your browser:</p>
                <div style="background: #eee; padding: 10px; border-radius: 5px; word-wrap: break-word; margin-top: 10px;">
                    <code style="font-size: 14px;">${link}</code>
                </div>
            </div>
            <p style="color: #1e1e2d; font-size: 16px; margin: 20px 0;">If you did not request a password reset, you can ignore this email.</p>
        </td>
    </tr>
    <tr>
        <td style="height: 40px;"></td>
    </tr>
</table>
`;
};