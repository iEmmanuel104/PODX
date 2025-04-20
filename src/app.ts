import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import Middlewares from './middlewares/errorHandlers';
import cors from 'cors';
import expressWinston from 'express-winston';
import { logger } from './utils/logger';
import router from './routes';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { getServerHealth } from './views/serverHealthCheck';
import cookieParser from 'cookie-parser';
import { specs, swaggerUi } from './utils/swagger';
// import { poapManagementService } from './services/poap_management_service';
// import corsOptions from './utils/cors';

const app = express();
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
// app.use(cors(corsOptions));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://podx.fun' 
        : 'http://localhost:3000',
    credentials: true,
}));
app.use(morgan('dev'));
app.use(cookieParser());

// Request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.warn(`Incoming request: ${req.method} ${req.path} ${req.originalUrl} from ${req.ip} at ${new Date().toISOString()}`);
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log('Full Requested URL:', fullUrl);
    next();
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        docExpansion: 'none'
    }
}));

// server health check
app.get('/api/health', getServerHealth);
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

