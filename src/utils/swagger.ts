import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import our docs to make sure they're included
import '../docs/swagger';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PodX API Documentation',
            version: '1.0.0',
            description: 'API documentation for PodX server',
            contact: {
                name: 'PodX Support',
            },
        },
        servers: [
            {
                url: process.env.NODE_ENV === 'production' 
                    ? 'https://api.podx.fun/api/v0' 
                    : `http://localhost:${process.env.PORT || '8054'}/api/v0`,
                description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
            },
            {
                url: 'http://localhost:8090/api/v0',
                description: 'Alternative Development Server',
            },
            {
                url: '/api/v0',
                description: 'Relative Path',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Use the signature token returned from /user/validate endpoint. Add "Bearer " prefix before the token.'
                }
            },
        },
        security: [{
            bearerAuth: []
        }],
    },
    apis: [
        './src/docs/swagger/*.ts',
        './src/models/**/*.ts',
        './src/routes/**/*.ts'  // Added routes directory for more complete documentation
    ],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi }; 