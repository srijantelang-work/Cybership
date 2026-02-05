import { z } from 'zod';

// ============================================
// UPS API Response Schemas (Zod)
// ============================================

export const UPSServiceSchema = z.object({
    Code: z.string(),
    Description: z.string().optional().default('UPS Service'),
});

export const UPSTotalChargesSchema = z.object({
    CurrencyCode: z.string(),
    MonetaryValue: z.string(),
});

export const UPSGuaranteedDeliverySchema = z.object({
    BusinessDaysInTransit: z.string().optional(),
    DeliveryByTime: z.string().optional(),
}).optional();

export const UPSRatedShipmentSchema = z.object({
    Service: UPSServiceSchema,
    TotalCharges: UPSTotalChargesSchema,
    GuaranteedDelivery: UPSGuaranteedDeliverySchema,
    RatedShipmentAlert: z.array(z.object({
        Code: z.string(),
        Description: z.string(),
    })).optional(),
});

export const UPSResponseStatusSchema = z.object({
    Code: z.string(),
    Description: z.string().optional(),
});

export const UPSRateResponseSchema = z.object({
    RateResponse: z.object({
        Response: z.object({
            ResponseStatus: UPSResponseStatusSchema,
            Alert: z.array(z.object({
                Code: z.string(),
                Description: z.string(),
            })).optional(),
        }),
        RatedShipment: z.union([
            z.array(UPSRatedShipmentSchema),
            UPSRatedShipmentSchema, // UPS sometimes returns single object instead of array
        ]).transform((val) => Array.isArray(val) ? val : [val]),
    }),
});

// Infer types from schemas
export type UPSRatedShipment = z.infer<typeof UPSRatedShipmentSchema>;
export type UPSRateResponse = z.infer<typeof UPSRateResponseSchema>;

// ============================================
// OAuth Token Response Schema
// ============================================

export const UPSTokenResponseSchema = z.object({
    access_token: z.string(),
    expires_in: z.string(),
    token_type: z.string(),
    status: z.string().optional(),
    issued_at: z.string().optional(),
    client_id: z.string().optional(),
});

export type TokenResponse = z.infer<typeof UPSTokenResponseSchema>;

// ============================================
// UPS API Request Types (unchanged)
// ============================================

export interface UPSAddress {
    AddressLine: string[];
    City: string;
    StateProvinceCode: string;
    PostalCode: string;
    CountryCode: string;
}

export interface UPSPackageWeight {
    UnitOfMeasurement: {
        Code: string;
        Description?: string;
    };
    Weight: string;
}

export interface UPSPackageDimensions {
    UnitOfMeasurement: {
        Code: string;
        Description?: string;
    };
    Length: string;
    Width: string;
    Height: string;
}

export interface UPSPackage {
    PackagingType: {
        Code: string;
        Description?: string;
    };
    Dimensions?: UPSPackageDimensions;
    PackageWeight: UPSPackageWeight;
}

export interface UPSRateRequest {
    RateRequest: {
        Request: {
            RequestOption: string;
            TransactionReference?: {
                CustomerContext: string;
            };
        };
        Shipment: {
            Shipper: {
                Name: string;
                Address: UPSAddress;
            };
            ShipTo: {
                Name: string;
                Address: UPSAddress;
            };
            ShipFrom: {
                Name: string;
                Address: UPSAddress;
            };
            Package: UPSPackage[];
            Service?: {
                Code: string;
                Description?: string;
            };
        };
    };
}
