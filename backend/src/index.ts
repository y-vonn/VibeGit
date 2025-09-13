import express, { Request, Response } from 'express';
import { buildInfo } from '@vibe/shared';
import healthRouter from './routes/health.js';

const app = express();
const portEnv = process.env.PORT;

app.use('/health', healthRouter);
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Backend OK', build: buildInfo() });
});

const server = app.listen(portEnv ? Number(portEnv) : 0, () => {
  const addressInfo = server.address();
  const actualPort = typeof addressInfo === 'object' && addressInfo ? addressInfo.port : portEnv;
  console.log(`[backend] listening on http://localhost:${actualPort}`);
});
