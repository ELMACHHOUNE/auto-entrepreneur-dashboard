import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  // Database
  MONGO_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, { message: "MONGO_URI must start with mongodb:// or mongodb+srv://" }),

  // Security
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  COOKIE_SECRET: z.string().min(16, "COOKIE_SECRET must be at least 16 characters"),

  // Auth providers (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  // CORS
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  CORS_ORIGINS: z.string().optional(), // comma-separated

  // Misc
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10)
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const base = parsed.data;
const corsOriginArray =
  base.CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ??
  [base.CLIENT_ORIGIN];

export const env = {
  NODE_ENV: base.NODE_ENV,
  PORT: String(base.PORT),
  MONGO_URI: base.MONGO_URI,

  JWT_SECRET: base.JWT_SECRET,
  COOKIE_SECRET: base.COOKIE_SECRET,

  CORS_ORIGINS: corsOriginArray,

  GOOGLE_CLIENT_ID: base.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: base.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: base.GOOGLE_CALLBACK_URL,

  BCRYPT_SALT_ROUNDS: base.BCRYPT_SALT_ROUNDS
};
