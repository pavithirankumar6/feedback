import express from 'express';
import authRoutes from './routes/authRoutes.js';
import formRoutes from './routes/formRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

export function createApp() {
  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    const allowAnyOrigin = allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production';
    const isAllowedOrigin = requestOrigin && allowedOrigins.includes(requestOrigin);

    if (allowAnyOrigin && requestOrigin) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
    } else if (isAllowedOrigin) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
    }

    if (allowAnyOrigin || isAllowedOrigin) {
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/forms', formRoutes);
  app.use('/api/student', studentRoutes);

  return app;
}

export default createApp;
