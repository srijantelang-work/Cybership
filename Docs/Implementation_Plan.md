Carrier Integration Service - Implementation Plan
Build an extensible TypeScript shipping carrier integration service that wraps the UPS Rating API with OAuth 2.0 authentication, designed for easy extension to additional carriers (FedEx, USPS, DHL) and operations (labels, tracking).

User Review Required
IMPORTANT

No UPS API credentials: Per the assignment, we will stub/mock all HTTP calls. Integration tests will use realistic payloads from UPS documentation.

NOTE

Estimated Time: 2-4 hours as per assignment guidelines. I'll prioritize architecture quality over completeness.

Proposed Changes
Project Structure
carrier-integration-service/
├── src/
│   ├── types/                    # Domain models & interfaces
│   │   ├── index.ts             # Re-exports
│   │   ├── address.ts           # Address type + Zod schema
│   │   ├── package.ts           # Package dimensions/weight
│   │   ├── rate.ts              # RateRequest, RateResponse, RateQuote
│   │   ├── errors.ts            # Structured error types
│   │   └── carrier.ts           # ICarrier, IAuthProvider interfaces
│   ├── auth/                     # Authentication layer
│   │   ├── index.ts
│   │   ├── auth-provider.ts     # Base auth interface
│   │   └── ups-oauth.ts         # UPS OAuth 2.0 implementation
│   ├── carriers/                 # Carrier implementations
│   │   ├── index.ts             # Registry/factory
│   │   ├── base-carrier.ts      # Abstract base class
│   │   └── ups/
│   │       ├── index.ts
│   │       ├── ups-carrier.ts   # UPS carrier implementation
│   │       ├── mappers.ts       # Domain ↔ UPS API mappers
│   │       └── types.ts         # UPS-specific API types
│   ├── http/                     # HTTP abstraction
│   │   ├── index.ts
│   │   └── http-client.ts       # Wraps fetch with error handling
│   ├── config/                   # Configuration
│   │   └── index.ts             # Env var loading + validation
│   └── index.ts                  # Main exports
├── tests/
│   ├── fixtures/                 # Mock API responses
│   │   ├── ups-rate-response.json
│   │   ├── ups-token-response.json
│   │   └── ups-error-responses.json
│   ├── integration/
│   │   ├── ups-rating.test.ts   # End-to-end rate shopping tests
│   │   ├── ups-auth.test.ts     # OAuth lifecycle tests
│   │   └── error-handling.test.ts
│   └── mocks/
│       └── http-mock.ts         # HTTP layer mock
├── .env.example
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
Component: Configuration
[NEW] 
.env.example
Note: No real credentials needed - all HTTP calls are mocked for testing.
This file documents the configuration structure for production use:

UPS_CLIENT_ID=placeholder
UPS_CLIENT_SECRET=placeholder
UPS_ACCOUNT_NUMBER=placeholder
UPS_API_BASE_URL=https://onlinetools.ups.com
UPS_OAUTH_URL=https://onlinetools.ups.com/security/v1/oauth/token
[NEW] 
src/config/index.ts
Load environment variables with validation using Zod
Throw descriptive errors for missing/invalid config
Component: Domain Types & Validation
[NEW] 
src/types/address.ts
// Carrier-agnostic address model
interface Address {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string; // ISO 3166-1 alpha-2
}
// + Zod schema for runtime validation
[NEW] 
src/types/package.ts
interface Package {
  weight: { value: number; unit: 'LBS' | 'KGS' };
  dimensions: { length: number; width: number; height: number; unit: 'IN' | 'CM' };
}
[NEW] 
src/types/rate.ts
interface RateRequest {
  origin: Address;
  destination: Address;
  packages: Package[];
  serviceLevel?: string; // Optional: specific service code
}
interface RateQuote {
  carrier: string;
  service: string;
  serviceCode: string;
  totalCost: { amount: number; currency: string };
  transitDays?: number;
  deliveryDate?: string;
}
interface RateResponse {
  request: RateRequest;
  quotes: RateQuote[];
  timestamp: Date;
}
[NEW] 
src/types/errors.ts
Structured error hierarchy:

CarrierError - Base error with code, message, carrier name
AuthenticationError - Token acquisition/refresh failures
ValidationError - Input validation failures
NetworkError - Timeout, connection refused
RateLimitError - 429 responses
ApiError - 4xx/5xx from carrier API
Component: OAuth 2.0 Authentication
[NEW] 
src/auth/auth-provider.ts
interface IAuthProvider {
  getToken(): Promise<string>;
  invalidateToken(): void;
}
[NEW] 
src/auth/ups-oauth.ts
Implements UPS OAuth 2.0 client credentials:

Token acquisition via BASE64(client_id:client_secret)
Token caching with expiry tracking (typically 14400s = 4 hours)
Automatic refresh before expiry
Thread-safe token access
Component: HTTP Abstraction
[NEW] 
src/http/http-client.ts
Abstracted HTTP client:

Wrapper around fetch for testability
Configurable timeout handling
Structured error conversion (HTTP codes → our error types)
JSON parsing with error handling for malformed responses
Component: UPS Carrier Implementation
[NEW] 
src/carriers/ups/types.ts
UPS-specific API shapes (request/response formats from UPS docs):

interface UPSRateRequest {
  RateRequest: {
    Request: { /* ... */ };
    Shipment: {
      Shipper: UPSAddress;
      ShipTo: UPSAddress;
      Package: UPSPackage[];
      Service?: { Code: string };
    };
  };
}
[NEW] 
src/carriers/ups/mappers.ts
Transform between domain models and UPS API formats:

toUPSRateRequest(request: RateRequest): UPSRateRequest
fromUPSRateResponse(response: UPSRateResponse): RateQuote[]
[NEW] 
src/carriers/ups/ups-carrier.ts
Main UPS carrier class implementing ICarrier:

getRates(request: RateRequest): Promise<RateResponse>
Handles auth header injection
Uses mappers for request/response transformation
Component: Carrier Registry (Extensibility)
[NEW] 
src/carriers/index.ts
Factory/registry pattern:

class CarrierRegistry {
  register(name: string, carrier: ICarrier): void;
  get(name: string): ICarrier;
  getAll(): ICarrier[];
}
This ensures adding FedEx = new file + registry registration, no changes to UPS code.

Verification Plan
Automated Tests (Jest)
All tests run with: npm test

Test File	What It Verifies
tests/integration/ups-rating.test.ts	Request payload built correctly from domain models; response parsed to RateQuote[]
tests/integration/ups-auth.test.ts	Token acquisition, caching, reuse, and refresh on expiry
tests/integration/error-handling.test.ts	4xx, 5xx, malformed JSON, timeouts produce correct structured errors
Mock approach:

HTTP layer is mocked via dependency injection
Test fixtures contain realistic UPS API payloads
Each test scenario verifies specific behavior
Test Commands
# Install dependencies
npm install
# Run all tests
npm test
# Run with coverage
npm test -- --coverage
# Run specific test file
npm test -- ups-rating.test.ts
Manual Verification
A CLI demo script will be provided (src/demo.ts) that:

Shows how to initialize the service
Makes a mock rate request
Outputs normalized quotes
Run with: npx ts-node src/demo.ts

Design Decisions
Zod for validation: Runtime type safety + TypeScript types from single source
Dependency injection for HTTP: Enables testing without network calls
Token caching with expiry buffer: Refresh tokens 5 minutes before expiry to avoid mid-request failures
Carrier registry pattern: New carriers register themselves, no central switch statements
Structured errors: Every error has code, message, carrier, and optional details
