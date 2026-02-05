import { z } from 'zod';
import { AddressSchema } from './address';
import { PackageSchema } from './package';

export const RateRequestSchema = z.object({
    origin: AddressSchema,
    destination: AddressSchema,
    packages: z.array(PackageSchema).min(1, "At least one package is required"),
    serviceLevel: z.string().optional(),
    pickupDate: z.date().optional(),
});

export type RateRequest = z.infer<typeof RateRequestSchema>;

export const RateQuoteSchema = z.object({
    carrier: z.string(),
    service: z.string(),
    serviceCode: z.string(),
    totalCost: z.object({
        amount: z.number(),
        currency: z.string(),
    }),
    transitDays: z.number().optional(),
    deliveryDate: z.string().optional(),
    meta: z.record(z.string(), z.any()).optional(), // Carrier-specific metadata
});

export type RateQuote = z.infer<typeof RateQuoteSchema>;

export const RateResponseSchema = z.object({
    request: RateRequestSchema,
    quotes: z.array(RateQuoteSchema),
    timestamp: z.date(),
});

export type RateResponse = z.infer<typeof RateResponseSchema>;
