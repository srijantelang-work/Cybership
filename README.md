 Carrier Integration Service

A TypeScript shipping carrier integration service wrapping the UPS Rating API with OAuth 2.0 authentication.

> Note: All HTTP calls are mocked — no real UPS credentials required.

 How to Run

Prerequisites: Node.js (v18+)

1. Install dependencies
  ```bash
  npm install
  ```

2. Run the demo — Simulates a rate shopping request from New York to Los Angeles, showing authentication, API call, and normalized response.
  ```bash
  npm start
  ```

3. Run tests — Executes integration tests verifying rate shopping, error handling, and validation.
  ```bash
  npm test
  ```

 Design Decisions

1. Dependency Injection — HTTP client is injected, making testing easy.
2. Zod Validation — Single source for types and runtime validation.
3. Token Caching — OAuth tokens cached and refreshed before expiry.
4. Carrier Registry — New carriers plug in without touching existing code.
5. Structured Errors — All errors have code, message, and carrier name.

 What I Would Improve Given More Time

1. Rate Quote Caching 
  Cache identical rate requests for a short TTL. Reduces API calls and latency for repeated queries.

2. Additional Carriers as Proof of Extensibility 
  Implement FedEx or USPS to demonstrate the architecture truly supports multi-carrier without modification.

3. Webhooks for Async Updates 
  Support push-based tracking updates instead of polling, using carrier webhook integrations.




