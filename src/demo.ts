import * as readline from 'readline';
import { UpsCarrier } from './carriers/ups/ups-carrier';
import { ICarrierConfig } from './types/carrier';
import { HttpClient } from './http/http-client';
import { RateRequest } from './types/rate';
import { TokenResponse, UPSRateResponse } from './carriers/ups/types';

// Mock HTTP Client with proper types (no 'as any')
class DemoMockClient extends HttpClient {
    private weight: number = 5;

    setWeight(w: number) { this.weight = w; }

    async request<T>(config: { url?: string }, carrier: string): Promise<T> {
        if (config.url?.includes('oauth')) {
            const tokenResponse: TokenResponse = {
                access_token: 'mock_token_12345',
                expires_in: '14399',
                token_type: 'Bearer',
            };
            return tokenResponse as T;
        }
        if (config.url?.includes('Shop')) {
            const groundPrice = 5 + (this.weight * 2);
            const twoDayPrice = 15 + (this.weight * 5);
            const nextDayPrice = 30 + (this.weight * 10);

            const rateResponse: UPSRateResponse = {
                RateResponse: {
                    Response: { ResponseStatus: { Code: '1' } },
                    RatedShipment: [
                        {
                            Service: { Code: '03', Description: 'UPS Ground' },
                            TotalCharges: { CurrencyCode: 'USD', MonetaryValue: groundPrice.toFixed(2) },
                            GuaranteedDelivery: { BusinessDaysInTransit: '5' },
                        },
                        {
                            Service: { Code: '02', Description: 'UPS 2nd Day Air' },
                            TotalCharges: { CurrencyCode: 'USD', MonetaryValue: twoDayPrice.toFixed(2) },
                            GuaranteedDelivery: { BusinessDaysInTransit: '2' },
                        },
                        {
                            Service: { Code: '01', Description: 'UPS Next Day Air' },
                            TotalCharges: { CurrencyCode: 'USD', MonetaryValue: nextDayPrice.toFixed(2) },
                            GuaranteedDelivery: { BusinessDaysInTransit: '1' },
                        },
                    ],
                },
            };
            return rateResponse as T;
        }
        throw new Error('Unknown endpoint');
    }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise(resolve => rl.question(q, resolve));

async function runDemo() {
    console.log('\n🚀 CARRIER RATE SHOPPING DEMO\n');

    console.log('📍 ORIGIN ADDRESS:');
    const originCity = await ask('   City: ');
    const originState = await ask('   State (e.g. NY): ');
    const originZip = await ask('   Zip Code: ');

    console.log('\n📍 DESTINATION ADDRESS:');
    const destCity = await ask('   City: ');
    const destState = await ask('   State (e.g. CA): ');
    const destZip = await ask('   Zip Code: ');

    console.log('\n📦 PACKAGE:');
    const weight = parseFloat(await ask('   Weight (lbs): ')) || 5;

    rl.close();

    const request: RateRequest = {
        origin: { name: 'Sender', street1: '123 Main St', city: originCity, stateProvince: originState, postalCode: originZip, countryCode: 'US' },
        destination: { name: 'Receiver', street1: '456 Other St', city: destCity, stateProvince: destState, postalCode: destZip, countryCode: 'US' },
        packages: [{ weight: { value: weight, unit: 'LBS' }, dimensions: { length: 10, width: 10, height: 10, unit: 'IN' } }],
    };

    console.log('\n⏳ Fetching rates...\n');

    const config: ICarrierConfig = { clientId: 'demo', clientSecret: 'demo', accountNumber: '123456', baseUrl: 'https://ups.com', authUrl: 'https://ups.com/oauth' };
    const mockClient = new DemoMockClient();
    mockClient.setWeight(weight);
    const carrier = new UpsCarrier(config, mockClient);

    try {
        const response = await carrier.getRates(request);

        console.log('✅ SHIPPING OPTIONS:\n');
        console.log(`   From: ${originCity}, ${originState} ${originZip}`);
        console.log(`   To:   ${destCity}, ${destState} ${destZip}`);
        console.log(`   Weight: ${weight} lbs\n`);

        console.log('   📊 PRICING FORMULA (Mock):');
        console.log('   Ground:   $5 base + $2/lb');
        console.log('   2-Day:    $15 base + $5/lb');
        console.log('   Next Day: $30 base + $10/lb\n');

        console.log('   ' + '-'.repeat(40));
        response.quotes.forEach((q, i) => {
            console.log(`   ${i + 1}. ${q.service.padEnd(20)} $${q.totalCost.amount.toFixed(2)} (${q.transitDays} days)`);
        });
        console.log('   ' + '-'.repeat(40) + '\n');
    } catch (err: unknown) {
        const error = err as Error;
        console.error('❌ Error:', error.message);
    }
}

runDemo();
