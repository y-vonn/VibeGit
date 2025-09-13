import { Router, Request, Response } from 'express';
import { buildInfo, HealthResponse } from '@vibe/shared';

const router = Router();

router.get('/', (_req: Request, res: Response<HealthResponse>) => {
  res.json({ status: 'ok', time: new Date().toISOString(), build: buildInfo() });
});

export default router;
