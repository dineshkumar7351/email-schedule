import { app } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { setupElasticsearch } from './utils/elasticsearch';

// We import the worker so it starts when the server starts
// In a real large-scale deployment, you'd run workers in a separate process.
import './workers/emailWorker';

async function startServer() {
  try {
    await setupElasticsearch();

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Bull Board running on http://localhost:${config.port}/admin/queues`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

startServer();
