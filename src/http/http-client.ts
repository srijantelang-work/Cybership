import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { NetworkError, ApiError, RateLimitError, CarrierError } from '../types/errors';

export class HttpClient {
    private client: AxiosInstance;

    constructor(baseURL?: string, timeout: number = 10000) {
        this.client = axios.create({
            baseURL,
            timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    public async request<T>(config: AxiosRequestConfig, carrierName: string): Promise<T> {
        try {
            const response = await this.client.request<T>(config);
            return response.data;
        } catch (error) {
            this.handleError(error, carrierName);
            throw error; // accessing undefined handling
        }
    }

    protected handleError(error: any, carrierName: string): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;

            if (!axiosError.response) {
                throw new NetworkError(axiosError.message, carrierName, { originalError: error });
            }

            const status = axiosError.response.status;
            const data = axiosError.response.data;

            if (status === 429) {
                throw new RateLimitError('Rate limit exceeded', carrierName, { retryAfter: axiosError.response.headers['retry-after'] });
            }

            throw new ApiError(
                'API_ERROR',
                `Request failed with status ${status}`,
                carrierName,
                status,
                data
            );
        }

        throw new CarrierError('UNKNOWN_ERROR', 'An unknown error occurred', carrierName, { originalError: error });
    }
}
