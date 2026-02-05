import { z } from 'zod';

export const AddressSchema = z.object({
    name: z.string().min(1, "Name is required"),
    street1: z.string().min(1, "Street1 is required"),
    street2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    stateProvince: z.string().min(1, "State/Province is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    countryCode: z.string().length(2, "Country code must be 2 characters (ISO 3166-1 alpha-2)"),
    isResidential: z.boolean().optional(),
});

export type Address = z.infer<typeof AddressSchema>;
