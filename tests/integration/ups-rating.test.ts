import { UpsCarrier } from '../../src/carriers/ups/ups-carrier';
import { MockHttpClient } from '../mocks/http-mock';
import { RateRequest } from '../../src/types/rate';
import tokenResponse from '../fixtures/ups-token-response.json';
import rateResponse from '../fixtures/ups-rate-response.json';

describe('UPS Carrier integration', () => {
    let carrier: UpsCarrier;
    let mockHttp: MockHttpClient;

    const config = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        accountNumber: '123456',
        baseUrl: 'https://onlinetools.ups.com',
        authUrl: 'https://onlinetools.ups.com/security/v1/oauth/token',
    };

    beforeEach(() => {
        mockHttp = new MockHttpClient();
        carrier = new UpsCarrier(config, mockHttp);

        // Mock Auth Token Call
        mockHttp.mockResponse('/oauth/token', tokenResponse);

        // Mock Rating Call
        mockHttp.mockResponse('/rating/v1/Shop', rateResponse);
    });

    it('should successfully get rates', async () => {
        const request: RateRequest = {
            origin: {
                name: 'John Doe',
                street1: '123 Origin St',
                city: 'Timonium',
                stateProvince: 'MD',
                postalCode: '21093',
                countryCode: 'US',
            },
            destination: {
                name: 'Jane Doe',
                street1: '456 Dest St',
                city: 'Timonium',
                stateProvince: 'MD',
                postalCode: '21093',
                countryCode: 'US',
            },
            packages: [
                {
                    weight: { value: 10, unit: 'LBS' },
                    dimensions: { length: 10, width: 10, height: 10, unit: 'IN' },
                },
            ],
        };

        const response = await carrier.getRates(request);

        expect(response).toBeDefined();
        expect(response.quotes).toHaveLength(2);
        expect(response.quotes[0].carrier).toBe('UPS');
        expect(response.quotes[0].service).toBe('UPS Ground');
        expect(response.quotes[0].totalCost.amount).toBe(15.00);
        expect(response.quotes[0].transitDays).toBe(3);
    });
});
