// UPS Rating API specific types

export interface UPSAddress {
    AddressLine: string[];
    City: string;
    StateProvinceCode: string;
    PostalCode: string;
    CountryCode: string;
}

export interface UPSPackageWeight {
    UnitOfMeasurement: {
        Code: string; // "LBS", "KGS"
        Description?: string;
    };
    Weight: string;
}

export interface UPSPackageDimensions {
    UnitOfMeasurement: {
        Code: string; // "IN", "CM"
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
            ShipFrom: { // Required by UPS, usually same as Shipper
                Name: string;
                Address: UPSAddress;
            };
            Package: UPSPackage[];
            Service?: {
                Code: string;
                Description?: string;
            };  // Optional for "Shop" requests (getting all rates)
        };
    };
}

export interface UPSRatedShipment {
    Service: {
        Code: string;
        Description: string;
    };
    RatedShipmentAlert?: {
        Code: string;
        Description: string;
    }[];
    TotalCharges: {
        CurrencyCode: string;
        MonetaryValue: string;
    };
    GuaranteedDelivery?: {
        BusinessDaysInTransit?: string;
        DeliveryByTime?: string;
    };
}

export interface UPSRateResponse {
    RateResponse: {
        Response: {
            ResponseStatus: {
                Code: string;
                Description: string;
            };
            Alert?: {
                Code: string;
                Description: string;
            }[];
        };
        RatedShipment: UPSRatedShipment[]; // Array because we request multiple rates
    };
}
