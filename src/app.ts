import "express-async-errors";
import express, { Request, Response, NextFunction, Express } from "express";
import cors from "cors";
import expressWinston from "express-winston";
import { logger } from "./utils/logger";
import router from "./routes";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import { specs, swaggerUi } from "./utils/swagger";
import { ORIGIN } from "./utils/constants";
import ServerController from "./controllers/server.controller";
import serverRouter from "./routes/server.routes";
import { CustomAPIError } from "./utils/customErrors";
// import { poapManagementService } from './services/poap_management_service';
// import corsOptions from "./utils/cors";

const app: Express = express();

app.use(
    expressWinston.logger({
        winstonInstance: logger,
        statusLevels: true,
    }),
);
expressWinston.requestWhitelist.push("body");
expressWinston.responseWhitelist.push("body");
app.use(helmet());
app.use(mongoSanitize());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors(corsOptions));
app.use(
    cors({
        origin: ORIGIN,
        credentials: true,
    }),
);

app.use(morgan("dev"));
app.use(cookieParser());

// Request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
    logger.info(
        `Request logged: ${req.method} ${req.path} from ${req.ip} at ${new Date().toISOString()}`,
    );
    logger.info("Full Requested URL:", fullUrl); // Consider using different log levels for better granularity
    next();
});

// Swagger API Documentation
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
        explorer: true,
        swaggerOptions: {
            securityDefinitions: {
                bearerAuth: {
                    type: "apiKey",
                    in: "header",
                    name: "Authorization",
                    description: "Bearer token for API access",
                },
            },
            security: [{ bearerAuth: [] }],
        },
    }),
);

app.use("/api/v0", router);
app.use("/", serverRouter);
// app.use(ServerController.notFound);
app.use("*", (req, res) => {
    ServerController.notFound(req, res);
});

app.use(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (err: CustomAPIError, req: Request, res: Response, next: NextFunction) => {
        ServerController.errorHandler(err, req, res);
    },
);

export default app;
