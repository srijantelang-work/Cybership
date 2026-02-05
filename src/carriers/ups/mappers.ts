import { RateRequest, RateResponse, RateQuote } from '../../types/rate';
import { Address } from '../../types/address';
import { Package } from '../../types/package';
import { UPSRateRequest, UPSRateResponse, UPSAddress, UPSPackage, UPSRatedShipment } from './types';

export class UPSMapper {
    static toUPSRequest(request: RateRequest): UPSRateRequest {
        return {
            RateRequest: {
                Request: {
                    RequestOption: 'Shop', // Shop for all rates
                },
                Shipment: {
                    Shipper: {
                        Name: request.origin.name,
                        Address: this.toUPSAddress(request.origin),
                    },
                    ShipFrom: {
                        Name: request.origin.name,
                        Address: this.toUPSAddress(request.origin),
                    },
                    ShipTo: {
                        Name: request.destination.name,
                        Address: this.toUPSAddress(request.destination),
                    },
                    Package: request.packages.map(pkg => this.toUPSPackage(pkg)),
                    // If serviceLevel is provided, we could map it here, but 'Shop' request usually omits it to get all rates
                },
            },
        };
    }

    static toRateResponse(upsResponse: UPSRateResponse, originalRequest: RateRequest): RateResponse {
        const shipmentQuotes: UPSRatedShipment[] = Array.isArray(upsResponse.RateResponse.RatedShipment)
            ? upsResponse.RateResponse.RatedShipment
            : [upsResponse.RateResponse.RatedShipment]; // Handle single object response edge case

        const quotes: RateQuote[] = shipmentQuotes.map(quote => ({
            carrier: 'UPS',
            service: quote.Service.Description || 'UPS Service', // Fallback
            serviceCode: quote.Service.Code,
            totalCost: {
                amount: parseFloat(quote.TotalCharges.MonetaryValue),
                currency: quote.TotalCharges.CurrencyCode,
            },
            transitDays: quote.GuaranteedDelivery?.BusinessDaysInTransit
                ? parseInt(quote.GuaranteedDelivery.BusinessDaysInTransit, 10)
                : undefined,
            deliveryDate: undefined, // UPS sometime puts date in diverse formats, keeping simple for now
        }));

        return {
            request: originalRequest,
            quotes,
            timestamp: new Date(),
        };
    }

    private static toUPSAddress(address: Address): UPSAddress {
        const upsAddr: UPSAddress = {
            AddressLine: [address.street1],
            City: address.city,
            StateProvinceCode: address.stateProvince,
            PostalCode: address.postalCode,
            CountryCode: address.countryCode,
        };

        if (address.street2) {
            upsAddr.AddressLine.push(address.street2);
        }

        return upsAddr;
    }

    private static toUPSPackage(pkg: Package): UPSPackage {
        return {
            PackagingType: {
                Code: '02', // Customer Supplied Package
            },
            Dimensions: {
                UnitOfMeasurement: {
                    Code: pkg.dimensions.unit,
                },
                Length: pkg.dimensions.length.toString(),
                Width: pkg.dimensions.width.toString(),
                Height: pkg.dimensions.height.toString(),
            },
            PackageWeight: {
                UnitOfMeasurement: {
                    Code: pkg.weight.unit,
                },
                Weight: pkg.weight.value.toString(),
            },
        };
    }
}
