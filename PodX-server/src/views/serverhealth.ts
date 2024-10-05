import { LOGO } from '../utils/constants';
interface ServerHealth {
    serverStatus: string;
    message: string;
    documentation: string;
    client: string;
    admin: string;
}
export const serverHealth = ({ serverStatus, message, documentation, client, admin }: ServerHealth) => {
    return `
<!DOCTYPE html >
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Health Check</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
        }

        header {
            background-color: #007BFF;
            padding: 20px;
            color: #fff;
        }

        .logo {
            max-width: 100px;
            max-height: 100px;
        }

        h1 {
            color: #000000;
        }

        .status {
            font-size: 20px;
            font-weight: bold;
            color: #28a745;
        }

        .message {
            font-size: 16px;
            color: #333;
        }

        .button-container {
            margin-top: 20px;
        }

        .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 0 10px;
            font-size: 16px;
            color: #fff;
            text-decoration: none;
            background-color: #007BFF;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <header>
        <img class="logo" src=${ LOGO } alt="logo">
        <h1>Server Health Check</h1>
    </header>

    <div class="content">
        <p class="status">Status: ${serverStatus}</p>
        <p class="message">${ message }</p>

        <div class="button-container">
            <a href=${ documentation } class="button">Documentation</a>
            <a href=${ client } class="button">Client Side Live Website</a>
            <a href=${ admin } class="button">Admin Dashboard</a>
        </div>
    </div>
</body>
</html>
`;
};
