import app from './app.js';
import { connectDB } from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`[KiranaCloud Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    const shutdown = () => {
      console.log('[KiranaCloud Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[KiranaCloud Server] Closed remaining connections.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('[KiranaCloud Server] Failed to start:', err.message);
    process.exit(1);
  }
};

startServer();
