import swaggerJSDoc from 'swagger-jsdoc';
import { swaggerPaths } from './swagger.paths';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation for my Express app',
    },
    // Relative server so Swagger "Try it out" works on any host (local + deployed)
    servers: [
      {
        url: '/',
        description: 'Current origin',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: { ...swaggerPaths },
  },
  // Paths are defined in swagger.paths.ts (swagger-jsdoc file scanning was empty:
  // `apis: ['./src/*.ts']` only matched top-level files and there were no @openapi comments.)
  apis: [] as string[],
};

export const swaggerSpec = swaggerJSDoc(options);
