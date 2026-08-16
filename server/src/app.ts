import express, {
  type ErrorRequestHandler,
  type Express,
  type RequestHandler,
} from 'express';

import { healthRouter } from './routes/health.ts';

const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: {
      code: 'not_found',
      message: 'Route not found',
    },
  });
};

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unhandled server error:', message);
  }

  response.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Internal server error',
    },
  });
};

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(healthRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
