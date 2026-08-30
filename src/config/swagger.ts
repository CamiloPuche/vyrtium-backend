import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Vyrtium Management API',
      version: '1.0.0',
      description:
        'RESTful API for Vyrtium products, categories management, and user authentication.',
      contact: {
        name: 'Vyrtium Engineering Team',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current Server (Auto-detected)',
      },
      {
        url: 'https://vyrtium-backend.onrender.com',
        description: 'Production Server (Render)',
      },
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
