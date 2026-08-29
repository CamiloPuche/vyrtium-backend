import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 4000;

const startServer = async (): Promise<void> => {
  try {
    // Database connection will be initialized here in Phase 2
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
