import fs from 'fs';
import path from 'path';
import mongoose, { ConnectOptions } from 'mongoose';
import { env } from './env';
import { URL } from 'url';

function resolveTlsFile(filePath?: string) {
  if (!filePath) return undefined;

  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Mongo TLS file not found: ${absolutePath}`);
  }

  return absolutePath;
}

export function buildMongoConnectionOptions(): ConnectOptions {
  const options: ConnectOptions = {
    serverSelectionTimeoutMS: 5000,
  };

  if (env.MONGO_TLS_REQUIRED) {
    options.tls = true;
    options.tlsAllowInvalidCertificates = false;
    options.tlsInsecure = false;

    const caFile = resolveTlsFile(env.MONGO_TLS_CA_FILE);
    if (caFile) {
      options.tlsCAFile = caFile;
    }

    const certKeyFile = resolveTlsFile(env.MONGO_TLS_CERT_KEY_FILE);
    if (certKeyFile) {
      options.tlsCertificateKeyFile = certKeyFile;
    }
  }

  return options;
}

export async function connectToDatabase() {
  const options = buildMongoConnectionOptions();
  // Prefer SCRAM-SHA-256 only when credentials are provided in the URI.
  try {
    const u = new URL(env.MONGO_URI);
    if (u.username) {
      (options as any).authMechanism = 'SCRAM-SHA-256';
    }
  } catch {
    // If URL parsing fails, do not force auth mechanism.
  }
  if (env.IS_PROD && !env.MONGO_TLS_REQUIRED) {
    throw new Error('Mongo TLS is required in production. Set MONGO_TLS_REQUIRED=true.');
  }

  await mongoose.connect(env.MONGO_URI, options);

  if (!env.MONGO_TLS_REQUIRED && env.NODE_ENV !== 'test') {
    console.warn('Mongo TLS is disabled. Enable MONGO_TLS_REQUIRED=true before deploying.');
  }

  // Runtime assertion: ensure driver didn't flip insecure TLS flags.
  const conn = mongoose.connection.getClient();
  const mongoOpts: any = (conn as any).options || {};
  if (mongoOpts.rejectUnauthorized === false) {
    throw new Error('Insecure TLS: rejectUnauthorized=false detected. Remove this setting.');
  }
}
