import winston, { format } from 'winston';
// import { LoggingWinston } from '@google-cloud/logging-winston';
// import { PROJECT_ID, NODE_ENV } from '../utils/constants';
import * as util from 'util';


declare module 'winston' {
    interface Logger {
        payload: winston.LeveledLogMethod;
        authorized: winston.LeveledLogMethod;
        downloading: winston.LeveledLogMethod;
        uploading: winston.LeveledLogMethod;
        tokenType: winston.LeveledLogMethod;
    }
}

const { printf } = format;
const logFormat = printf((info) => {
    let logMessage = `${info.level}:`;

    if (info.message) {
        if (typeof info.message === 'object') {
            logMessage += ` ${util.inspect(info.message, { depth: null, colors: true })}`;
        } else {
            logMessage += ` ${info.message}`;
        }
    }

    if (info[Symbol.for('splat')]) {
        info[Symbol.for('splat')].forEach((item: unknown) => {
            if (typeof item === 'object') {
                logMessage += ` ${util.inspect(item, { depth: null, colors: true })}`;
            } else {
                logMessage += ` ${item}`;
            }
        });
    }

    return logMessage;
});

const customLevels = {
    payload: 0,
    authorized: 1,
    downloading: 2,
    uploading: 3,
    tokenType: 4,
    warn: 5,
    error: 6,
    info: 7,
};

const colorScheme = {
    info: 'cyan',
    error: 'red',
    warn: 'yellow',
    payload: 'blue',
    authorized: 'green',
    downloading: 'magenta',
    uploading: 'cyan',
    tokenType: 'yellow',
};

// let loggingWinston: LoggingWinston | undefined;
// if (NODE_ENV === 'production') {
//     loggingWinston = new LoggingWinston({
//         projectId: PROJECT_ID,
//         levels: customLevels,
//     });
// }

const logger = winston.createLogger({
    levels: customLevels,
    transports: [
        new winston.transports.Console({ // Log to console in production
            level: 'info',
            format: winston.format.combine(
                winston.format.colorize({
                    colors: colorScheme,
                }),
                winston.format.simple(),
                logFormat
            ),
        }),
        // ...(loggingWinston ? [loggingWinston] : []), // Log to Google Cloud Logging in production
    ],
    format: format.combine(
        format.json(),
        format.prettyPrint()
    ),
});


export { logger };
