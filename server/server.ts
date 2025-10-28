import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';
import { env } from "./config/env";

const PORT = parseInt(env.PORT || '5000', 10);
const MONGO_URI = env.MONGO_URI || 'mongodb://127.0.0.1:27017/auto-entrepreneur-dashboard';

let server: import('http').Server | undefined;

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    server = app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

async function shutdown(code = 0) {
  try {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (err) {
    // optionally log err
  } finally {
    process.exit(code);
  }
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  shutdown(1);
});

start();
