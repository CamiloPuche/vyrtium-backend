import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './errors/errorHandler';
import { httpLogger } from './utils/logger';

const app: Application = express();

// HTTP Request Logger
app.use(httpLogger);

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4000',
    credentials: true,
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: System health check
 *     description: Returns the health status and current timestamp of the API.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is healthy and operational.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
