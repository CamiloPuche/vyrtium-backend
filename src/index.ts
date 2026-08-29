import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './utils/logger';
import { AppDataSource } from './config/database';

const PORT = process.env.PORT || 4000;

const startServer = async (): Promise<void> => {
  try {
    // 1. Initialize PostgreSQL Database Connection
    await AppDataSource.initialize();
    logger.info('Database connection established successfully');

    // 2. Start HTTP Server
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`Swagger Docs available at http://localhost:${PORT}/api/docs`);
      logger.info(`Health check at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
