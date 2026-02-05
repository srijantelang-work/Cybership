import { z } from 'zod';

export const PackageSchema = z.object({
    weight: z.object({
        value: z.number().positive("Weight must be positive"),
        unit: z.enum(['LBS', 'KGS']),
    }),
    dimensions: z.object({
        length: z.number().positive(),
        width: z.number().positive(),
        height: z.number().positive(),
        unit: z.enum(['IN', 'CM']),
    }),
});

export type Package = z.infer<typeof PackageSchema>;
