import { ICarrier } from '../types/carrier';
import { RateRequest, RateResponse } from '../types/rate';

export abstract class BaseCarrier implements ICarrier {
    abstract name: string;
    abstract getRates(request: RateRequest): Promise<RateResponse>;
}

export class CarrierRegistry {
    private carriers: Map<string, ICarrier> = new Map();

    constructor() { }

    public register(carrier: ICarrier): void {
        if (this.carriers.has(carrier.name)) {
            console.warn(`Carrier ${carrier.name} is already registered. Overwriting.`);
        }
        this.carriers.set(carrier.name, carrier);
    }

    public get(name: string): ICarrier {
        const carrier = this.carriers.get(name);
        if (!carrier) {
            throw new Error(`Carrier ${name} not found`);
        }
        return carrier;
    }

    public getAll(): ICarrier[] {
        return Array.from(this.carriers.values());
    }
}

// Export specific carriers
export * from './ups/ups-carrier';
