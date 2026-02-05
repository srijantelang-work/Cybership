 Carrier Integration Service

A TypeScript shipping carrier integration service wrapping the UPS Rating API with OAuth 2.0 authentication.

> Note: All HTTP calls are mocked — no real UPS credentials required.

 How to Run

Prerequisites: Node.js (v18+)

1. Install dependencies
  ```bash
  npm install
  ```

2. Run the interactive demo — Enter origin, destination, and package weight to get shipping rates.
  ```bash
  npm start
  ```
  The demo will prompt for:
  - Origin (city, state, zip)
  - Destination (city, state, zip)
  - Package weight (lbs)

3. Run tests
  ```bash
  npm test
  ```

 Mock Pricing Logic

Since real UPS API credentials are not available, the demo uses a mock pricing formula:

| Service | Formula |
|---------|---------|
| UPS Ground | $5 + $2/lb |
| UPS 2nd Day Air | $15 + $5/lb |
| UPS Next Day Air | $30 + $10/lb |

Example: A 10 lb package → Ground: $25, 2-Day: $65, Next Day: $130

 Design Decisions

1. Dependency Injection — HTTP client is injected, making testing easy.
2. Zod Validation — Single source for types and runtime validation.
3. Token Caching — OAuth tokens cached and refreshed before expiry.
4. Carrier Registry — New carriers plug in without touching existing code.
5. Structured Errors — All errors have code, message, and carrier name.

 What I Would Improve Given More Time

1. Rate Quote Caching — Cache identical requests to reduce API calls.
2. Additional Carriers — Add FedEx/USPS to prove extensibility.
3. Webhooks — Push-based tracking updates instead of polling.




