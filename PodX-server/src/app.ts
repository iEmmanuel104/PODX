import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import Middlewares from './middlewares/errorHandlers';
// import bodyParser from 'body-parser';
import cors from 'cors';
import expressWinston from 'express-winston';
import { logger } from './utils/logger';
import router from './routes';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
// import passport from 'passport';
import { getServerHealth } from './views/serverHealthCheck';
import cookieParser from 'cookie-parser';
// import cookieSession from 'cookie-session';
// import { SESSION_SECRET } from './utils/constants';
// import FederationLoginConfig from './clients/passport.config';
const app = express();

// Initialize Passport configuration
// new FederationLoginConfig();

app.use(
    expressWinston.logger({
        winstonInstance: logger,
        statusLevels: true,
    })
);
expressWinston.requestWhitelist.push('body');
expressWinston.responseWhitelist.push('body');
app.use(helmet());
app.use(mongoSanitize());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));
app.use(cookieParser());
// app.use(
//     cookieSession({
//         maxAge: 24 * 60 * 60 * 1000,
//         keys: [SESSION_SECRET],
//     })
// );
// app.use(passport.initialize());
// app.use(passport.session());

// Request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.warn(`Incoming request: ${req.method} ${req.path} ${req.originalUrl} from ${req.ip} at ${new Date().toISOString()}`);
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log('Full Requested URL:', fullUrl);
    next();
});

// server health check
app.get('/serverhealth', getServerHealth);

app.use('/api/v0', router);

app.use(Middlewares.notFound);
app.use(Middlewares.errorHandler);
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found',
    });
});

export default app;

