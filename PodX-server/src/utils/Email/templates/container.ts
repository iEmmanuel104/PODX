export const container = (content: string) => {
    return `
<!doctype html>
<html lang="en-US">

<head>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <title>Shortlet-Lagos</title>
    <meta name="description" content="Email Template Container.">
    <style type="text/css">
        a:hover {
            text-decoration: underline !important;
        }
    </style>
</head>

<body marginheight="0" topmargin="0" marginwidth="0"
    style="margin: 0px; background-color: #ffffff; box-sizing: border-box; font-family: 'Open Sans', sans-serif;" leftmargin="0">
    <!-- 100% body table -->
    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#ffffff"
        style="font-family: 'Open Sans', sans-serif;">
        <tr>
            <td>
                <table style="background-color: #ffffff; max-width:670px; margin:0 auto;" width="100%" border="0"
                    align="center" cellpadding="0" cellspacing="0">
                    <tr>
                        <td>
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td style="height: 20px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td style="text-align: center; color: #333;">
                            <p>Thank you for choosing Shortlet-Lagos</p>
                            <p>Best regards,<br>The Shortlet-Lagos Team</p>
                            <p style="font-size: 18px; color: #F04950; line-height: 18px; margin: 0 0 0;">&copy;
                                <strong> Shortlet-Lagos LTD 2024 </strong>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="height: 80px;">&nbsp;</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>`;

};