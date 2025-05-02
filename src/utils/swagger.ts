import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Import our docs to make sure they're included
import "../docs/swagger";
import { NODE_ENV, ORIGIN } from "./constants";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "PodX API Documentation",
            version: "1.0.0",
            description: "API documentation for PodX server",
            contact: {
                name: "PodX Support",
            },
        },
        servers: [
            {
                url: `${ORIGIN}/api/v0`,
                description: NODE_ENV + "Server",
            },
            // {
            //     url: "http://localhost:8090/api/v0",
            //     description: "Alternative Development Server",
            // },
            {
                url: "/api/v0",
                description: "Relative Path",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description:
                        "Use the signature token returned from /user/validate endpoint. Add 'Bearer ' prefix before the token",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        "./src/docs/swagger/*.ts",
        "./src/models/**/*.ts",
        "./src/routes/**/*.ts", // Added routes directory for more complete documentation
    ],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
