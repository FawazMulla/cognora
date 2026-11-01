import { z } from 'zod';

/**
 * Environment variable schema with Zod validation.
 * Validation runs at module import time, so a missing required variable
 * will throw a descriptive error before the application can serve requests.
 */
const envSchema = z.object({
  // ── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),

  // ── Supabase ──────────────────────────────────────────────────────────────
  SUPABASE_URL: z.string().url({ message: 'SUPABASE_URL must be a valid URL' }),
  SUPABASE_ANON_KEY: z.string().min(1, { message: 'SUPABASE_ANON_KEY is required' }),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, { message: 'SUPABASE_SERVICE_ROLE_KEY is required' }),

  // ── Redis ─────────────────────────────────────────────────────────────────
  REDIS_URL: z.string().url({ message: 'REDIS_URL must be a valid URL' }),

  // ── Auth secret (at least one must be provided) ───────────────────────────
  NEXTAUTH_SECRET: z
    .string()
    .min(32, {
      message: 'NEXTAUTH_SECRET must be at least 32 characters long',
    })
    .optional(),
  JWT_SECRET: z
    .string()
    .min(32, { message: 'JWT_SECRET must be at least 32 characters long' })
    .optional(),

  // ── Runtime ───────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ── Optional AI provider keys ─────────────────────────────────────────────
  OPENAI_API_KEY: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
  GOOGLE_AI_API_KEY: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
  COHERE_API_KEY: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),

  // ── OCI Generative AI ──────────────────────────────────────────────────────
  OCI_ENABLED: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
  OCI_REGION: z.string().optional().default('us-chicago-1'),
  OCI_COMPARTMENT_ID: z
    .string()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined)),
  OCI_CONFIG_FILE: z.string().optional().default('~/.oci/config'),
  OCI_PROFILE: z.string().optional().default('DEFAULT'),
  OCI_MODEL_ID: z.string().optional().default('cohere.command-a-03-2025'),
  OCI_USER_OCID: z
    .string()
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : process.env['user']?.trim() || undefined,
    ),
  OCI_FINGERPRINT: z
    .string()
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : process.env['fingerprint']?.trim() || undefined,
    ),
  OCI_TENANCY_OCID: z
    .string()
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : process.env['tenancy']?.trim() || undefined,
    ),
  OCI_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((val) =>
      val && val.trim().length > 0 ? val.trim() : process.env['key_file']?.trim() || undefined,
    ),
});

/**
 * Refine to ensure at least one of NEXTAUTH_SECRET or JWT_SECRET is provided.
 */
const refinedEnvSchema = envSchema.refine(
  (data) => data.NEXTAUTH_SECRET !== undefined || data.JWT_SECRET !== undefined,
  {
    message: 'Either NEXTAUTH_SECRET or JWT_SECRET must be provided (minimum 32 characters)',
    path: ['NEXTAUTH_SECRET'],
  },
);

function parseEnv() {
  const result = refinedEnvSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `\n❌ Invalid environment variables:\n${formatted}\n\n` +
        `Copy .env.example to .env and fill in the required values.\n`,
    );
  }

  return result.data;
}

export const env = parseEnv();

/** The effective auth secret — prefers NEXTAUTH_SECRET, falls back to JWT_SECRET. */
export const authSecret = (env.NEXTAUTH_SECRET ?? env.JWT_SECRET) as string;
