import { IAuthProvider, ICarrierConfig } from '../types/carrier';
import { HttpClient } from '../http/http-client';
import { AuthenticationError } from '../types/errors';

interface TokenResponse {
    access_token: string;
    expires_in: string; // Returns as string in seconds, e.g., "14399"
    status: string;
    token_type: string;
    issued_at: string;
    client_id: string;
}

export class UpsAuthProvider implements IAuthProvider {
    private token: string | null = null;
    private expiresAt: number = 0;
    private httpClient: HttpClient;

    constructor(private config: ICarrierConfig, httpClient?: HttpClient) {
        this.httpClient = httpClient || new HttpClient();
    }

    public async getAccessToken(): Promise<string> {
        if (this.token && this.isValid()) {
            return this.token;
        }
        return this.refreshToken();
    }

    public invalidateToken(): void {
        this.token = null;
        this.expiresAt = 0;
    }

    private isValid(): boolean {
        // Refresh 5 minutes (300000ms) before actual expiry provided by UPS
        return Date.now() < (this.expiresAt - 300000);
    }

    private async refreshToken(): Promise<string> {
        try {
            const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

            const response = await this.httpClient.request<TokenResponse>({
                method: 'POST',
                url: this.config.authUrl,
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-merchant-id': this.config.accountNumber,
                },
                data: new URLSearchParams({
                    grant_type: 'client_credentials',
                }).toString(),
            }, 'UPS');

            this.token = response.access_token;
            // expires_in is seconds, convert to ms and add to current time
            const expiresInMs = parseInt(response.expires_in, 10) * 1000;
            this.expiresAt = Date.now() + expiresInMs;

            return this.token;
        } catch (error) {
            throw new AuthenticationError('Failed to retrieve access token', 'UPS', error);
        }
    }
}
