import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import https from 'https';
import app from './app';
import { env } from './config/env';
import { connectToDatabase } from './config/db';

const PORT = parseInt(env.PORT, 10);

let server: import('http').Server | import('https').Server | undefined;

async function start() {
  try {
    await connectToDatabase();
    console.log('MongoDB connected');

    // Prefer native HTTPS if certificate and key are provided.
    if (env.HTTPS_CERT_FILE && env.HTTPS_KEY_FILE) {
      try {
        const cert = fs.readFileSync(env.HTTPS_CERT_FILE);
        const key = fs.readFileSync(env.HTTPS_KEY_FILE);
        server = https.createServer({ cert, key }, app).listen(PORT, () => {
          console.log(`HTTPS server listening on https://localhost:${PORT}`);
        });
      } catch (e) {
        console.error('Failed to start HTTPS server, falling back to HTTP:', e);
      }
    }
    if (!server) {
      server = app.listen(PORT, () => {
        console.log(`HTTP server listening on http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

async function shutdown(code = 0) {
  try {
    if (server) {
      await new Promise<void>(resolve => server!.close(() => resolve()));
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
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
  shutdown(1);
});
process.on('unhandledRejection', reason => {
  console.error('Unhandled Rejection:', reason);
  shutdown(1);
});

start();
