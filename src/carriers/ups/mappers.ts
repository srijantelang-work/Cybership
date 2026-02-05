import { RateRequest, RateResponse, RateQuote } from '../../types/rate';
import { Address } from '../../types/address';
import { Package } from '../../types/package';
import { UPSRateRequest, UPSRateResponse, UPSAddress, UPSPackage, UPSRatedShipment } from './types';

export class UPSMapper {
    static toUPSRequest(request: RateRequest): UPSRateRequest {
        return {
            RateRequest: {
                Request: {
                    RequestOption: 'Shop',
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
                },
            },
        };
    }

    static toRateResponse(upsResponse: UPSRateResponse, originalRequest: RateRequest): RateResponse {
        // RatedShipment is already normalized to array by Zod transform
        const shipmentQuotes: UPSRatedShipment[] = upsResponse.RateResponse.RatedShipment;

        const quotes: RateQuote[] = shipmentQuotes.map(quote => ({
            carrier: 'UPS',
            service: quote.Service.Description ?? 'UPS Service',
            serviceCode: quote.Service.Code,
            totalCost: {
                amount: parseFloat(quote.TotalCharges.MonetaryValue),
                currency: quote.TotalCharges.CurrencyCode,
            },
            transitDays: quote.GuaranteedDelivery?.BusinessDaysInTransit
                ? parseInt(quote.GuaranteedDelivery.BusinessDaysInTransit, 10)
                : undefined,
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
                Code: '02',
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
