import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDb } from './db/schema.js';
import patentRoutes from './routes/patents.js';
import alertRoutes from './routes/alerts.js';
import exportRoutes from './routes/export.js';
import competitorRoutes from './routes/competitors.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize database
getDb();

// Routes
app.use('/api/patents', patentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/competitors', competitorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasToken: !!process.env.LENS_API_TOKEN,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Patent Radar API running on port ${PORT}`);
  console.log(`Lens API token: ${process.env.LENS_API_TOKEN ? 'configured' : 'NOT SET (using mock data)'}`);
});
