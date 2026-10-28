import app from './app.js';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { seedStoreData } from './scripts/seed.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded regardless of execution working directory
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Ensure demo store account is always available out-of-the-box
    try {
      const demoUser = await User.findOne({ email: 'owner@kiranacloud.com' }).select('+password');
      if (!demoUser) {
        console.log('[KiranaCloud Server] Demo store owner not found. Seeding initial demo store data...');
        await seedStoreData();
      } else {
        const isPasswordValid = await demoUser.comparePassword('password123');
        let needsUpdate = false;
        if (!isPasswordValid) {
          demoUser.password = 'password123';
          needsUpdate = true;
        }
        if (demoUser.storePhone !== '9811234567') {
          demoUser.storePhone = '9811234567';
          needsUpdate = true;
        }
        if (needsUpdate) {
          await demoUser.save();
          console.log('[KiranaCloud Server] Verified and synchronized demo owner credentials.');
        }
      }
    } catch (seedErr) {
      console.warn('[KiranaCloud Server] Warning during demo user check:', seedErr.message);
    }

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
