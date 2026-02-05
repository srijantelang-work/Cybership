import { ICarrier, ICarrierConfig } from '../../types/carrier';
import { RateRequest, RateResponse, RateRequestSchema } from '../../types/rate';
import { HttpClient } from '../../http/http-client';
import { UpsAuthProvider } from '../../auth/ups-oauth';
import { UPSMapper } from './mappers';
import { UPSRateResponseSchema } from './types';
import { ValidationError } from '../../types/errors';

export class UpsCarrier implements ICarrier {
    public name = 'UPS';
    private authProvider: UpsAuthProvider;
    private httpClient: HttpClient;
    private config: ICarrierConfig;

    constructor(config: ICarrierConfig, httpClient?: HttpClient) {
        this.config = config;
        this.httpClient = httpClient || new HttpClient(config.baseUrl);
        this.authProvider = new UpsAuthProvider(config, this.httpClient);
    }

    public async getRates(request: RateRequest): Promise<RateResponse> {
        // 1. Validate Input with Zod
        const inputValidation = RateRequestSchema.safeParse(request);
        if (!inputValidation.success) {
            throw new ValidationError('Invalid rate request', inputValidation.error.format());
        }

        // 2. Get Access Token
        const token = await this.authProvider.getAccessToken();

        // 3. Map to UPS Request
        const upsRequest = UPSMapper.toUPSRequest(request);

        // 4. Make API Call
        const rawResponse = await this.httpClient.request<unknown>({
            method: 'POST',
            url: '/rating/v1/Shop',
            headers: {
                'Authorization': `Bearer ${token}`,
                'transactionSrc': 'testing',
            },
            data: upsRequest,
        }, this.name);

        // 5. Parse and Validate Response with Zod
        const responseValidation = UPSRateResponseSchema.safeParse(rawResponse);
        if (!responseValidation.success) {
            throw new ValidationError('Invalid response from UPS API', responseValidation.error.format());
        }

        // 6. Map to Domain Response
        return UPSMapper.toRateResponse(responseValidation.data, request);
    }
}
