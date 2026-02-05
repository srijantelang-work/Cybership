import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const configSchema = z.object({
    UPS_CLIENT_ID: z.string().min(1, "UPS_CLIENT_ID is required"),
    UPS_CLIENT_SECRET: z.string().min(1, "UPS_CLIENT_SECRET is required"),
    UPS_ACCOUNT_NUMBER: z.string().min(1, "UPS_ACCOUNT_NUMBER is required"),
    UPS_API_BASE_URL: z.string().url("UPS_API_BASE_URL must be a valid URL"),
    UPS_OAUTH_URL: z.string().url("UPS_OAUTH_URL must be a valid URL"),
});

const processEnv = {
    UPS_CLIENT_ID: process.env.UPS_CLIENT_ID,
    UPS_CLIENT_SECRET: process.env.UPS_CLIENT_SECRET,
    UPS_ACCOUNT_NUMBER: process.env.UPS_ACCOUNT_NUMBER,
    UPS_API_BASE_URL: process.env.UPS_API_BASE_URL,
    UPS_OAUTH_URL: process.env.UPS_OAUTH_URL,
};

// Validate config
const parsedConfig = configSchema.safeParse(processEnv);

if (!parsedConfig.success) {
    console.error("❌ Invalid configuration:", parsedConfig.error.format());
    throw new Error("Invalid configuration");
}

export const config = parsedConfig.data;
