import { UpsCarrier } from '../../src/carriers/ups/ups-carrier';
import { HttpClient } from '../../src/http/http-client';
import { RateLimitError, AuthenticationError, ApiError, ValidationError } from '../../src/types/errors';
import errorResponses from '../fixtures/ups-error-responses.json';
import tokenResponse from '../fixtures/ups-token-response.json';
import { RateRequest } from '../../src/types/rate';

// Mock HttpClient locally to force errors
class ErrorMockHttpClient extends HttpClient {
    constructor(private errorScenario: string) {
        super();
    }

    public async request<T>(config: any, carrierName: string): Promise<T> {
        const isAuthRequest = config.url && config.url.includes('oauth');
        const isRateRequest = config.url && (config.url.includes('rating') || config.url.includes('Shop'));

        // SCENARIO 1: Rate Limit on API (Auth succeeds)
        if (this.errorScenario === 'SCENARIO_RATE_LIMIT') {
            if (isAuthRequest) {
                return tokenResponse as unknown as T;
            }
            if (isRateRequest) {
                try {
                    const error: any = new Error('Request failed with status 429');
                    error.response = { status: 429, headers: { 'retry-after': '10' }, data: {} };
                    error.isAxiosError = true;
                    throw error;
                } catch (e) {
                    this.handleError(e, carrierName);
                }
            }
        }

        // SCENARIO 2: Auth Failure (401 on Auth)
        if (this.errorScenario === 'SCENARIO_AUTH_FAILURE') {
            if (isAuthRequest) {
                try {
                    const error: any = new Error('Request failed with status 401');
                    error.response = { status: 401, data: errorResponses.unauthorized };
                    error.isAxiosError = true;
                    throw error;
                } catch (e) {
                    this.handleError(e, carrierName);
                }
            }
        }

        throw new Error(`Unexpected request in test: ${config.url}`);
    }
}

describe('UPS Error Handling', () => {
    const config = {
        clientId: 'test',
        clientSecret: 'test',
        accountNumber: '123',
        baseUrl: 'http://test',
        authUrl: 'http://test/oauth/token'
    };

    const validRequest: RateRequest = {
        origin: { name: 'Test', street1: '123 St', city: 'City', stateProvince: 'ST', postalCode: '12345', countryCode: 'US' },
        destination: { name: 'Test', street1: '123 St', city: 'City', stateProvince: 'ST', postalCode: '12345', countryCode: 'US' },
        packages: [{ weight: { value: 10, unit: 'LBS' }, dimensions: { length: 10, width: 10, height: 10, unit: 'IN' } }]
    };

    it('should throw RateLimitError explicitly when Rate API is limited', async () => {
        const mockHttp = new ErrorMockHttpClient('SCENARIO_RATE_LIMIT');
        const carrier = new UpsCarrier(config, mockHttp);

        await expect(carrier.getRates(validRequest)).rejects.toThrow(RateLimitError);
    });

    it('should throw AuthenticationError when Auth API fails (401)', async () => {
        const mockHttp = new ErrorMockHttpClient('SCENARIO_AUTH_FAILURE');
        const carrier = new UpsCarrier(config, mockHttp);

        await expect(carrier.getRates(validRequest)).rejects.toThrow(AuthenticationError);
    });

    it('should throw ValidationError on invalid input', async () => {
        const carrier = new UpsCarrier(config);
        const invalidRequest = {} as any;

        await expect(carrier.getRates(invalidRequest)).rejects.toThrow(ValidationError);
    });
});
