import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { departmentRouter } from './routes/department.routes';
import { employeeRouter } from './routes/employee.routes';
import { uploadRouter } from './routes/upload.routes';
import { UPLOADS_DIR } from './middleware/upload';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // Uploaded files are displayed cross-origin by the Angular dev server,
  // so this route needs a relaxed CORP header even though the rest of
  // the API stays same-origin by default (helmet's global setting).
  app.use(
    '/uploads',
    express.static(UPLOADS_DIR, {
      setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
    }),
  );

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/departments', departmentRouter);
  app.use('/api/employees', employeeRouter);
  app.use('/api/uploads', uploadRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
