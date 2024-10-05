export const emailInvite = (link: string, name: string) => {
    return `
    <table style="width: 95%; max-width: 670px; margin: 0 auto; background: #fff; border-radius: 3px; text-align: center; box-shadow: 0 6px 18px 0 rgba(0,0,0,.06);" >
        <tr>
        <td style="height: 40px;"></td>
        </tr>
        <tr>
            <td style="padding: 35px;">
                <div style="width: 100%;">
                    <h1 style="color: #1e1e2d; margin: 10px 0; font-size: 35px; font-weight: 300; font-family: 'Rubik', sans-serif; text-transform: capitalize;">
                        Hello,
                    </h1>
                    <p style="color: #1e1e2d; font-size: 18px; margin: 10px 0;">Your friend ${name} has invited you to join Shortlet-Lagos platform</p>
                    <p style="color: #1e1e2d; font-size: 16px; margin: 10px 0;">Join us today and enjoy the unique benefits we offer. Click the link below to get started:</p>
                </div>
                <div style="margin-top: 15px;">
                    <a href="${link}" style="background: #F04950; color: #fff; font-weight: 800; text-transform: uppercase; font-size: 20px; padding: 10px 24px; display: inline-block; border-radius: 5px; text-decoration: none;">
                        Join Now
                    </a>
                </div>
                <p style="color: #1e1e2d; font-size: 16px; margin: 20px 0;">If you have any questions, feel free to contact us. We're always here to help!</p>
            </td>
        </tr>
        <tr>
            <td style="height: 40px;"></td>
        </tr>
    </table>

        `;
};
