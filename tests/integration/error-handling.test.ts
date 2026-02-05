import { UpsCarrier } from '../../src/carriers/ups/ups-carrier';
import { HttpClient } from '../../src/http/http-client';
import { RateLimitError, AuthenticationError, ValidationError } from '../../src/types/errors';
import { TokenResponse } from '../../src/carriers/ups/types';
import { RateRequest } from '../../src/types/rate';
import { AxiosRequestConfig } from 'axios';

// Mock HttpClient with proper types to force errors
class ErrorMockHttpClient extends HttpClient {
    constructor(private errorScenario: string) {
        super();
    }

    public async request<T>(config: AxiosRequestConfig, carrierName: string): Promise<T> {
        const url = config.url || '';
        const isAuthRequest = url.includes('oauth');
        const isRateRequest = url.includes('rating') || url.includes('Shop');

        // SCENARIO 1: Rate Limit on API (Auth succeeds)
        if (this.errorScenario === 'SCENARIO_RATE_LIMIT') {
            if (isAuthRequest) {
                const tokenResponse: TokenResponse = {
                    access_token: 'mock_token',
                    expires_in: '14399',
                    token_type: 'Bearer',
                };
                return tokenResponse as T;
            }
            if (isRateRequest) {
                const error = new Error('Request failed with status 429') as Error & {
                    response: { status: number; headers: Record<string, string>; data: unknown };
                    isAxiosError: boolean;
                };
                error.response = { status: 429, headers: { 'retry-after': '10' }, data: {} };
                error.isAxiosError = true;
                this.handleError(error, carrierName);
            }
        }

        // SCENARIO 2: Auth Failure (401 on Auth)
        if (this.errorScenario === 'SCENARIO_AUTH_FAILURE') {
            if (isAuthRequest) {
                const error = new Error('Request failed with status 401') as Error & {
                    response: { status: number; data: unknown };
                    isAxiosError: boolean;
                };
                error.response = { status: 401, data: { error: 'unauthorized' } };
                error.isAxiosError = true;
                this.handleError(error, carrierName);
            }
        }

        throw new Error(`Unexpected request in test: ${url}`);
    }
}

describe('UPS Error Handling', () => {
    const config = {
        clientId: 'test',
        clientSecret: 'test',
        accountNumber: '123',
        baseUrl: 'http://test',
        authUrl: 'http://test/oauth/token',
    };

    const validRequest: RateRequest = {
        origin: { name: 'Test', street1: '123 St', city: 'City', stateProvince: 'ST', postalCode: '12345', countryCode: 'US' },
        destination: { name: 'Test', street1: '123 St', city: 'City', stateProvince: 'ST', postalCode: '12345', countryCode: 'US' },
        packages: [{ weight: { value: 10, unit: 'LBS' }, dimensions: { length: 10, width: 10, height: 10, unit: 'IN' } }],
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
        const invalidRequest: Partial<RateRequest> = {};

        await expect(carrier.getRates(invalidRequest as RateRequest)).rejects.toThrow(ValidationError);
    });
});
