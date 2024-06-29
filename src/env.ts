import z from 'zod';
import { config } from 'dotenv-vault'

// Env
const envVariables = z.object({
  SUPABASE_API_KEY: z.string(),
  SUPABASE_URL: z.string()
  // OPENAI_API_KEY: z.string()
});

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> { }
  }
}

function error(...args: any) {
  console.error(args);
  return 1; // Stop the server from starting
}

export async function bootStrap() {
  try {

    envVariables.parse({
      SUPABASE_API_KEY: process.env.SUPABASE_API_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL
    });

  } catch (e) {
    console.error(e);
    return 1;
  }
  return 0;
}