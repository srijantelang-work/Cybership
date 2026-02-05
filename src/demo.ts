import { UpsCarrier } from './carriers/ups/ups-carrier';
import { ICarrierConfig } from './types/carrier';
import { HttpClient } from './http/http-client';
import { RateRequest } from './types/rate';

// Verbose Mock Client with detailed logging
class DemoMockClient extends HttpClient {
    async request<T>(config: any, carrier: string): Promise<T> {
        console.log('\n' + '='.repeat(60));
        console.log(`📡 HTTP REQUEST`);
        console.log('='.repeat(60));
        console.log(`Method: ${config.method}`);
        console.log(`URL: ${config.url}`);
        console.log(`Headers:`, JSON.stringify(config.headers, null, 2));

        if (config.url?.includes('oauth')) {
            console.log(`Body: grant_type=client_credentials`);

            const tokenResponse = {
                access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.mock_token_12345',
                expires_in: '14399',
                status: 'approved',
                token_type: 'Bearer',
                issued_at: Date.now().toString(),
                client_id: 'demo_client_id'
            };

            console.log('\n' + '-'.repeat(60));
            console.log(`✅ OAUTH RESPONSE`);
            console.log('-'.repeat(60));
            console.log(JSON.stringify(tokenResponse, null, 2));

            return tokenResponse as any;
        }

        if (config.url?.includes('Shop')) {
            console.log(`Body (Rate Request):`, JSON.stringify(config.data, null, 2));

            const rateResponse = {
                RateResponse: {
                    Response: {
                        ResponseStatus: { Code: "1", Description: "Success" }
                    },
                    RatedShipment: [
                        {
                            Service: { Code: "03", Description: "UPS Ground" },
                            TotalCharges: { CurrencyCode: "USD", MonetaryValue: "15.00" },
                            GuaranteedDelivery: { BusinessDaysInTransit: "5" }
                        },
                        {
                            Service: { Code: "02", Description: "UPS 2nd Day Air" },
                            TotalCharges: { CurrencyCode: "USD", MonetaryValue: "35.50" },
                            GuaranteedDelivery: { BusinessDaysInTransit: "2" }
                        },
                        {
                            Service: { Code: "01", Description: "UPS Next Day Air" },
                            TotalCharges: { CurrencyCode: "USD", MonetaryValue: "65.00" },
                            GuaranteedDelivery: { BusinessDaysInTransit: "1" }
                        }
                    ]
                }
            };

            console.log('\n' + '-'.repeat(60));
            console.log(`✅ UPS RATING API RESPONSE`);
            console.log('-'.repeat(60));
            console.log(JSON.stringify(rateResponse, null, 2));

            return rateResponse as any;
        }

        return {} as any;
    }
}

async function runDemo() {
    console.log('🚀 CARRIER INTEGRATION SERVICE - DEMO');
    console.log('=====================================\n');

    // Configuration
    const config: ICarrierConfig = {
        clientId: 'demo_client_id',
        clientSecret: 'demo_client_secret_xxxxx',
        accountNumber: '123456',
        baseUrl: 'https://onlinetools.ups.com',
        authUrl: 'https://onlinetools.ups.com/security/v1/oauth/token',
    };

    console.log('📋 CONFIGURATION:');
    console.log(`   Client ID: ${config.clientId}`);
    console.log(`   Account: ${config.accountNumber}`);
    console.log(`   API Base: ${config.baseUrl}`);

    // Initialize carrier
    const carrier = new UpsCarrier(config, new DemoMockClient());
    console.log(`\n✅ Initialized carrier: ${carrier.name}`);

    // Build the rate request
    const request: RateRequest = {
        origin: {
            name: 'Sender Corp',
            street1: '123 Main Street',
            city: 'New York',
            stateProvince: 'NY',
            postalCode: '10001',
            countryCode: 'US',
        },
        destination: {
            name: 'Receiver Inc',
            street1: '456 Hollywood Blvd',
            city: 'Los Angeles',
            stateProvince: 'CA',
            postalCode: '90028',
            countryCode: 'US',
        },
        packages: [
            {
                weight: { value: 5, unit: 'LBS' },
                dimensions: { length: 12, width: 8, height: 6, unit: 'IN' },
            },
        ],
    };

    console.log('\n📦 RATE REQUEST (Your Input):');
    console.log('-'.repeat(40));
    console.log(`From: ${request.origin.name}`);
    console.log(`      ${request.origin.street1}, ${request.origin.city}, ${request.origin.stateProvince} ${request.origin.postalCode}`);
    console.log(`To:   ${request.destination.name}`);
    console.log(`      ${request.destination.street1}, ${request.destination.city}, ${request.destination.stateProvince} ${request.destination.postalCode}`);
    console.log(`Package: ${request.packages[0].weight.value} ${request.packages[0].weight.unit}, ${request.packages[0].dimensions.length}x${request.packages[0].dimensions.width}x${request.packages[0].dimensions.height} ${request.packages[0].dimensions.unit}`);

    try {
        console.log('\n🔄 PROCESSING...');
        console.log('   Step 1: Validating input...');
        console.log('   Step 2: Getting OAuth token...');

        const response = await carrier.getRates(request);

        console.log('\n' + '='.repeat(60));
        console.log('📊 FINAL NORMALIZED RESPONSE (What You Get Back)');
        console.log('='.repeat(60));
        console.log(`Timestamp: ${response.timestamp.toISOString()}`);
        console.log(`Number of quotes: ${response.quotes.length}`);
        console.log('\nAvailable Shipping Options:');
        console.log('-'.repeat(40));

        response.quotes.forEach((quote, index) => {
            console.log(`\n  Option ${index + 1}: ${quote.service}`);
            console.log(`    Service Code: ${quote.serviceCode}`);
            console.log(`    Price: $${quote.totalCost.amount.toFixed(2)} ${quote.totalCost.currency}`);
            if (quote.transitDays) {
                console.log(`    Transit Time: ${quote.transitDays} business days`);
            }
        });

        console.log('\n' + '='.repeat(60));
        console.log('✅ DEMO COMPLETE');
        console.log('='.repeat(60));

    } catch (err) {
        console.error('\n❌ Error:', err);
    }
}

runDemo();
