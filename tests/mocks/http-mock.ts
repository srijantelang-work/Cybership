import { HttpClient } from '../../src/http/http-client';
import { AxiosRequestConfig } from 'axios';

export class MockHttpClient extends HttpClient {
    private mocks: Map<string, any> = new Map();

    constructor() {
        super();
    }

    // Register a mock response for a specific URL or partial URL
    public mockResponse(urlFragment: string, response: any) {
        this.mocks.set(urlFragment, response);
    }

    public async request<T>(config: AxiosRequestConfig, carrierName: string): Promise<T> {
        const url = config.url || '';

        // Simple matching: find first key that is contained in the request URL
        for (const [key, response] of this.mocks.entries()) {
            if (url.includes(key)) {
                return Promise.resolve(response as T);
            }
        }

        throw new Error(`No mock found for URL: ${url}`);
    }
}
