import { RateRequest, RateResponse } from './rate';

export interface IAuthProvider {
    getAccessToken(): Promise<string>;
    invalidateToken(): void;
}

export interface ICarrier {
    name: string;
    getRates(request: RateRequest): Promise<RateResponse>;
}

export interface ICarrierConfig {
    clientId: string;
    clientSecret: string;
    accountNumber?: string;
    baseUrl: string;
    authUrl?: string;
    [key: string]: any;
}
