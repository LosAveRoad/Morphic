import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './api/middleware/error-handler';
import authRoutes from './api/routes/auth';
import recommendRoutes from './api/routes/recommend';
import generateRoutes from './api/routes/generate';
import redoRoutes from './api/routes/redo';
import type { ApiResponse } from './types';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recommendations', recommendRoutes);
app.use('/api/content/generate', generateRoutes);
app.use('/api/content/redo', redoRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  const body: ApiResponse = { success: true, data: { status: 'ok' } };
  res.json(body);
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Morphic backend running on port ${config.port}`);
});

export default app;
